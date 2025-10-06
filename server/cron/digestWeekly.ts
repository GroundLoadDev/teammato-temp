/**
 * Weekly Digest Cron Job
 * 
 * Sends a weekly digest of feedback that has met k-anonymity thresholds
 * Runs every Monday at 9 AM UTC
 */

import { storage } from "../storage";
import { WebClient } from "@slack/web-api";

const K_ANONYMITY_THRESHOLD = 5;

interface DigestTopic {
  topicName: string;
  threads: Array<{
    threadId: string;
    participantCount: number;
    createdAt: string;
  }>;
}

/**
 * Generate digest content for an organization
 * Returns formatted digest with threads that meet k-anonymity threshold
 */
export async function generateDigest(orgId: string): Promise<{
  topics: DigestTopic[];
  totalThreads: number;
} | null> {
  try {
    // Get all threads for the org
    const threads = await storage.getFeedbackThreads(orgId);
    
    // Calculate one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Filter threads by k-anonymity threshold and created within the last week
    const visibleThreads = await Promise.all(
      threads.map(async (thread) => {
        if (!thread.topicId) return null;
        
        // Only include threads from the last week
        const createdAt = new Date(thread.createdAt);
        if (createdAt < oneWeekAgo) return null;
        
        const participantCount = await storage.getTopicParticipantCount(thread.topicId, orgId);
        if (participantCount >= K_ANONYMITY_THRESHOLD && thread.moderationStatus === 'approved') {
          return { ...thread, participantCount };
        }
        return null;
      })
    );
    
    const filteredThreads = visibleThreads.filter(t => t !== null);
    
    if (filteredThreads.length === 0) {
      return null;
    }
    
    // Group by topic
    const topicMap = new Map<string, DigestTopic>();
    
    for (const thread of filteredThreads) {
      if (!thread || !thread.topicId) continue;
      
      const topic = await storage.getTopic(thread.topicId, orgId);
      if (!topic) continue;
      
      if (!topicMap.has(thread.topicId)) {
        topicMap.set(thread.topicId, {
          topicName: topic.name,
          threads: [],
        });
      }
      
      topicMap.get(thread.topicId)!.threads.push({
        threadId: thread.id || 'unknown',
        participantCount: thread.participantCount,
        createdAt: new Date(thread.createdAt).toLocaleDateString(),
      });
    }
    
    return {
      topics: Array.from(topicMap.values()),
      totalThreads: filteredThreads.length,
    };
  } catch (error) {
    console.error('Failed to generate digest:', error);
    return null;
  }
}

/**
 * Format digest as Slack message blocks
 */
function formatDigestMessage(
  digest: { topics: DigestTopic[]; totalThreads: number },
  orgName: string,
  dashboardUrl: string
): any[] {
  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📊 *Weekly Feedback Digest for ${orgName}*\n\n${digest.totalThreads} feedback threads met privacy thresholds this week.`
      }
    },
    {
      type: 'divider'
    }
  ];
  
  for (const topic of digest.topics) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${topic.topicName}* (${topic.threads.length} threads)`
      }
    });
    
    const threadList = topic.threads
      .slice(0, 5) // Limit to 5 per topic
      .map(t => `• Thread #${t.threadId.slice(0, 8)}... _(${t.participantCount} participants, ${t.createdAt})_`)
      .join('\n');
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: threadList
      }
    });
    
    if (topic.threads.length > 5) {
      blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `_...and ${topic.threads.length - 5} more threads_`
        }]
      });
    }
  }
  
  blocks.push(
    {
      type: 'divider'
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Full Dashboard'
          },
          url: dashboardUrl,
          style: 'primary'
        }
      ]
    }
  );
  
  return blocks;
}

/**
 * Send digest to admins for an organization
 */
export async function sendDigestToOrg(orgId: string): Promise<boolean> {
  try {
    const org = await storage.getOrg(orgId);
    if (!org) return false;
    
    const slackTeam = await storage.getSlackTeamByOrgId(orgId);
    if (!slackTeam || !slackTeam.accessToken) {
      console.log(`[Digest] No Slack integration for org ${orgId}`);
      return false;
    }
    
    const digest = await generateDigest(orgId);
    if (!digest) {
      console.log(`[Digest] No content for org ${orgId}`);
      return false;
    }
    
    // Get admin and owner users
    const users = await storage.getOrgUsers(orgId);
    const admins = users.filter(u => u.role === 'owner' || u.role === 'admin');
    
    if (admins.length === 0) {
      console.log(`[Digest] No admins found for org ${orgId}`);
      return false;
    }
    
    const dashboardUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/admin/feedback`;
    const blocks = formatDigestMessage(digest, org.name, dashboardUrl);
    
    const client = new WebClient(slackTeam.accessToken);
    
    // Send to each admin
    for (const admin of admins) {
      if (!admin.slackUserId) continue;
      
      try {
        await client.chat.postMessage({
          channel: admin.slackUserId,
          text: `📊 Weekly Feedback Digest for ${org.name}`,
          blocks,
        });
        console.log(`[Digest] Sent to ${admin.email} in org ${orgId}`);
      } catch (error) {
        console.error(`[Digest] Failed to send to ${admin.email}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[Digest] Error sending digest for org ${orgId}:`, error);
    return false;
  }
}

/**
 * Run weekly digest for all organizations
 */
export async function runWeeklyDigest() {
  console.log('[Weekly Digest] Starting...');
  
  try {
    const orgsWithSlack = await storage.getAllOrgsWithSlack();
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const { orgId } of orgsWithSlack) {
      const success = await sendDigestToOrg(orgId);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log(`[Weekly Digest] Complete: ${successCount} sent, ${errorCount} skipped/failed`);
  } catch (error) {
    console.error('[Weekly Digest] Fatal error:', error);
  }
}

/**
 * Start the weekly digest cron job
 * Runs every Monday at 9 AM UTC
 */
export function startWeeklyDigestCron() {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  
  // Calculate time until next Monday 9 AM UTC
  const now = new Date();
  const nextMonday = new Date(now);
  
  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const currentDay = now.getUTCDay();
  
  // Calculate days until next Monday
  let daysUntilMonday;
  if (currentDay === 1) {
    // It's Monday - check if it's before 9 AM
    daysUntilMonday = 0;
  } else if (currentDay === 0) {
    // It's Sunday - Monday is tomorrow
    daysUntilMonday = 1;
  } else {
    // It's Tuesday-Saturday - calculate days until next Monday
    daysUntilMonday = 8 - currentDay;
  }
  
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(9, 0, 0, 0);
  
  // If it's already past the scheduled time, schedule for next Monday
  if (nextMonday <= now) {
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
  }
  
  const msUntilNext = nextMonday.getTime() - now.getTime();
  
  console.log(`[Weekly Digest] Scheduled for ${nextMonday.toISOString()}`);
  
  // Schedule first run
  setTimeout(() => {
    runWeeklyDigest();
    
    // Then run weekly
    setInterval(runWeeklyDigest, WEEK_MS);
  }, msUntilNext);
}

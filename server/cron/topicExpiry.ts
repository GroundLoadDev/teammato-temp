import { storage } from '../storage';
import { sendTopicOwnerReminder } from '../utils/slackMessaging';

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Auto-lock expired topics and notify owners
export async function processExpiredTopics() {
  try {
    console.log('[CRON] Processing expired topics...');
    
    const expiredTopics = await storage.getExpiredTopics();
    
    for (const topic of expiredTopics) {
      console.log(`[CRON] Locking expired topic: ${topic.name} (${topic.id})`);
      
      // Update status to 'in_review' and mark as inactive
      await storage.updateTopic(topic.id, {
        status: 'in_review',
        isActive: false,
      }, topic.orgId);
      
      // Send reminder to topic owner if they have one
      if (topic.ownerId) {
        const slackTeam = await storage.getSlackTeamByOrgId(topic.orgId);
        if (slackTeam) {
          const owner = await storage.getUser(topic.ownerId);
          if (owner && owner.slackUserId) {
            sendTopicOwnerReminder(slackTeam.accessToken, owner.slackUserId, topic.name, topic.id)
              .catch(err => console.error('[CRON] Failed to send owner reminder:', err));
          }
        }
      }
    }
    
    console.log(`[CRON] Expired topics check complete (processed ${expiredTopics.length} topics)`);
  } catch (error) {
    console.error('[CRON] Error processing expired topics:', error);
  }
}

// Run every hour
export function startTopicExpiryCron() {
  // Check every hour
  const INTERVAL = 60 * 60 * 1000; // 1 hour
  
  setInterval(async () => {
    await processExpiredTopics();
  }, INTERVAL);
  
  // Run once on startup
  processExpiredTopics();
  
  console.log('[CRON] Topic expiry cron started (runs hourly)');
}

// Auto-close expired instances and create next instances
export async function processExpiredInstances() {
  try {
    console.log('[CRON] Processing expired general feedback instances...');
    
    const expiredInstances = await storage.getExpiredInstances();
    
    for (const instance of expiredInstances) {
      console.log(`[CRON] Closing expired instance: ${instance.name} (${instance.id})`);
      
      // Update status to 'in_review' and mark as inactive
      await storage.updateTopic(instance.id, {
        status: 'in_review',
        isActive: false,
      }, instance.orgId);
      
      // Create next instance if this was a general feedback instance
      if (instance.parentTopicId) {
        console.log(`[CRON] Creating next instance for parent: ${instance.parentTopicId}`);
        
        // Calculate next instance window
        const now = new Date();
        const parent = await storage.getTopic(instance.parentTopicId, instance.orgId);
        
        if (parent) {
          const windowEnd = new Date(now);
          windowEnd.setDate(windowEnd.getDate() + parent.windowDays);
          
          // Generate instance identifier (e.g., "2025-W42")
          const weekNumber = getWeekNumber(now);
          const year = now.getFullYear();
          const instanceIdentifier = `${year}-W${weekNumber}`;
          
          // Create next instance
          await storage.createGeneralFeedbackInstance(
            instance.parentTopicId,
            instance.orgId,
            now,
            windowEnd,
            instanceIdentifier
          );
          
          console.log(`[CRON] Created new instance: ${instanceIdentifier}`);
        }
      }
    }
    
    console.log(`[CRON] Instance rotation complete (processed ${expiredInstances.length} instances)`);
  } catch (error) {
    console.error('[CRON] Error processing expired instances:', error);
  }
}

// Run instance rotation alongside topic expiry
export function startInstanceRotationCron() {
  // Check every hour
  const INTERVAL = 60 * 60 * 1000; // 1 hour
  
  setInterval(async () => {
    await processExpiredInstances();
  }, INTERVAL);
  
  // Run once on startup
  processExpiredInstances();
  
  console.log('[CRON] Instance rotation cron started (runs hourly)');
}

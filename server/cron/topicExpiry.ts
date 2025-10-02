import { storage } from '../storage';
import { sendTopicOwnerReminder } from '../utils/slackMessaging';

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

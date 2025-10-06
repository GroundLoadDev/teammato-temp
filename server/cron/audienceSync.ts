/**
 * Audience Sync Cron Job
 * 
 * Runs nightly to recompute eligible member counts for all organizations
 * Ensures seat cap enforcement uses up-to-date data
 */

import { storage } from "../storage";
import { recomputeEligibleCount } from "../services/audience";

/**
 * Sync eligible counts for all organizations
 * Runs nightly at 2 AM UTC
 */
export async function syncAllOrgAudiences() {
  console.log('[Audience Sync] Starting nightly sync...');
  
  try {
    // Get all orgs with Slack integration
    const orgs = await storage.getAllOrgsWithSlack();
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const { orgId, accessToken } of orgs) {
      try {
        // Get current audience settings
        const audience = await storage.getOrgAudience(orgId);
        if (!audience) {
          console.log(`[Audience Sync] Skipping org ${orgId}: No audience config`);
          continue;
        }
        
        // Recompute eligible count
        const eligibleCount = await recomputeEligibleCount(accessToken, audience);
        
        // Update org_usage
        await storage.upsertOrgUsage({
          orgId,
          eligibleCount,
        });
        
        console.log(`[Audience Sync] Org ${orgId}: Updated to ${eligibleCount} eligible members`);
        successCount++;
      } catch (error) {
        console.error(`[Audience Sync] Error syncing org ${orgId}:`, error);
        errorCount++;
      }
    }
    
    console.log(`[Audience Sync] Complete: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    console.error('[Audience Sync] Fatal error:', error);
  }
}

/**
 * Start the audience sync cron job
 * Runs daily at 2 AM UTC
 */
export function startAudienceSyncCron() {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  
  // Calculate time until next 2 AM UTC
  const now = new Date();
  const next2AM = new Date(now);
  next2AM.setUTCHours(2, 0, 0, 0);
  
  // If we've passed 2 AM today, schedule for tomorrow
  if (next2AM <= now) {
    next2AM.setDate(next2AM.getDate() + 1);
  }
  
  const msUntilNext = next2AM.getTime() - now.getTime();
  
  console.log(`[Audience Sync] Scheduled for ${next2AM.toISOString()}`);
  
  // Schedule first run
  setTimeout(() => {
    syncAllOrgAudiences();
    
    // Then run daily
    setInterval(syncAllOrgAudiences, INTERVAL_MS);
  }, msUntilNext);
}

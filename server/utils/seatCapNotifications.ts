/**
 * Seat-cap notification service
 * Sends Slack DM and email notifications when seat-cap thresholds are crossed
 */

import { storage } from '../storage';
import { sendSeatCapNotification } from './slackMessaging';
import { sendSeatCapEmailNotification } from './emailNotifications';
import type { User } from '@shared/schema';

const NOTIFICATION_COOLDOWN_HOURS = 24; // Don't spam - only notify once per 24 hours

export async function sendSeatCapNotifications(
  orgId: string,
  percentage: number,
  status: 'warning' | 'grace' | 'blocked',
  graceEndsAt?: Date
): Promise<void> {
  try {
    const org = await storage.getOrg(orgId);
    if (!org) return;

    // Determine which notification threshold was crossed
    let notifField: 'lastSeatCapNotif90' | 'lastSeatCapNotif100' | 'lastSeatCapNotif110';
    
    if (status === 'blocked' || percentage > 110) {
      notifField = 'lastSeatCapNotif110';
    } else if (status === 'grace' || percentage > 100) {
      notifField = 'lastSeatCapNotif100';
    } else {
      notifField = 'lastSeatCapNotif90';
    }

    // Check if we've already sent this notification recently
    const lastNotif = org[notifField];
    if (lastNotif) {
      const hoursSinceLastNotif = (Date.now() - new Date(lastNotif).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastNotif < NOTIFICATION_COOLDOWN_HOURS) {
        // Already notified recently, skip
        return;
      }
    }

    // Get all owner and admin users
    const users = await storage.getOrgUsers(orgId);
    const notifyUsers = users.filter((u: User) => u.role === 'owner' || u.role === 'admin');

    if (notifyUsers.length === 0) {
      console.warn(`No owner/admin users found for org ${orgId} - skipping seat-cap notifications`);
      return;
    }

    // Get Slack access token if available
    const slackTeam = await storage.getSlackTeamByOrgId(orgId);
    
    // Send notifications to all owners and admins
    // Use Promise.allSettled to ensure all notifications are attempted even if some fail
    const notificationPromises = notifyUsers.map(async (user: User) => {
      const userNotifications = [];
      
      // Send Slack DM if user has slackUserId and we have a Slack token
      if (user.slackUserId && slackTeam?.accessToken) {
        userNotifications.push(
          sendSeatCapNotification(
            slackTeam.accessToken,
            user.slackUserId,
            org.name,
            percentage,
            status,
            graceEndsAt?.toISOString()
          ).catch(err => {
            console.error(`Failed to send Slack notification to user ${user.id}:`, err);
          })
        );
      }

      // Send email if user has email
      if (user.email) {
        userNotifications.push(
          sendSeatCapEmailNotification(
            user.email,
            org.name,
            percentage,
            status,
            graceEndsAt?.toISOString()
          ).catch(err => {
            console.error(`Failed to send email notification to ${user.email}:`, err);
          })
        );
      }
      
      return Promise.allSettled(userNotifications);
    });

    // Also send to billing email if different from user emails
    if (org.billingEmail && !notifyUsers.some((u: User) => u.email === org.billingEmail)) {
      notificationPromises.push(
        Promise.allSettled([
          sendSeatCapEmailNotification(
            org.billingEmail,
            org.name,
            percentage,
            status,
            graceEndsAt?.toISOString()
          ).catch(err => {
            console.error(`Failed to send email notification to billing email ${org.billingEmail}:`, err);
          })
        ])
      );
    }

    await Promise.allSettled(notificationPromises);

    // Update notification timestamp
    await storage.updateOrg(orgId, {
      [notifField]: new Date(),
    });

    console.log(`[Seat-Cap Notifications] Sent ${status} notifications for org ${orgId} (${percentage.toFixed(0)}%)`);
  } catch (error) {
    console.error('Failed to send seat-cap notifications:', error);
    // Don't throw - notifications are best-effort
  }
}

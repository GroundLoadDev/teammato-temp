import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import { z } from "zod";
import "./types"; // Load session type extensions
import { filterAnonymousFeedback, generateSubmitterHash, coarsenSituation } from "./utils/contentFilter";
import { sendContributionReceipt, postActionNotesToChannel } from "./utils/slackMessaging";
import { buildFeedbackModal } from "./utils/slackModal";
import { WebClient } from '@slack/web-api';

// Slack OAuth configuration
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET || !SLACK_SIGNING_SECRET) {
  console.warn("Missing Slack environment variables");
}

// Use env variable for redirect URI, fallback to dev URL
const REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 
  'https://0b09fc98-cfc3-4134-ae72-a7645228e1f5-00-1li8oza6dfwqq.janeway.replit.dev/api/slack/oauth';

// Bot scopes
const BOT_SCOPES = [
  'commands',
  'chat:write',
  'team:read',
  'users:read'
].join(',');

// User scopes (for getting installer email)
const USER_SCOPES = [
  'users:read',
  'users:read.email'
].join(',');

// In-memory state storage (TODO: use Redis/session store in production)
const oauthStates = new Map<string, number>();

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Role-based access control middleware
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }
    
    next();
  };
}

// Slack signature verification
function verifySlackSignature(req: Request): boolean {
  if (!SLACK_SIGNING_SECRET) {
    console.error('SLACK_SIGNING_SECRET not configured');
    return false;
  }

  const slackSignature = req.headers['x-slack-signature'] as string;
  const timestamp = req.headers['x-slack-request-timestamp'] as string;
  
  // express.raw() stores the raw body in req.body as a Buffer
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

  if (!slackSignature || !timestamp || !body) {
    console.error('Missing signature, timestamp, or body');
    return false;
  }

  // Prevent replay attacks - reject requests older than 5 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    console.warn('Slack request timestamp too old');
    return false;
  }

  // Compute signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET)
    .update(sigBasestring)
    .digest('hex');

  // Compare signatures using timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(slackSignature, 'utf8')
    );
  } catch {
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth API
  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'User not found' });
      }

      const org = await storage.getOrg(user.orgId);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
        },
        org: org ? {
          id: org.id,
          name: org.name,
        } : null,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Dashboard API
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const stats = await storage.getOrgStats(orgId);
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.get('/api/dashboard/recent-threads', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      let limit = parseInt(req.query.limit as string) || 5;
      
      // Validate and clamp limit
      limit = Math.max(1, Math.min(50, limit));
      
      const threads = await storage.getRecentThreads(orgId, limit);
      res.json(threads);
    } catch (error) {
      console.error('Recent threads error:', error);
      res.status(500).json({ error: 'Failed to fetch recent threads' });
    }
  });

  app.get('/api/dashboard/slack-status', requireAuth, async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      
      if (!slackTeam) {
        return res.json({ connected: false });
      }

      res.json({
        connected: true,
        teamId: slackTeam.teamId,
        botUserId: slackTeam.botUserId,
      });
    } catch (error) {
      console.error('Slack status error:', error);
      res.status(500).json({ error: 'Failed to fetch Slack status' });
    }
  });

  // Analytics API (admin-only)
  app.get('/api/analytics/topic-activity', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const activity = await storage.getTopicActivity(orgId);
      res.json(activity);
    } catch (error) {
      console.error('Topic activity error:', error);
      res.status(500).json({ error: 'Failed to fetch topic activity' });
    }
  });

  app.get('/api/analytics/weekly-trend', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const days = parseInt(req.query.days as string) || 7;
      const trend = await storage.getWeeklyActivityTrend(orgId, days);
      res.json(trend);
    } catch (error) {
      console.error('Weekly trend error:', error);
      res.status(500).json({ error: 'Failed to fetch weekly trend' });
    }
  });

  app.get('/api/analytics/participant-count', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const count = await storage.getUniqueParticipantCount(orgId);
      res.json({ count });
    } catch (error) {
      console.error('Participant count error:', error);
      res.status(500).json({ error: 'Failed to fetch participant count' });
    }
  });

  // Slack Settings API (admin-only)
  app.get('/api/slack-settings', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const settings = await storage.getSlackSettings(orgId);
      res.json(settings || { orgId, digestChannel: null, digestEnabled: false });
    } catch (error) {
      console.error('Get Slack settings error:', error);
      res.status(500).json({ error: 'Failed to fetch Slack settings' });
    }
  });

  app.post('/api/slack-settings', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      // Validate request body
      const bodySchema = z.object({
        digestChannel: z.string().nullable().optional(),
        digestEnabled: z.boolean().optional(),
      });
      
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid request body', details: result.error });
      }
      
      const { digestChannel, digestEnabled } = result.data;
      
      const settings = await storage.upsertSlackSettings({
        orgId,
        digestChannel: digestChannel || null,
        digestEnabled: digestEnabled || false,
      });
      
      res.json(settings);
    } catch (error) {
      console.error('Update Slack settings error:', error);
      res.status(500).json({ error: 'Failed to update Slack settings' });
    }
  });

  // Topic Suggestions API (admin-only)
  app.get('/api/topic-suggestions', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const status = req.query.status as string | undefined;
      
      const suggestions = await storage.getTopicSuggestions(orgId, status);
      
      // Enhance with suggester information
      const enhanced = await Promise.all(
        suggestions.map(async (suggestion) => {
          let suggesterEmail = null;
          if (suggestion.suggestedBy) {
            const suggester = await storage.getUser(suggestion.suggestedBy);
            suggesterEmail = suggester?.email || null;
          }
          return {
            ...suggestion,
            suggesterEmail,
          };
        })
      );
      
      res.json(enhanced);
    } catch (error) {
      console.error('Get topic suggestions error:', error);
      res.status(500).json({ error: 'Failed to fetch topic suggestions' });
    }
  });

  app.patch('/api/topic-suggestions/:id', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const { status } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
      }
      
      const suggestion = await storage.updateTopicSuggestionStatus(req.params.id, status, orgId);
      
      if (!suggestion) {
        return res.status(404).json({ error: 'Topic suggestion not found' });
      }
      
      // If approved, create a new topic
      if (status === 'approved') {
        const slug = suggestion.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        await storage.createTopic({
          orgId,
          name: suggestion.title,
          slug,
          description: null,
          slackChannelId: null,
          kThreshold: 5,
          isActive: true,
          windowDays: 21,
          status: 'collecting',
          ownerId: req.session.userId!,
          actionNotes: null,
          parentTopicId: null,
          isParent: false,
          windowStart: null,
          windowEnd: null,
          instanceIdentifier: null,
          expiresAt: null,
        });
      }
      
      res.json(suggestion);
    } catch (error: any) {
      console.error('Update topic suggestion error:', error);
      
      // Handle slug uniqueness violation
      if (error.code === '23505' && error.constraint?.includes('slug')) {
        return res.status(409).json({ 
          error: 'A topic with this name already exists. Please modify the suggestion or reject it.' 
        });
      }
      
      res.status(500).json({ error: 'Failed to update topic suggestion' });
    }
  });

  // User Management API (admin-only)
  app.get('/api/users', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      
      // Get all active users
      const users = await storage.getOrgUsers(orgId);
      
      // Get pending invitations
      const pendingInvitations = await storage.getOrgInvitations(orgId, 'pending');
      
      // Enhance invitations with inviter information
      const enhancedInvitations = await Promise.all(
        pendingInvitations.map(async (invitation) => {
          const inviter = await storage.getUser(invitation.invitedBy);
          return {
            ...invitation,
            inviterEmail: inviter?.email || null,
          };
        })
      );
      
      res.json({
        users,
        pendingInvitations: enhancedInvitations,
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/invitations', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const inviterId = req.session.userId!;
      
      // Validate request body
      const bodySchema = z.object({
        slackHandle: z.string().min(1),
        role: z.enum(['owner', 'admin', 'moderator', 'viewer']),
      });
      
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid request body', details: result.error });
      }
      
      const { slackHandle, role } = result.data;
      
      // Only owners can invite other owners
      if (role === 'owner' && req.session.role !== 'owner') {
        return res.status(403).json({ error: 'Only owners can invite other owners' });
      }
      
      // Get Slack team to use their access token
      const slackTeam = await storage.getSlackTeamByOrgId(orgId);
      if (!slackTeam) {
        return res.status(400).json({ error: 'Slack team not connected' });
      }
      
      const slackClient = new WebClient(slackTeam.accessToken);
      
      // Remove @ prefix if present
      const cleanHandle = slackHandle.startsWith('@') ? slackHandle.slice(1) : slackHandle;
      
      // Look up Slack user by handle (search all users)
      const usersListResponse = await slackClient.users.list({});
      const slackUser = (usersListResponse.members as any[])?.find(
        (member: any) => member.name === cleanHandle || member.profile?.display_name === cleanHandle
      );
      
      if (!slackUser) {
        return res.status(404).json({ error: 'Slack user not found. Please check the handle.' });
      }
      
      const slackUserId = slackUser.id;
      const email = slackUser.profile?.email || null;
      
      // Check if user is already in the org
      const existingUser = await storage.getUserBySlackId(slackUserId, orgId);
      if (existingUser) {
        return res.status(409).json({ error: 'User is already a member of this organization' });
      }
      
      // Check if there's already a pending invitation
      const existingInvitation = await storage.getPendingInvitationBySlackUserId(slackUserId, orgId);
      if (existingInvitation) {
        return res.status(409).json({ error: 'User already has a pending invitation' });
      }
      
      // Create invitation (expires in 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation = await storage.createInvitation({
        orgId,
        slackUserId,
        slackHandle: cleanHandle,
        email,
        role,
        invitedBy: inviterId,
        status: 'pending',
        expiresAt,
      });
      
      // Get inviter info for the DM
      const inviter = await storage.getUser(inviterId);
      const inviterName = inviter?.email || 'An admin';
      
      // Send DM with invitation button
      try {
        await slackClient.chat.postMessage({
          channel: slackUserId,
          text: `You've been invited to join Teammato!`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Hi <@${slackUserId}>! ${inviterName} has invited you to be an *${role}* on Teammato.`,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Accept Invitation',
                  },
                  style: 'primary',
                  value: invitation.id,
                  action_id: 'accept_invitation',
                },
              ],
            },
          ],
        });
      } catch (dmError) {
        console.error('Failed to send DM:', dmError);
        // Still return success - invitation is created
      }
      
      res.json(invitation);
    } catch (error) {
      console.error('Create invitation error:', error);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  });

  app.patch('/api/users/:id/role', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const userId = req.params.id;
      const currentUserRole = req.session.role!;
      
      // Validate request body
      const bodySchema = z.object({
        role: z.enum(['owner', 'admin', 'moderator', 'viewer']),
      });
      
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid request body', details: result.error });
      }
      
      const { role } = result.data;
      
      // Only owners can promote to owner or demote owners
      if ((role === 'owner' || currentUserRole !== 'owner')) {
        const targetUser = await storage.getUser(userId);
        if (targetUser?.role === 'owner' && currentUserRole !== 'owner') {
          return res.status(403).json({ error: 'Only owners can change owner roles' });
        }
      }
      
      if (role === 'owner' && currentUserRole !== 'owner') {
        return res.status(403).json({ error: 'Only owners can promote users to owner' });
      }
      
      // Prevent users from changing their own role
      if (userId === req.session.userId) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role, orgId);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.delete('/api/users/:id', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const userId = req.params.id;
      
      // Prevent users from deleting themselves
      if (userId === req.session.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      // Check if target user exists and get their role
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.orgId !== orgId) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Only owners can delete other owners
      if (targetUser.role === 'owner' && req.session.role !== 'owner') {
        return res.status(403).json({ error: 'Only owners can delete other owners' });
      }
      
      await storage.deleteUser(userId, orgId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Feedback Management API (moderator-only)
  app.get('/api/feedback/threads', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const threads = await storage.getFeedbackThreads(orgId);
      res.json(threads);
    } catch (error) {
      console.error('Get threads error:', error);
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  });

  app.get('/api/feedback/threads/:id', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const thread = await storage.getFeedbackThread(req.params.id);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Verify thread belongs to user's org
      if (thread.orgId !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const items = await storage.getFeedbackItemsByThread(thread.id);
      
      res.json({
        ...thread,
        items,
      });
    } catch (error) {
      console.error('Get thread error:', error);
      res.status(500).json({ error: 'Failed to fetch thread' });
    }
  });

  app.post('/api/feedback/items/:id/moderate', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const { status } = req.body;
      const itemId = req.params.id;
      const moderatorId = req.session.userId!;
      const orgId = req.session.orgId!;
      
      if (!status || !['approved', 'hidden', 'removed', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      // Update with org scoping for security
      await storage.updateFeedbackItemStatus(itemId, status, moderatorId, orgId);
      res.json({ success: true });
    } catch (error) {
      console.error('Moderate item error:', error);
      res.status(500).json({ error: 'Failed to moderate item' });
    }
  });

  // Zod validation schemas for moderation
  const threadModerationSchema = z.object({
    moderationStatus: z.enum(['auto_approved', 'pending_review', 'flagged', 'approved', 'hidden', 'archived']),
    notes: z.string().optional(),
    reason: z.string().optional(),
  });

  const itemModerationSchema = z.object({
    moderationStatus: z.enum(['auto_approved', 'pending_review', 'flagged', 'approved', 'hidden']),
    notes: z.string().optional(),
    reason: z.string().optional(),
  });

  // Moderation - Update thread moderation status
  app.post('/api/moderation/threads/:id', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const validation = threadModerationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid request body', details: validation.error });
      }

      const { moderationStatus, notes, reason } = validation.data;
      const threadId = req.params.id;
      const moderatorId = req.session.userId!;
      const orgId = req.session.orgId!;
      
      // Get current thread to log previous status
      const currentThread = await storage.getFeedbackThread(threadId);
      if (!currentThread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      if (currentThread.orgId !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Update thread moderation status
      const updatedThread = await storage.updateThreadModerationStatus(
        threadId, 
        moderationStatus, 
        moderatorId, 
        orgId, 
        notes
      );
      
      // Create audit trail
      await storage.createModerationAudit({
        orgId,
        targetType: 'thread',
        targetId: threadId,
        action: moderationStatus,
        previousStatus: currentThread.moderationStatus,
        newStatus: moderationStatus,
        reason,
        adminUserId: moderatorId,
      });
      
      res.json(updatedThread);
    } catch (error) {
      console.error('Moderate thread error:', error);
      res.status(500).json({ error: 'Failed to moderate thread' });
    }
  });

  // Moderation - Update item moderation status
  app.post('/api/moderation/items/:id', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const validation = itemModerationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid request body', details: validation.error });
      }

      const { moderationStatus, notes, reason } = validation.data;
      const itemId = req.params.id;
      const moderatorId = req.session.userId!;
      const orgId = req.session.orgId!;
      
      // Get current item to log previous status and verify org
      const currentItem = await storage.getFeedbackItem(itemId, orgId);
      
      if (!currentItem) {
        return res.status(404).json({ error: 'Item not found or access denied' });
      }
      
      // Update item moderation status
      const updatedItem = await storage.updateItemModerationStatus(
        itemId, 
        moderationStatus, 
        moderatorId, 
        orgId, 
        notes
      );
      
      // Create audit trail
      await storage.createModerationAudit({
        orgId,
        targetType: 'item',
        targetId: itemId,
        action: moderationStatus,
        previousStatus: currentItem.moderationStatus,
        newStatus: moderationStatus,
        reason,
        adminUserId: moderatorId,
      });
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Moderate item error:', error);
      res.status(500).json({ error: 'Failed to moderate item' });
    }
  });

  // Moderation - Get audit trail
  app.get('/api/moderation/audit/:targetType/:targetId', requireRole('owner', 'admin', 'moderator'), async (req, res) => {
    try {
      const { targetType, targetId } = req.params;
      const orgId = req.session.orgId!;
      
      if (!['thread', 'item'].includes(targetType)) {
        return res.status(400).json({ error: 'Invalid target type' });
      }
      
      const audit = await storage.getModerationAudit(targetType, targetId, orgId);
      res.json(audit);
    } catch (error) {
      console.error('Get audit error:', error);
      res.status(500).json({ error: 'Failed to fetch audit trail' });
    }
  });

  // Slack Slash Command - Submit anonymous feedback
  app.post('/api/slack/command', async (req, res) => {
    try {
      // Verify Slack signature
      if (!verifySlackSignature(req)) {
        console.error('Invalid Slack signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse form-urlencoded body (Slack sends this format)
      // express.raw() stored the body as a Buffer in req.body
      const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      const body = new URLSearchParams(bodyString);
      const teamId = body.get('team_id');
      const userId = body.get('user_id');
      const text = body.get('text')?.trim();

      if (!teamId || !userId) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Missing required parameters from Slack.',
        });
      }

      // Look up org from Slack team
      const slackTeam = await storage.getSlackTeamByTeamId(teamId);
      if (!slackTeam) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Your Slack workspace is not connected. Please install the Teammato app first.',
        });
      }

      const orgId = slackTeam.orgId;

      // Handle special commands
      if (!text || text === 'list' || text === 'help') {
        // Get active topics for this org
        const topics = await storage.getTopics(orgId);
        const activeTopics = topics.filter(t => t.isActive);
        
        if (activeTopics.length === 0) {
          return res.json({
            response_type: 'ephemeral',
            text: '📋 No active topics available.\n\nPlease contact your admin to set up feedback topics.',
          });
        }
        
        const topicList = activeTopics
          .map(t => {
            const expiryInfo = t.expiresAt 
              ? ` (expires ${new Date(t.expiresAt).toLocaleDateString()})`
              : '';
            const statusIcon = t.status === 'collecting' ? '📝' : 
                              t.status === 'in_review' ? '👀' :
                              t.status === 'action_decided' ? '✅' : '🎯';
            return `• ${statusIcon} \`${t.slug}\` - ${t.name}${expiryInfo}`;
          })
          .join('\n');
        
        return res.json({
          response_type: 'ephemeral',
          text: `📋 *Available Topics*\n\n${topicList}\n\n💡 *How to submit:*\n\`/teammato <topic-slug>\` to open the feedback form\n\nExample: \`/teammato product-feedback\``,
        });
      }

      // Parse topic slug and optional prefill text
      const parts = text.split(/\s+/);
      const topicSlug = parts[0];
      const prefillText = parts.slice(1).join(' ');

      // Try to find topic by slug first
      let topic = await storage.getTopicBySlug(topicSlug, orgId);
      let isGeneralFeedback = false;
      let freeText = '';
      
      if (!topic) {
        // No matching topic - treat entire text as free text for general feedback
        freeText = text;
        isGeneralFeedback = true;
        
        // Get or create current general feedback instance
        let currentInstance = await storage.getCurrentGeneralFeedbackInstance(orgId);
        
        if (!currentInstance) {
          // Get first user in org to use as owner (or create system user)
          let ownerId: string | undefined;
          try {
            const user = await storage.getUserBySlackId(userId, orgId);
            ownerId = user?.id;
          } catch {
            // If no user found, pass undefined and let getOrCreateParentTopic handle it
            ownerId = undefined;
          }
          
          // Create parent topic if it doesn't exist
          const parent = await storage.getOrCreateParentTopic(orgId, ownerId || '');
          
          // Create first instance
          const now = new Date();
          const windowEnd = new Date(now);
          windowEnd.setDate(windowEnd.getDate() + parent.windowDays);
          
          // Generate instance identifier (e.g., "2025-W41")
          const weekNumber = getWeekNumber(now);
          const year = now.getFullYear();
          const instanceIdentifier = `${year}-W${weekNumber}`;
          
          currentInstance = await storage.createGeneralFeedbackInstance(
            parent.id,
            orgId,
            now,
            windowEnd,
            instanceIdentifier
          );
        }
        
        topic = currentInstance;
      }

      if (!topic.isActive) {
        return res.json({
          response_type: 'ephemeral',
          text: `❌ Topic "${topicSlug}" is currently inactive.`,
        });
      }

      // Check if topic has expired
      if (topic.expiresAt && new Date(topic.expiresAt) < new Date()) {
        return res.json({
          response_type: 'ephemeral',
          text: `❌ Topic "${topic.name}" has closed. Please contact your admin if you have questions.`,
        });
      }

      // Get trigger_id to open modal
      const triggerId = body.get('trigger_id');
      if (!triggerId) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Failed to open feedback form. Please try again.',
        });
      }

      // Fetch topic owner info if available
      let ownerName: string | undefined;
      if (topic.ownerId) {
        const owner = await storage.getUser(topic.ownerId);
        if (owner) {
          // Try to get Slack user info for a friendly name
          try {
            const client = new WebClient(slackTeam.accessToken);
            const userInfo = await client.users.info({ user: owner.slackUserId || '' });
            if (userInfo.user) {
              ownerName = (userInfo.user as any).real_name || (userInfo.user as any).name;
            }
          } catch (err) {
            // Fallback to email if Slack lookup fails
            ownerName = owner.email || undefined;
          }
        }
      }

      // Build and open modal
      const client = new WebClient(slackTeam.accessToken);
      const modal = buildFeedbackModal(topic, {
        topicId: topic.id,
        topicSlug: topic.slug,
        orgId,
        prefillBehavior: isGeneralFeedback ? freeText : (prefillText || undefined),
      }, {
        showTopicSuggestions: false,
        ownerName,
      });

      try {
        await client.views.open({
          trigger_id: triggerId,
          view: modal as any,
        });

        // If text was provided, acknowledge prefill
        if (prefillText) {
          return res.json({
            response_type: 'ephemeral',
            text: `✅ Feedback form opened with your text prefilled. Please review and submit when ready.`,
          });
        }

        // Return 200 OK for modal opening (Slack requires this)
        return res.status(200).send();
      } catch (error: any) {
        console.error('Failed to open modal:', error);
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Failed to open feedback form. Please try again or contact your admin.',
        });
      }

    } catch (error) {
      console.error('Slack command error:', error);
      return res.json({
        response_type: 'ephemeral',
        text: '❌ An error occurred while processing your feedback. Please try again.',
      });
    }
  });

  // Slack Modal Submission - Handle feedback modal submissions
  app.post('/api/slack/modal', async (req, res) => {
    console.log('[MODAL] Received modal submission');
    try {
      // Verify Slack signature
      if (!verifySlackSignature(req)) {
        console.error('[MODAL] Invalid Slack signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse the modal submission payload
      const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      const body = new URLSearchParams(bodyString);
      const payloadStr = body.get('payload');
      
      if (!payloadStr) {
        console.error('[MODAL] Missing payload');
        return res.status(400).json({ error: 'Missing payload' });
      }

      const payload = JSON.parse(payloadStr);
      
      // Handle button actions (invitation acceptance, etc.)
      if (payload.type === 'block_actions') {
        const { user, team, actions } = payload;
        console.log(`[MODAL] Button action: ${actions[0]?.action_id}, User: ${user.id}, Team: ${team.id}`);
        
        const action = actions[0];
        
        // Handle invitation acceptance
        if (action.action_id === 'accept_invitation') {
          const invitationId = action.value;
          
          try {
            // Get the invitation (without org scoping for now)
            const invitation = await storage.getInvitationById(invitationId);
            
            if (!invitation) {
              return res.json({
                text: '❌ Invitation not found. It may have expired or been revoked.',
              });
            }
            
            // Verify the invitation's org matches the Slack team sending this action
            const slackTeamForOrg = await storage.getSlackTeamByOrgId(invitation.orgId);
            if (!slackTeamForOrg || slackTeamForOrg.teamId !== team.id) {
              return res.json({
                text: '❌ This invitation is not valid for your Slack workspace.',
              });
            }
            
            if (invitation.status !== 'pending') {
              return res.json({
                text: '❌ This invitation has already been processed.',
              });
            }
            
            if (invitation.expiresAt < new Date()) {
              await storage.updateInvitationStatus(invitationId, 'expired', invitation.orgId);
              return res.json({
                text: '❌ This invitation has expired. Please ask your admin for a new invitation.',
              });
            }
            
            // Verify the invitation is for this user
            if (invitation.slackUserId !== user.id) {
              return res.json({
                text: '❌ This invitation is not for you.',
              });
            }
            
            // Get Slack user info to get email
            const slackTeam = await storage.getSlackTeamByOrgId(invitation.orgId);
            if (!slackTeam) {
              return res.json({
                text: '❌ Slack workspace not connected. Please contact your admin.',
              });
            }
            
            const slackClient = new WebClient(slackTeam.accessToken);
            const userInfo = await slackClient.users.info({ user: user.id });
            const email = (userInfo.user as any)?.profile?.email || invitation.email || null;
            
            // Create the user account
            await storage.createUser({
              orgId: invitation.orgId,
              slackUserId: user.id,
              email,
              role: invitation.role,
              profile: null,
            });
            
            // Mark invitation as accepted
            await storage.updateInvitationStatus(invitationId, 'accepted', invitation.orgId);
            
            console.log(`[MODAL] User ${user.id} accepted invitation and created as ${invitation.role}`);
            
            return res.json({
              text: `✅ Welcome to Teammato! You now have *${invitation.role}* access. You can start using \`/teammato\` commands in Slack.`,
            });
          } catch (error) {
            console.error('[MODAL] Error accepting invitation:', error);
            return res.json({
              text: '❌ Failed to process invitation. Please try again or contact your admin.',
            });
          }
        }
        
        // Unknown action
        return res.json({
          text: '❌ Unknown action.',
        });
      }
      
      // Handle modal view submissions
      const { user, view, team } = payload;
      console.log(`[MODAL] User: ${user.id}, Team: ${team.id}`);

      // Extract metadata
      const metadata = JSON.parse(view.private_metadata);
      const { topicId, orgId } = metadata;
      console.log(`[MODAL] TopicId: ${topicId}, OrgId: ${orgId}`);

      // Extract form values
      const values = view.state.values;
      const suggestTopic = values.suggest_topic_block?.suggest_topic_input?.value?.trim();
      const situation = values.situation_block?.situation_input?.value?.trim() || '';
      const behavior = values.behavior_block?.behavior_input?.value?.trim();
      const impact = values.impact_block?.impact_input?.value?.trim();

      // Look up org from Slack team
      const slackTeam = await storage.getSlackTeamByTeamId(team.id);
      if (!slackTeam) {
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: 'Your Slack workspace is not connected.',
            },
          },
        });
      }

      // Handle topic suggestion if provided
      if (suggestTopic && suggestTopic.length > 0) {
        // Validate topic suggestion title
        if (suggestTopic.length < 5) {
          return res.json({
            response_action: 'errors',
            errors: {
              suggest_topic_block: {
                suggest_topic_input: 'Topic title must be at least 5 characters',
              },
            },
          });
        }

        // Find or create user for suggested_by
        let user_record = await storage.getUserBySlackId(user.id, orgId);
        if (!user_record) {
          user_record = await storage.createUser({
            orgId,
            slackUserId: user.id,
            email: null,
            role: 'member',
            profile: null,
          });
        }

        await storage.createTopicSuggestion({
          orgId,
          suggestedBy: user_record.id,
          title: suggestTopic,
          status: 'pending',
        });

        // Success - close modal
        return res.json({
          response_action: 'clear',
        });
      }

      // If no topic suggestion, validate feedback fields are provided
      if (!behavior || !impact) {
        const errors: any = {};
        if (!behavior) {
          errors.behavior_block = {
            behavior_input: 'Behavior is required when submitting feedback',
          };
        }
        if (!impact) {
          errors.impact_block = {
            impact_input: 'Impact is required when submitting feedback',
          };
        }
        return res.json({
          response_action: 'errors',
          errors,
        });
      }

      // Validate field lengths
      if (behavior.length < 20) {
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: 'Behavior must be at least 20 characters. What specifically occurred?',
            },
          },
        });
      }

      if (impact.length < 15) {
        return res.json({
          response_action: 'errors',
          errors: {
            impact_block: {
              impact_input: 'Impact must be at least 15 characters. How did this affect work or people?',
            },
          },
        });
      }

      // Check for @mentions and PII
      const behaviorCheck = filterAnonymousFeedback(behavior);
      if (!behaviorCheck.isValid) {
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: behaviorCheck.error,
            },
          },
        });
      }

      const impactCheck = filterAnonymousFeedback(impact);
      if (!impactCheck.isValid) {
        return res.json({
          response_action: 'errors',
          errors: {
            impact_block: {
              impact_input: impactCheck.error,
            },
          },
        });
      }

      if (situation.length > 0) {
        const situationCheck = filterAnonymousFeedback(situation);
        if (!situationCheck.isValid) {
          return res.json({
            response_action: 'errors',
            errors: {
              situation_block: {
                situation_input: situationCheck.error,
              },
            },
          });
        }
      }

      // Get topic
      console.log(`[MODAL] Fetching topic ${topicId} for org ${orgId}`);
      const topic = await storage.getTopic(topicId, orgId);
      console.log(`[MODAL] Topic found:`, topic ? `${topic.name} (isActive: ${topic.isActive})` : 'null');
      if (!topic || !topic.isActive) {
        console.error(`[MODAL] Topic validation failed - exists: ${!!topic}, isActive: ${topic?.isActive}`);
        return res.json({
          response_action: 'errors',
          errors: {
            behavior_block: {
              behavior_input: 'This topic is no longer active.',
            },
          },
        });
      }
      console.log(`[MODAL] Topic validated, proceeding with thread creation`);

      // Find or create collecting thread
      let thread = await storage.getActiveCollectingThread(topic.id, orgId);
      if (!thread) {
        try {
          thread = await storage.createFeedbackThread({
            orgId,
            topicId: topic.id,
            title: `${topic.name} Feedback`,
            status: 'collecting',
            kThreshold: topic.kThreshold,
            participantCount: 0,
            slackChannelId: topic.slackChannelId || null,
            slackMessageTs: null,
          });
        } catch (error: any) {
          if (error.code === '23505') {
            thread = await storage.getActiveCollectingThread(topic.id, orgId);
            if (!thread) {
              throw new Error('Failed to create or retrieve collecting thread');
            }
          } else {
            throw error;
          }
        }
      }

      // Generate submitter hash and coarsen situation
      const submitterHash = generateSubmitterHash(user.id, orgId);
      const situationCoarse = coarsenSituation(situation);
      const createdAtDay = new Date().toISOString().slice(0, 10);

      // Submit feedback
      try {
        await storage.createFeedbackItem({
          threadId: thread.id,
          orgId,
          slackUserId: user.id,
          content: null,
          behavior,
          impact,
          situationCoarse,
          submitterHash,
          createdAtDay,
          status: 'pending',
          moderatorId: null,
          moderatedAt: null,
        });

        // Update participant count
        const participants = await storage.getUniqueParticipants(thread.id);
        await storage.updateThreadParticipantCount(thread.id, participants.length);

        if (participants.length >= thread.kThreshold && thread.status === 'collecting') {
          await storage.updateThreadStatus(thread.id, 'ready');
          console.log(`Thread ${thread.id} reached k-anonymity threshold (${participants.length}/${thread.kThreshold})`);
        }

        // Send contribution receipt
        sendContributionReceipt(slackTeam.accessToken, user.id, topic.id, topic.name)
          .catch(err => console.error('Failed to send receipt:', err));

        // Success - close modal
        return res.json({
          response_action: 'clear',
        });

      } catch (error: any) {
        if (error.code === '23505') {
          return res.json({
            response_action: 'errors',
            errors: {
              behavior_block: {
                behavior_input: 'You have already submitted feedback to this topic.',
              },
            },
          });
        }
        throw error;
      }

    } catch (error) {
      console.error('[MODAL] Modal submission error:', error);
      console.error('[MODAL] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return res.json({
        response_action: 'errors',
        errors: {
          behavior_block: {
            behavior_input: 'An error occurred. Please try again.',
          },
        },
      });
    }
  });

  // Topic Management API (admin-only)
  // More specific routes first to avoid matching issues
  app.get('/api/topics/categorized', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const categorized = await storage.getCategorizedTopics(orgId);
      
      // Enhance each category with owner information
      const enhanceTopics = async (topicsList: any[]) => {
        return await Promise.all(
          topicsList.map(async (topic) => {
            let ownerEmail = null;
            if (topic.ownerId) {
              const owner = await storage.getUser(topic.ownerId);
              ownerEmail = owner?.email || null;
            }
            return {
              ...topic,
              ownerEmail,
            };
          })
        );
      };
      
      const enhanced = {
        created: await enhanceTopics(categorized.created),
        instances: await enhanceTopics(categorized.instances),
        archived: await enhanceTopics(categorized.archived),
      };
      
      res.json(enhanced);
    } catch (error) {
      console.error('Get categorized topics error:', error);
      res.status(500).json({ error: 'Failed to fetch categorized topics' });
    }
  });

  app.get('/api/topics', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const topicsList = await storage.getTopics(orgId);
      
      // Enhance topics with owner information
      const enhancedTopics = await Promise.all(
        topicsList.map(async (topic) => {
          let ownerEmail = null;
          if (topic.ownerId) {
            const owner = await storage.getUser(topic.ownerId);
            ownerEmail = owner?.email || null;
          }
          return {
            ...topic,
            ownerEmail,
          };
        })
      );
      
      res.json(enhancedTopics);
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({ error: 'Failed to fetch topics' });
    }
  });

  app.get('/api/topics/:id', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const topic = await storage.getTopic(req.params.id, orgId);
      
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      res.json(topic);
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({ error: 'Failed to fetch topic' });
    }
  });

  app.post('/api/topics', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const userId = req.session.userId!;
      const { name, slug, description, slackChannelId, kThreshold, isActive, windowDays } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }
      
      // Calculate expiresAt based on windowDays
      const windowDaysValue = windowDays !== undefined ? parseInt(windowDays) : 21;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + windowDaysValue);
      
      const topic = await storage.createTopic({
        orgId,
        name,
        slug: slug.toLowerCase().trim(),
        description: description || null,
        slackChannelId: slackChannelId || null,
        kThreshold: kThreshold !== undefined ? parseInt(kThreshold) : 5,
        isActive: isActive !== undefined ? isActive : true,
        windowDays: windowDaysValue,
        expiresAt,
        ownerId: userId,
      });
      
      res.json(topic);
    } catch (error: any) {
      console.error('Create topic error:', error);
      
      // Check for unique constraint violation on slug
      if (error.code === '23505' && error.constraint?.includes('slug')) {
        const slugValue = req.body.slug?.toLowerCase().trim() || 'this';
        return res.status(409).json({ 
          error: `A topic with the slug "${slugValue}" already exists. Please choose a different name or slug.` 
        });
      }
      
      res.status(500).json({ error: 'Failed to create topic' });
    }
  });

  app.patch('/api/topics/:id', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      const { name, slug, slackChannelId, kThreshold, isActive, status, actionNotes, expiresAt, windowDays, ownerId } = req.body;
      
      // Get current topic state to check for status change
      const currentTopic = await storage.getTopic(req.params.id, orgId);
      if (!currentTopic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      // Validate status transitions if status is being changed
      if (status !== undefined && status !== currentTopic.status) {
        const validTransitions: Record<string, string[]> = {
          'collecting': ['in_review', 'archived'],
          'in_review': ['collecting', 'action_decided', 'archived'],
          'action_decided': ['actioned', 'archived'],
          'actioned': ['archived'], // Can archive after actioned
          'archived': [] // Terminal state - no further transitions
        };
        
        const allowedNextStates = validTransitions[currentTopic.status] || [];
        if (!allowedNextStates.includes(status)) {
          return res.status(400).json({ 
            error: `Invalid status transition: ${currentTopic.status} → ${status}. Allowed: ${allowedNextStates.join(', ') || 'none'}` 
          });
        }

        // Check k-anonymity BEFORE updating to 'actioned'
        if (status === 'actioned') {
          const participantCount = await storage.getTopicParticipantCount(req.params.id, orgId);
          
          if (participantCount < currentTopic.kThreshold) {
            return res.status(400).json({ 
              error: `Cannot mark topic as actioned: k-anonymity threshold not met (${participantCount}/${currentTopic.kThreshold} participants)` 
            });
          }
        }
      }
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug.toLowerCase().trim();
      if (slackChannelId !== undefined) updateData.slackChannelId = slackChannelId || null;
      if (kThreshold !== undefined) updateData.kThreshold = parseInt(kThreshold);
      if (isActive !== undefined) updateData.isActive = isActive;
      if (status !== undefined) updateData.status = status;
      if (actionNotes !== undefined) updateData.actionNotes = actionNotes;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
      if (windowDays !== undefined) updateData.windowDays = parseInt(windowDays);
      if (ownerId !== undefined) updateData.ownerId = ownerId;
      
      const topic = await storage.updateTopic(req.params.id, updateData, orgId);
      
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      // Auto-post action notes when status changed to 'actioned'
      if (status === 'actioned' && actionNotes && topic.slackChannelId) {
        const slackTeam = await storage.getSlackTeamByOrgId(orgId);
        if (slackTeam) {
          // Post to Slack but don't fail the update if Slack fails
          postActionNotesToChannel(slackTeam.accessToken, topic.slackChannelId, topic.name, actionNotes)
            .catch(err => {
              console.error('Failed to post action notes to Slack (continuing):', err);
            });
        }
      }
      
      res.json(topic);
    } catch (error) {
      console.error('Update topic error:', error);
      res.status(500).json({ error: 'Failed to update topic' });
    }
  });

  app.delete('/api/topics/:id', requireRole('owner', 'admin'), async (req, res) => {
    try {
      const orgId = req.session.orgId!;
      await storage.deleteTopic(req.params.id, orgId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({ error: 'Failed to delete topic' });
    }
  });
  
  // Slack OAuth - Initiate install
  app.get('/api/slack/install', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state with timestamp for CSRF validation (expire after 10 min)
    oauthStates.set(state, Date.now());
    
    const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize');
    slackAuthUrl.searchParams.set('client_id', SLACK_CLIENT_ID!);
    slackAuthUrl.searchParams.set('scope', BOT_SCOPES);
    slackAuthUrl.searchParams.set('user_scope', USER_SCOPES);
    slackAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    slackAuthUrl.searchParams.set('state', state);
    
    res.redirect(slackAuthUrl.toString());
  });

  // Slack OAuth - Handle callback
  app.get('/api/slack/oauth', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`/post-install?error=${error}`);
    }

    if (!code || !state) {
      return res.redirect('/post-install?error=missing_parameters');
    }

    // Validate state for CSRF protection
    const stateTimestamp = oauthStates.get(state as string);
    if (!stateTimestamp) {
      return res.redirect('/post-install?error=invalid_state');
    }

    // Check state hasn't expired (10 minutes)
    if (Date.now() - stateTimestamp > 10 * 60 * 1000) {
      oauthStates.delete(state as string);
      return res.redirect('/post-install?error=state_expired');
    }

    // Remove used state
    oauthStates.delete(state as string);

    try {
      // Exchange code for access tokens
      const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: SLACK_CLIENT_ID!,
          client_secret: SLACK_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: REDIRECT_URI,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.ok) {
        console.error('Slack OAuth error:', tokenData.error);
        return res.redirect(`/post-install?error=${tokenData.error}`);
      }

      const {
        access_token,
        team,
        authed_user,
        bot_user_id
      } = tokenData;

      // Get installer's user info using USER token (not bot token)
      const userToken = authed_user.access_token;
      let installerEmail: string | undefined;

      if (userToken) {
        const userInfoResponse = await fetch(
          `https://slack.com/api/users.info?user=${authed_user.id}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        const userInfo = await userInfoResponse.json();
        installerEmail = userInfo.user?.profile?.email;
      }

      // Check if this Slack team is already installed
      const existingTeam = await storage.getSlackTeamByTeamId(team.id);

      let orgId: string;
      let user;

      if (existingTeam) {
        // Reinstall: update access token
        await storage.updateSlackTeamToken(team.id, access_token);
        orgId = existingTeam.orgId;
        
        // Get or create user
        let existingUser = await storage.getUserBySlackId(authed_user.id, existingTeam.orgId);
        
        if (!existingUser && installerEmail) {
          // New user in existing org - create as admin
          existingUser = await storage.createUser({
            orgId: existingTeam.orgId,
            slackUserId: authed_user.id,
            email: installerEmail,
            role: 'admin',
          });
        }
        
        user = existingUser;
      } else {
        // First install: auto-provision org
        const newOrg = await storage.createOrg({
          name: team.name,
          verifiedDomains: [],
        });
        
        orgId = newOrg.id;

        // Create slack_teams record
        await storage.createSlackTeam({
          orgId: newOrg.id,
          teamId: team.id,
          accessToken: access_token,
          botUserId: bot_user_id,
        });

        // Create user record for installer as owner
        if (installerEmail && authed_user.id) {
          user = await storage.createUser({
            orgId: newOrg.id,
            slackUserId: authed_user.id,
            email: installerEmail,
            role: 'owner',
          });
        }
      }

      // Create session for the installer with session regeneration
      if (user) {
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.redirect('/post-install?error=session_error');
          }
          
          req.session.userId = user.id;
          req.session.orgId = user.orgId;
          req.session.role = user.role;
          
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
            }
            // Redirect to admin dashboard
            res.redirect(`/admin/get-started`);
          });
        });
      } else {
        res.redirect('/post-install?error=user_creation_failed');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/post-install?error=server_error');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { eq, and, sql as sqlOperator, desc } from "drizzle-orm";
import { db } from "./db";
import { 
  orgs, users, slackTeams, slackSettings, topics,
  feedbackThreads, feedbackItems, moderationAudit, topicSuggestions, topicSuggestionSupports, invitations,
  orgAudience, orgUsage, webhookEvents, analyticsEvents, vThreads, vComments,
  type Org, type InsertOrg,
  type User, type InsertUser,
  type SlackTeam, type InsertSlackTeam,
  type SlackSettings, type InsertSlackSettings,
  type Topic, type InsertTopic,
  type FeedbackThread, type InsertFeedbackThread,
  type FeedbackItem, type InsertFeedbackItem,
  type ModerationAudit, type InsertModerationAudit,
  type TopicSuggestion, type InsertTopicSuggestion,
  type Invitation, type InsertInvitation,
  type OrgAudience, type InsertOrgAudience,
  type OrgUsage, type InsertOrgUsage,
  type WebhookEvent, type InsertWebhookEvent,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type VThread, type VComment
} from "@shared/schema";

export interface IStorage {
  // Orgs
  getOrg(id: string): Promise<Org | undefined>;
  getOrgByStripeCustomerId(customerId: string): Promise<Org | undefined>;
  getAllOrgsWithSlack(): Promise<Array<{ orgId: string; accessToken: string }>>;
  createOrg(org: InsertOrg): Promise<Org>;
  updateOrg(id: string, updates: Partial<InsertOrg>): Promise<Org | undefined>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string, orgId: string): Promise<User | undefined>;
  getUserBySlackId(slackUserId: string, orgId: string): Promise<User | undefined>;
  getOrgUsers(orgId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserRole(userId: string, role: string, orgId: string): Promise<User | undefined>;
  deleteUser(userId: string, orgId: string): Promise<void>;
  
  // Invitations
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitation(id: string, orgId: string): Promise<Invitation | undefined>;
  getInvitationById(id: string): Promise<Invitation | undefined>;
  getPendingInvitationBySlackUserId(slackUserId: string, orgId: string): Promise<Invitation | undefined>;
  getOrgInvitations(orgId: string, status?: string): Promise<Invitation[]>;
  updateInvitationStatus(id: string, status: string, orgId: string): Promise<Invitation | undefined>;
  
  // Slack Teams
  getSlackTeamByTeamId(teamId: string): Promise<SlackTeam | undefined>;
  getSlackTeamByOrgId(orgId: string): Promise<SlackTeam | undefined>;
  createSlackTeam(team: InsertSlackTeam): Promise<SlackTeam>;
  updateSlackTeamToken(teamId: string, accessToken: string): Promise<void>;
  
  // Slack Settings
  getSlackSettings(orgId: string): Promise<SlackSettings | undefined>;
  upsertSlackSettings(settings: InsertSlackSettings): Promise<SlackSettings>;
  
  // Topics
  getTopics(orgId: string): Promise<Topic[]>;
  getCategorizedTopics(orgId: string): Promise<{
    created: Topic[];
    instances: Topic[];
    archived: Topic[];
  }>;
  getTopic(id: string, orgId: string): Promise<Topic | undefined>;
  getTopicBySlug(slug: string, orgId: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, topic: Partial<InsertTopic>, orgId: string): Promise<Topic | undefined>;
  deleteTopic(id: string, orgId: string): Promise<void>;
  getExpiredTopics(): Promise<Topic[]>;
  getTopicParticipantCount(topicId: string, orgId: string): Promise<number>;
  
  // General Feedback Instances
  getOrCreateParentTopic(orgId: string, userId: string): Promise<Topic>;
  getCurrentGeneralFeedbackInstance(orgId: string): Promise<Topic | undefined>;
  createGeneralFeedbackInstance(parentId: string, orgId: string, windowStart: Date, windowEnd: Date, instanceIdentifier: string): Promise<Topic>;
  getExpiredInstances(): Promise<Topic[]>;
  
  // Feedback Threads
  createFeedbackThread(thread: InsertFeedbackThread): Promise<FeedbackThread>;
  getFeedbackThread(id: string): Promise<FeedbackThread | undefined>;
  getFeedbackThreads(orgId: string): Promise<FeedbackThread[]>;
  getActiveCollectingThread(topicId: string, orgId: string): Promise<FeedbackThread | undefined>;
  updateThreadParticipantCount(threadId: string, count: number): Promise<void>;
  updateThreadStatus(threadId: string, status: string): Promise<void>;
  
  // Feedback Items
  createFeedbackItem(item: InsertFeedbackItem): Promise<FeedbackItem>;
  getFeedbackItem(itemId: string, orgId: string): Promise<FeedbackItem | undefined>;
  getFeedbackItemsByThread(threadId: string): Promise<FeedbackItem[]>;
  getUniqueParticipants(threadId: string): Promise<string[]>;
  updateFeedbackItemStatus(itemId: string, status: string, moderatorId: string, orgId: string): Promise<void>;
  
  // K-Safe Exports (enforce k-anonymity)
  getKSafeThreads(orgId: string): Promise<VThread[]>;
  getKSafeComments(orgId: string): Promise<VComment[]>;
  getKSafeCommentsByThread(threadId: string): Promise<VComment[]>;
  
  // Dashboard Stats
  getOrgStats(orgId: string): Promise<{
    totalThreads: number;
    totalFeedbackItems: number;
    totalTopics: number;
    readyThreads: number;
  }>;
  getRecentThreads(orgId: string, limit: number): Promise<Array<FeedbackThread & { topicName: string | null }>>;
  getNewThisWeek(orgId: string): Promise<number>;
  
  // Analytics
  getTopicActivity(orgId: string): Promise<Array<{
    topicId: string;
    topicName: string;
    threadCount: number;
    itemCount: number;
  }>>;
  getWeeklyActivityTrend(orgId: string, days: number): Promise<Array<{
    date: string;
    count: number;
  }>>;
  getUniqueParticipantCount(orgId: string): Promise<number>;
  
  // Moderation
  updateThreadModerationStatus(
    threadId: string, 
    moderationStatus: string, 
    moderatedBy: string, 
    orgId: string, 
    notes?: string
  ): Promise<FeedbackThread | undefined>;
  updateItemModerationStatus(
    itemId: string, 
    moderationStatus: string, 
    moderatedBy: string, 
    orgId: string, 
    notes?: string
  ): Promise<FeedbackItem | undefined>;
  createModerationAudit(audit: InsertModerationAudit): Promise<ModerationAudit>;
  getModerationAudit(targetType: string, targetId: string, orgId: string): Promise<ModerationAudit[]>;
  
  // Topic Suggestions
  createTopicSuggestion(suggestion: InsertTopicSuggestion): Promise<TopicSuggestion>;
  getTopicSuggestions(orgId: string, status?: string): Promise<Array<TopicSuggestion & { supporterCount: number }>>;
  updateTopicSuggestionStatus(id: string, status: string, orgId: string): Promise<TopicSuggestion | undefined>;
  findSimilarSuggestions(orgId: string, normalizedTitle: string): Promise<TopicSuggestion[]>;
  addSuggestionSupport(suggestionId: string, userId: string): Promise<void>;
  getSuggestionSupporterCount(suggestionId: string): Promise<number>;
  getPendingSuggestionCount(orgId: string): Promise<number>;
  
  // Audience
  getOrgAudience(orgId: string): Promise<OrgAudience | undefined>;
  upsertOrgAudience(audience: InsertOrgAudience): Promise<OrgAudience>;
  
  // Usage
  getOrgUsage(orgId: string): Promise<OrgUsage | undefined>;
  upsertOrgUsage(usage: InsertOrgUsage): Promise<OrgUsage>;
  
  // Webhooks
  isWebhookEventProcessed(eventId: string): Promise<boolean>;
  recordWebhookEvent(event: InsertWebhookEvent): Promise<void>;
  
  // Analytics
  trackEvent(event: InsertAnalyticsEvent): Promise<void>;
  getEvents(orgId: string, eventType?: string): Promise<AnalyticsEvent[]>;
}

export class PgStorage implements IStorage {
  // Orgs
  async getOrg(id: string): Promise<Org | undefined> {
    const result = await db.select().from(orgs).where(eq(orgs.id, id)).limit(1);
    return result[0];
  }

  async getOrgByStripeCustomerId(customerId: string): Promise<Org | undefined> {
    const result = await db.select().from(orgs).where(eq(orgs.stripeCustomerId, customerId)).limit(1);
    return result[0];
  }

  async getAllOrgsWithSlack(): Promise<Array<{ orgId: string; accessToken: string }>> {
    const result = await db
      .select({
        orgId: slackTeams.orgId,
        accessToken: slackTeams.accessToken,
      })
      .from(slackTeams)
      .where(sqlOperator`${slackTeams.accessToken} IS NOT NULL AND ${slackTeams.accessToken} != ''`);
    
    return result;
  }

  async createOrg(insertOrg: InsertOrg): Promise<Org> {
    const result = await db.insert(orgs).values(insertOrg).returning();
    return result[0];
  }

  async updateOrg(id: string, updates: Partial<InsertOrg>): Promise<Org | undefined> {
    const result = await db.update(orgs)
      .set(updates)
      .where(eq(orgs.id, id))
      .returning();
    return result[0];
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string, orgId: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.orgId, orgId)))
      .limit(1);
    return result[0];
  }

  async getUserBySlackId(slackUserId: string, orgId: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(and(eq(users.slackUserId, slackUserId), eq(users.orgId, orgId)))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getOrgUsers(orgId: string): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.orgId, orgId))
      .orderBy(desc(users.createdAt));
  }
  
  async updateUser(userId: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserRole(userId: string, role: string, orgId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role })
      .where(and(eq(users.id, userId), eq(users.orgId, orgId)))
      .returning();
    return result[0];
  }

  async deleteUser(userId: string, orgId: string): Promise<void> {
    await db.delete(users)
      .where(and(eq(users.id, userId), eq(users.orgId, orgId)));
  }

  // Invitations
  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const result = await db.insert(invitations).values(insertInvitation).returning();
    return result[0];
  }

  async getInvitation(id: string, orgId: string): Promise<Invitation | undefined> {
    const result = await db.select().from(invitations)
      .where(and(eq(invitations.id, id), eq(invitations.orgId, orgId)))
      .limit(1);
    return result[0];
  }

  async getInvitationById(id: string): Promise<Invitation | undefined> {
    const result = await db.select().from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);
    return result[0];
  }

  async getPendingInvitationBySlackUserId(slackUserId: string, orgId: string): Promise<Invitation | undefined> {
    const result = await db.select().from(invitations)
      .where(and(
        eq(invitations.slackUserId, slackUserId),
        eq(invitations.orgId, orgId),
        eq(invitations.status, 'pending')
      ))
      .limit(1);
    return result[0];
  }

  async getOrgInvitations(orgId: string, status?: string): Promise<Invitation[]> {
    if (status) {
      return await db.select().from(invitations)
        .where(and(eq(invitations.orgId, orgId), eq(invitations.status, status)))
        .orderBy(desc(invitations.createdAt));
    }
    return await db.select().from(invitations)
      .where(eq(invitations.orgId, orgId))
      .orderBy(desc(invitations.createdAt));
  }

  async updateInvitationStatus(id: string, status: string, orgId: string): Promise<Invitation | undefined> {
    const result = await db.update(invitations)
      .set({ status })
      .where(and(eq(invitations.id, id), eq(invitations.orgId, orgId)))
      .returning();
    return result[0];
  }

  // Slack Teams
  async getSlackTeamByTeamId(teamId: string): Promise<SlackTeam | undefined> {
    const result = await db.select().from(slackTeams).where(eq(slackTeams.teamId, teamId)).limit(1);
    return result[0];
  }

  async getSlackTeamByOrgId(orgId: string): Promise<SlackTeam | undefined> {
    const result = await db.select().from(slackTeams).where(eq(slackTeams.orgId, orgId)).limit(1);
    return result[0];
  }

  async createSlackTeam(insertTeam: InsertSlackTeam): Promise<SlackTeam> {
    const result = await db.insert(slackTeams).values(insertTeam).returning();
    return result[0];
  }

  async updateSlackTeamToken(teamId: string, accessToken: string): Promise<void> {
    await db.update(slackTeams)
      .set({ accessToken })
      .where(eq(slackTeams.teamId, teamId));
  }

  // Slack Settings
  async getSlackSettings(orgId: string): Promise<SlackSettings | undefined> {
    const result = await db.select().from(slackSettings).where(eq(slackSettings.orgId, orgId)).limit(1);
    return result[0];
  }

  async upsertSlackSettings(insertSettings: InsertSlackSettings): Promise<SlackSettings> {
    const existing = await this.getSlackSettings(insertSettings.orgId);
    if (existing) {
      const result = await db.update(slackSettings)
        .set(insertSettings)
        .where(eq(slackSettings.orgId, insertSettings.orgId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(slackSettings).values(insertSettings).returning();
      return result[0];
    }
  }

  // Topics
  async getTopics(orgId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.orgId, orgId)).orderBy(desc(topics.createdAt));
  }

  async getCategorizedTopics(orgId: string): Promise<{
    created: Topic[];
    instances: Topic[];
    archived: Topic[];
  }> {
    const allTopics = await db.select().from(topics)
      .where(eq(topics.orgId, orgId))
      .orderBy(desc(topics.createdAt));
    
    const created: Topic[] = [];
    const instances: Topic[] = [];
    const archived: Topic[] = [];
    
    for (const topic of allTopics) {
      // Skip parent topics (they're just containers)
      if (topic.isParent) {
        continue;
      }
      
      // Archived topics
      if (topic.status === 'archived' || topic.status === 'actioned') {
        archived.push(topic);
      }
      // Weekly instances (General Feedback instances)
      else if (topic.parentTopicId) {
        instances.push(topic);
      }
      // Created topics (custom campaigns)
      else {
        created.push(topic);
      }
    }
    
    return { created, instances, archived };
  }

  async getTopic(id: string, orgId: string): Promise<Topic | undefined> {
    const result = await db.select().from(topics)
      .where(and(eq(topics.id, id), eq(topics.orgId, orgId)))
      .limit(1);
    return result[0];
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const result = await db.insert(topics).values(insertTopic).returning();
    return result[0];
  }

  async updateTopic(id: string, updateData: Partial<InsertTopic>, orgId: string): Promise<Topic | undefined> {
    const result = await db.update(topics)
      .set(updateData)
      .where(and(eq(topics.id, id), eq(topics.orgId, orgId)))
      .returning();
    return result[0];
  }

  async getTopicBySlug(slug: string, orgId: string): Promise<Topic | undefined> {
    const result = await db.select().from(topics)
      .where(and(eq(topics.slug, slug), eq(topics.orgId, orgId)))
      .limit(1);
    return result[0];
  }

  async deleteTopic(id: string, orgId: string): Promise<void> {
    await db.delete(topics)
      .where(and(eq(topics.id, id), eq(topics.orgId, orgId)));
  }

  async getExpiredTopics(): Promise<Topic[]> {
    const now = new Date();
    return await db.select().from(topics)
      .where(and(
        eq(topics.isActive, true),
        eq(topics.status, 'collecting'),
        sqlOperator`${topics.expiresAt} <= ${now}`
      ));
  }

  async getTopicParticipantCount(topicId: string, orgId: string): Promise<number> {
    // Get all threads for this topic
    const topicThreads = await db.select()
      .from(feedbackThreads)
      .where(and(
        eq(feedbackThreads.topicId, topicId),
        eq(feedbackThreads.orgId, orgId)
      ));

    if (topicThreads.length === 0) {
      return 0;
    }

    // Collect unique participant hashes across all threads
    const uniqueParticipants = new Set<string>();
    
    for (const thread of topicThreads) {
      const items = await db.select({ submitterHash: feedbackItems.submitterHash })
        .from(feedbackItems)
        .where(eq(feedbackItems.threadId, thread.id));
      
      items.forEach(item => {
        if (item.submitterHash) {
          uniqueParticipants.add(item.submitterHash);
        }
      });
    }

    return uniqueParticipants.size;
  }

  // General Feedback Instances
  async getOrCreateParentTopic(orgId: string, userId: string): Promise<Topic> {
    // Check if parent topic already exists
    const existing = await db.select().from(topics)
      .where(and(
        eq(topics.orgId, orgId),
        eq(topics.isParent, true),
        eq(topics.slug, 'general-feedback')
      ))
      .limit(1);
    
    if (existing[0]) {
      return existing[0];
    }
    
    // Create parent topic
    const result = await db.insert(topics).values({
      orgId,
      name: 'General Feedback',
      slug: 'general-feedback',
      description: 'Share your thoughts, ideas, and feedback about anything',
      kThreshold: 5,
      isActive: true,
      windowDays: 14,
      status: 'collecting',
      ownerId: userId,
      isParent: true,
    }).returning();
    
    return result[0];
  }

  async getCurrentGeneralFeedbackInstance(orgId: string): Promise<Topic | undefined> {
    const now = new Date();
    const result = await db.select().from(topics)
      .where(and(
        eq(topics.orgId, orgId),
        eq(topics.isParent, false),
        sqlOperator`${topics.parentTopicId} IS NOT NULL`,
        eq(topics.isActive, true),
        sqlOperator`${topics.windowStart} <= ${now}`,
        sqlOperator`${topics.windowEnd} > ${now}`
      ))
      .limit(1);
    
    return result[0];
  }

  async createGeneralFeedbackInstance(
    parentId: string, 
    orgId: string, 
    windowStart: Date, 
    windowEnd: Date, 
    instanceIdentifier: string
  ): Promise<Topic> {
    // Get parent topic to inherit settings
    const parent = await this.getTopic(parentId, orgId);
    if (!parent) {
      throw new Error('Parent topic not found');
    }
    
    const result = await db.insert(topics).values({
      orgId,
      name: `${parent.name} — ${instanceIdentifier}`,
      slug: `general-feedback-${instanceIdentifier.toLowerCase().replace(/\s+/g, '-')}`,
      description: parent.description,
      kThreshold: parent.kThreshold,
      isActive: true,
      expiresAt: windowEnd,
      windowDays: parent.windowDays,
      status: 'collecting',
      ownerId: parent.ownerId,
      parentTopicId: parentId,
      isParent: false,
      windowStart,
      windowEnd,
      instanceIdentifier,
    }).returning();
    
    return result[0];
  }

  async getExpiredInstances(): Promise<Topic[]> {
    const now = new Date();
    return await db.select().from(topics)
      .where(and(
        eq(topics.isParent, false),
        sqlOperator`${topics.parentTopicId} IS NOT NULL`,
        eq(topics.isActive, true),
        eq(topics.status, 'collecting'),
        sqlOperator`${topics.windowEnd} <= ${now}`
      ));
  }

  // Feedback Threads
  async createFeedbackThread(insertThread: InsertFeedbackThread): Promise<FeedbackThread> {
    const result = await db.insert(feedbackThreads).values(insertThread).returning();
    return result[0];
  }

  async getFeedbackThread(id: string): Promise<FeedbackThread | undefined> {
    const result = await db.select().from(feedbackThreads).where(eq(feedbackThreads.id, id)).limit(1);
    return result[0];
  }

  async getFeedbackThreads(orgId: string): Promise<FeedbackThread[]> {
    return await db.select().from(feedbackThreads).where(eq(feedbackThreads.orgId, orgId));
  }

  async getActiveCollectingThread(topicId: string, orgId: string): Promise<FeedbackThread | undefined> {
    const result = await db.select().from(feedbackThreads)
      .where(and(
        eq(feedbackThreads.topicId, topicId),
        eq(feedbackThreads.orgId, orgId),
        eq(feedbackThreads.status, 'collecting')
      ))
      .orderBy(sqlOperator`${feedbackThreads.createdAt} DESC`)
      .limit(1);
    return result[0];
  }

  async updateThreadParticipantCount(threadId: string, count: number): Promise<void> {
    await db.update(feedbackThreads)
      .set({ participantCount: count })
      .where(eq(feedbackThreads.id, threadId));
  }

  async updateThreadStatus(threadId: string, status: string): Promise<void> {
    await db.update(feedbackThreads)
      .set({ status })
      .where(eq(feedbackThreads.id, threadId));
  }

  // Feedback Items
  async createFeedbackItem(insertItem: InsertFeedbackItem): Promise<FeedbackItem> {
    let finalItem = { ...insertItem };
    
    if (process.env.TM_MASTER_KEY_V1 && insertItem.threadId) {
      try {
        const { encryptFeedbackFields } = await import('./utils/encryptFeedback');
        const encrypted = await encryptFeedbackFields(
          insertItem.orgId,
          insertItem.threadId,
          insertItem.content || null,
          insertItem.behavior || null,
          insertItem.impact || null
        );
        
        finalItem = {
          ...insertItem,
          contentCt: encrypted.contentCt,
          behaviorCt: encrypted.behaviorCt,
          impactCt: encrypted.impactCt,
          nonce: encrypted.nonce,
          aadHash: encrypted.aadHash,
        };
      } catch (error) {
        console.error('Encryption error:', error);
      }
    }
    
    const result = await db.insert(feedbackItems).values(finalItem).returning();
    return result[0];
  }

  async getFeedbackItem(itemId: string, orgId: string): Promise<FeedbackItem | undefined> {
    const result = await db.select().from(feedbackItems)
      .where(and(
        eq(feedbackItems.id, itemId),
        eq(feedbackItems.orgId, orgId)
      ))
      .limit(1);
    return result[0];
  }

  async getFeedbackItemsByThread(threadId: string): Promise<FeedbackItem[]> {
    return await db.select().from(feedbackItems).where(eq(feedbackItems.threadId, threadId));
  }

  async getUniqueParticipants(threadId: string): Promise<string[]> {
    const result = await db
      .selectDistinct({ slackUserId: feedbackItems.slackUserId })
      .from(feedbackItems)
      .where(eq(feedbackItems.threadId, threadId));
    
    return result.map(r => r.slackUserId);
  }

  async hasUserSubmittedToTopic(topicId: string, slackUserId: string, orgId: string): Promise<boolean> {
    const result = await db
      .select({ id: feedbackItems.id })
      .from(feedbackItems)
      .where(and(
        eq(feedbackItems.topicId, topicId),
        eq(feedbackItems.slackUserId, slackUserId),
        eq(feedbackItems.orgId, orgId)
      ))
      .limit(1);
    
    return result.length > 0;
  }

  async updateFeedbackItemStatus(itemId: string, status: string, moderatorId: string, orgId: string): Promise<void> {
    // Update with org verification via join
    await db.update(feedbackItems)
      .set({ 
        status, 
        moderatorId, 
        moderatedAt: new Date() 
      })
      .where(and(
        eq(feedbackItems.id, itemId),
        eq(feedbackItems.orgId, orgId)
      ));
  }

  // K-Safe Exports - These methods query through views that enforce k-anonymity
  async getKSafeThreads(orgId: string): Promise<VThread[]> {
    const results = await db
      .select()
      .from(vThreads)
      .where(and(
        eq(vThreads.orgId, orgId),
        eq(vThreads.renderState, 'visible')
      ));
    return results as VThread[];
  }

  async getKSafeComments(orgId: string): Promise<VComment[]> {
    const results = await db
      .select()
      .from(vComments)
      .where(and(
        eq(vComments.orgId, orgId),
        eq(vComments.renderState, 'visible')
      ));
    return results as VComment[];
  }

  async getKSafeCommentsByThread(threadId: string): Promise<VComment[]> {
    const results = await db
      .select()
      .from(vComments)
      .where(and(
        eq(vComments.threadId, threadId),
        eq(vComments.renderState, 'visible')
      ));
    return results as VComment[];
  }

  // Dashboard Stats
  async getOrgStats(orgId: string): Promise<{
    totalThreads: number;
    totalFeedbackItems: number;
    totalTopics: number;
    readyThreads: number;
  }> {
    const [threadsResult, itemsResult, topicsResult, readyResult] = await Promise.all([
      db.select({ count: sqlOperator<number>`count(*)::int` })
        .from(feedbackThreads)
        .where(eq(feedbackThreads.orgId, orgId)),
      db.select({ count: sqlOperator<number>`count(*)::int` })
        .from(feedbackItems)
        .innerJoin(feedbackThreads, eq(feedbackItems.threadId, feedbackThreads.id))
        .where(eq(feedbackThreads.orgId, orgId)),
      db.select({ count: sqlOperator<number>`count(*)::int` })
        .from(topics)
        .where(eq(topics.orgId, orgId)),
      db.select({ count: sqlOperator<number>`count(*)::int` })
        .from(feedbackThreads)
        .where(and(
          eq(feedbackThreads.orgId, orgId),
          eq(feedbackThreads.status, 'ready')
        )),
    ]);

    return {
      totalThreads: threadsResult[0]?.count || 0,
      totalFeedbackItems: itemsResult[0]?.count || 0,
      totalTopics: topicsResult[0]?.count || 0,
      readyThreads: readyResult[0]?.count || 0,
    };
  }

  async getRecentThreads(orgId: string, limit: number): Promise<Array<FeedbackThread & { topicName: string | null }>> {
    const result = await db.select({
      id: feedbackThreads.id,
      orgId: feedbackThreads.orgId,
      topicId: feedbackThreads.topicId,
      title: feedbackThreads.title,
      status: feedbackThreads.status,
      kThreshold: feedbackThreads.kThreshold,
      participantCount: feedbackThreads.participantCount,
      slackMessageTs: feedbackThreads.slackMessageTs,
      slackChannelId: feedbackThreads.slackChannelId,
      moderationStatus: feedbackThreads.moderationStatus,
      moderationNotes: feedbackThreads.moderationNotes,
      moderatedBy: feedbackThreads.moderatedBy,
      moderatedAt: feedbackThreads.moderatedAt,
      createdAt: feedbackThreads.createdAt,
      topicName: topics.name,
    })
      .from(feedbackThreads)
      .leftJoin(topics, eq(feedbackThreads.topicId, topics.id))
      .where(eq(feedbackThreads.orgId, orgId))
      .orderBy(sqlOperator`${feedbackThreads.createdAt} DESC`)
      .limit(limit);
    
    return result;
  }

  async getNewThisWeek(orgId: string): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const result = await db.select({ count: sqlOperator<number>`count(*)::int` })
      .from(feedbackItems)
      .innerJoin(feedbackThreads, eq(feedbackItems.threadId, feedbackThreads.id))
      .where(and(
        eq(feedbackThreads.orgId, orgId),
        sqlOperator`${feedbackItems.createdAt} >= ${oneWeekAgo}`
      ));
    
    return result[0]?.count || 0;
  }

  // Analytics
  async getTopicActivity(orgId: string): Promise<Array<{
    topicId: string;
    topicName: string;
    threadCount: number;
    itemCount: number;
  }>> {
    const result = await db.select({
      topicId: topics.id,
      topicName: topics.name,
      threadCount: sqlOperator<number>`count(distinct ${feedbackThreads.id})::int`,
      itemCount: sqlOperator<number>`count(${feedbackItems.id})::int`,
    })
      .from(topics)
      .leftJoin(feedbackThreads, and(
        eq(feedbackThreads.topicId, topics.id),
        eq(feedbackThreads.orgId, orgId)
      ))
      .leftJoin(feedbackItems, eq(feedbackItems.threadId, feedbackThreads.id))
      .where(eq(topics.orgId, orgId))
      .groupBy(topics.id, topics.name)
      .orderBy(sqlOperator`count(distinct ${feedbackThreads.id}) DESC`);
    
    return result;
  }

  async getWeeklyActivityTrend(orgId: string, days: number = 7): Promise<Array<{
    date: string;
    count: number;
  }>> {
    const result = await db.select({
      date: sqlOperator<string>`date(${feedbackItems.createdAt})`,
      count: sqlOperator<number>`count(*)::int`,
    })
      .from(feedbackItems)
      .innerJoin(feedbackThreads, eq(feedbackItems.threadId, feedbackThreads.id))
      .where(and(
        eq(feedbackThreads.orgId, orgId),
        sqlOperator`${feedbackItems.createdAt} >= current_date - interval '${days} days'`
      ))
      .groupBy(sqlOperator`date(${feedbackItems.createdAt})`)
      .orderBy(sqlOperator`date(${feedbackItems.createdAt}) ASC`);
    
    return result;
  }

  async getUniqueParticipantCount(orgId: string): Promise<number> {
    const result = await db.select({
      count: sqlOperator<number>`count(distinct ${feedbackItems.slackUserId})::int`,
    })
      .from(feedbackItems)
      .innerJoin(feedbackThreads, eq(feedbackItems.threadId, feedbackThreads.id))
      .where(eq(feedbackThreads.orgId, orgId));
    
    return result[0]?.count || 0;
  }
  
  // Moderation
  async updateThreadModerationStatus(
    threadId: string, 
    moderationStatus: string, 
    moderatedBy: string, 
    orgId: string, 
    notes?: string
  ): Promise<FeedbackThread | undefined> {
    const updateData: any = {
      moderationStatus,
      moderatedBy,
      moderatedAt: new Date(),
    };
    
    if (notes !== undefined) {
      updateData.moderationNotes = notes;
    }
    
    const result = await db.update(feedbackThreads)
      .set(updateData)
      .where(and(
        eq(feedbackThreads.id, threadId),
        eq(feedbackThreads.orgId, orgId)
      ))
      .returning();
    
    return result[0];
  }
  
  async updateItemModerationStatus(
    itemId: string, 
    moderationStatus: string, 
    moderatedBy: string, 
    orgId: string, 
    notes?: string
  ): Promise<FeedbackItem | undefined> {
    const updateData: any = {
      moderationStatus,
      moderatorId: moderatedBy,
      moderatedAt: new Date(),
    };
    
    if (notes !== undefined) {
      updateData.moderationNotes = notes;
    }
    
    const result = await db.update(feedbackItems)
      .set(updateData)
      .where(and(
        eq(feedbackItems.id, itemId),
        eq(feedbackItems.orgId, orgId)
      ))
      .returning();
    
    return result[0];
  }
  
  async createModerationAudit(audit: InsertModerationAudit): Promise<ModerationAudit> {
    const result = await db.insert(moderationAudit).values(audit).returning();
    return result[0];
  }
  
  async getModerationAudit(targetType: string, targetId: string, orgId: string): Promise<ModerationAudit[]> {
    const result = await db.select()
      .from(moderationAudit)
      .where(and(
        eq(moderationAudit.targetType, targetType),
        eq(moderationAudit.targetId, targetId),
        eq(moderationAudit.orgId, orgId)
      ))
      .orderBy(sqlOperator`${moderationAudit.createdAt} DESC`);
    
    return result;
  }
  
  // Topic Suggestions
  async createTopicSuggestion(suggestion: InsertTopicSuggestion): Promise<TopicSuggestion> {
    const result = await db.insert(topicSuggestions).values(suggestion).returning();
    return result[0];
  }
  
  async getTopicSuggestions(orgId: string, status?: string): Promise<Array<TopicSuggestion & { supporterCount: number }>> {
    const baseQuery = db
      .select({
        id: topicSuggestions.id,
        orgId: topicSuggestions.orgId,
        suggestedBy: topicSuggestions.suggestedBy,
        title: topicSuggestions.title,
        normalizedTitle: topicSuggestions.normalizedTitle,
        status: topicSuggestions.status,
        statusReason: topicSuggestions.statusReason,
        duplicateOfId: topicSuggestions.duplicateOfId,
        createdAt: topicSuggestions.createdAt,
        supporterCount: sqlOperator<number>`COALESCE(COUNT(${topicSuggestionSupports.id})::int, 0)`,
      })
      .from(topicSuggestions)
      .leftJoin(
        topicSuggestionSupports,
        eq(topicSuggestions.id, topicSuggestionSupports.suggestionId)
      )
      .groupBy(topicSuggestions.id);

    if (status) {
      const result = await baseQuery
        .where(and(
          eq(topicSuggestions.orgId, orgId),
          eq(topicSuggestions.status, status)
        ))
        .orderBy(sqlOperator`${topicSuggestions.createdAt} DESC`);
      return result;
    } else {
      const result = await baseQuery
        .where(eq(topicSuggestions.orgId, orgId))
        .orderBy(sqlOperator`${topicSuggestions.createdAt} DESC`);
      return result;
    }
  }
  
  async updateTopicSuggestionStatus(id: string, status: string, orgId: string): Promise<TopicSuggestion | undefined> {
    const result = await db.update(topicSuggestions)
      .set({ status })
      .where(and(
        eq(topicSuggestions.id, id),
        eq(topicSuggestions.orgId, orgId)
      ))
      .returning();
    return result[0];
  }
  
  async findSimilarSuggestions(orgId: string, normalizedTitle: string): Promise<TopicSuggestion[]> {
    const result = await db.select()
      .from(topicSuggestions)
      .where(and(
        eq(topicSuggestions.orgId, orgId),
        eq(topicSuggestions.normalizedTitle, normalizedTitle),
        sqlOperator`${topicSuggestions.status} IN ('pending', 'approved')`,
        sqlOperator`${topicSuggestions.createdAt} >= NOW() - INTERVAL '90 days'`
      ))
      .orderBy(sqlOperator`${topicSuggestions.createdAt} DESC`);
    return result;
  }
  
  async addSuggestionSupport(suggestionId: string, userId: string): Promise<void> {
    await db.insert(topicSuggestionSupports)
      .values({ suggestionId, userId })
      .onConflictDoNothing();
  }
  
  async getSuggestionSupporterCount(suggestionId: string): Promise<number> {
    const result = await db.select({ count: sqlOperator<number>`COUNT(*)::int` })
      .from(topicSuggestionSupports)
      .where(eq(topicSuggestionSupports.suggestionId, suggestionId));
    return result[0]?.count || 0;
  }
  
  async getPendingSuggestionCount(orgId: string): Promise<number> {
    const result = await db.select({ count: sqlOperator<number>`COUNT(*)::int` })
      .from(topicSuggestions)
      .where(and(
        eq(topicSuggestions.orgId, orgId),
        eq(topicSuggestions.status, 'pending')
      ));
    return result[0]?.count || 0;
  }
  
  // Audience
  async getOrgAudience(orgId: string): Promise<OrgAudience | undefined> {
    const result = await db.select()
      .from(orgAudience)
      .where(eq(orgAudience.orgId, orgId))
      .limit(1);
    return result[0];
  }
  
  async upsertOrgAudience(audience: InsertOrgAudience): Promise<OrgAudience> {
    const result = await db.insert(orgAudience)
      .values({ ...audience, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: orgAudience.orgId,
        set: { ...audience, updatedAt: new Date() }
      })
      .returning();
    return result[0];
  }
  
  // Usage
  async getOrgUsage(orgId: string): Promise<OrgUsage | undefined> {
    const result = await db.select()
      .from(orgUsage)
      .where(eq(orgUsage.orgId, orgId))
      .limit(1);
    return result[0];
  }
  
  async upsertOrgUsage(usage: InsertOrgUsage): Promise<OrgUsage> {
    const result = await db.insert(orgUsage)
      .values({ ...usage, lastSynced: new Date() })
      .onConflictDoUpdate({
        target: orgUsage.orgId,
        set: { ...usage, lastSynced: new Date() }
      })
      .returning();
    return result[0];
  }
  
  // Webhooks
  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const result = await db.select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId))
      .limit(1);
    return result.length > 0;
  }
  
  async recordWebhookEvent(event: InsertWebhookEvent): Promise<void> {
    await db.insert(webhookEvents).values(event);
  }
  
  // Analytics
  async trackEvent(event: InsertAnalyticsEvent): Promise<void> {
    await db.insert(analyticsEvents).values(event);
  }
  
  async getEvents(orgId: string, eventType?: string): Promise<AnalyticsEvent[]> {
    if (eventType) {
      return await db.select()
        .from(analyticsEvents)
        .where(and(
          eq(analyticsEvents.orgId, orgId),
          eq(analyticsEvents.eventType, eventType)
        ))
        .orderBy(desc(analyticsEvents.createdAt));
    } else {
      return await db.select()
        .from(analyticsEvents)
        .where(eq(analyticsEvents.orgId, orgId))
        .orderBy(desc(analyticsEvents.createdAt));
    }
  }
}

export const storage = new PgStorage();

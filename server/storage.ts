import { eq, and, sql as sqlOperator } from "drizzle-orm";
import { db } from "./db";
import { 
  orgs, users, slackTeams, slackSettings, topics,
  feedbackThreads, feedbackItems,
  type Org, type InsertOrg,
  type User, type InsertUser,
  type SlackTeam, type InsertSlackTeam,
  type SlackSettings, type InsertSlackSettings,
  type Topic, type InsertTopic,
  type FeedbackThread, type InsertFeedbackThread,
  type FeedbackItem, type InsertFeedbackItem
} from "@shared/schema";

export interface IStorage {
  // Orgs
  getOrg(id: string): Promise<Org | undefined>;
  createOrg(org: InsertOrg): Promise<Org>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string, orgId: string): Promise<User | undefined>;
  getUserBySlackId(slackUserId: string, orgId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  getTopic(id: string, orgId: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, topic: Partial<InsertTopic>, orgId: string): Promise<Topic | undefined>;
  deleteTopic(id: string, orgId: string): Promise<void>;
  
  // Feedback Threads
  createFeedbackThread(thread: InsertFeedbackThread): Promise<FeedbackThread>;
  getFeedbackThread(id: string): Promise<FeedbackThread | undefined>;
  getFeedbackThreads(orgId: string): Promise<FeedbackThread[]>;
  updateThreadParticipantCount(threadId: string, count: number): Promise<void>;
  updateThreadStatus(threadId: string, status: string): Promise<void>;
  
  // Feedback Items
  createFeedbackItem(item: InsertFeedbackItem): Promise<FeedbackItem>;
  getFeedbackItemsByThread(threadId: string): Promise<FeedbackItem[]>;
  getUniqueParticipants(threadId: string): Promise<string[]>;
  updateFeedbackItemStatus(itemId: string, status: string, moderatorId: string, orgId: string): Promise<void>;
  
  // Dashboard Stats
  getOrgStats(orgId: string): Promise<{
    totalThreads: number;
    totalFeedbackItems: number;
    totalTopics: number;
    readyThreads: number;
  }>;
  getRecentThreads(orgId: string, limit: number): Promise<Array<FeedbackThread & { topicName: string | null }>>;
  
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
}

export class PgStorage implements IStorage {
  // Orgs
  async getOrg(id: string): Promise<Org | undefined> {
    const result = await db.select().from(orgs).where(eq(orgs.id, id)).limit(1);
    return result[0];
  }

  async createOrg(insertOrg: InsertOrg): Promise<Org> {
    const result = await db.insert(orgs).values(insertOrg).returning();
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
    return await db.select().from(topics).where(eq(topics.orgId, orgId));
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

  async deleteTopic(id: string, orgId: string): Promise<void> {
    await db.delete(topics)
      .where(and(eq(topics.id, id), eq(topics.orgId, orgId)));
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
    const result = await db.insert(feedbackItems).values(insertItem).returning();
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
}

export const storage = new PgStorage();

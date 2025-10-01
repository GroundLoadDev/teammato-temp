import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  orgs, users, slackTeams, slackSettings, topics,
  type Org, type InsertOrg,
  type User, type InsertUser,
  type SlackTeam, type InsertSlackTeam,
  type SlackSettings, type InsertSlackSettings,
  type Topic, type InsertTopic
} from "@shared/schema";

export interface IStorage {
  // Orgs
  getOrg(id: string): Promise<Org | undefined>;
  createOrg(org: InsertOrg): Promise<Org>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string, orgId: string): Promise<User | undefined>;
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
  createTopic(topic: InsertTopic): Promise<Topic>;
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

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const result = await db.insert(topics).values(insertTopic).returning();
    return result[0];
  }
}

export const storage = new PgStorage();

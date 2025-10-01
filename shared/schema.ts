import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orgs = pgTable("orgs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  verifiedDomains: text("verified_domains").array().notNull().default(sql`ARRAY[]::text[]`),
  ssoProvider: jsonb("sso_provider"),
  settings: jsonb("settings").notNull().default({
    k_anonymity: 5,
    profanity_policy: 'strict',
    redact_ui: true,
    enable_oidc: false,
    enable_llm_moderation: false,
    plan: 'trial',
    retention_days: 365,
    legal_hold: false
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  slackUserId: text("slack_user_id"),
  email: text("email"),
  role: text("role").notNull().default('member'),
  profile: jsonb("profile"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const slackTeams = pgTable("slack_teams", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  teamId: text("team_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  botUserId: text("bot_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const slackSettings = pgTable("slack_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }).unique(),
  digestChannel: text("digest_channel"),
  digestEnabled: boolean("digest_enabled").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Insert schemas
export const insertOrgSchema = createInsertSchema(orgs).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSlackTeamSchema = createInsertSchema(slackTeams).omit({ id: true, createdAt: true });
export const insertSlackSettingsSchema = createInsertSchema(slackSettings).omit({ id: true, createdAt: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true });

// Types
export type Org = typeof orgs.$inferSelect;
export type InsertOrg = z.infer<typeof insertOrgSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SlackTeam = typeof slackTeams.$inferSelect;
export type InsertSlackTeam = z.infer<typeof insertSlackTeamSchema>;

export type SlackSettings = typeof slackSettings.$inferSelect;
export type InsertSlackSettings = z.infer<typeof insertSlackSettingsSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

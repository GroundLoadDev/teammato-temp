import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid, integer, unique, date } from "drizzle-orm/pg-core";
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
  description: text("description"),
  slackChannelId: text("slack_channel_id"),
  kThreshold: integer("k_threshold").notNull().default(5),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  windowDays: integer("window_days").notNull().default(21),
  status: text("status").notNull().default('collecting'),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: 'set null' }),
  actionNotes: text("action_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueSlug: unique().on(table.orgId, table.slug),
}));

export const feedbackThreads = pgTable("feedback_threads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  status: text("status").notNull().default('collecting'),
  kThreshold: integer("k_threshold").notNull().default(5),
  participantCount: integer("participant_count").notNull().default(0),
  slackMessageTs: text("slack_message_ts"),
  slackChannelId: text("slack_channel_id"),
  moderationStatus: text("moderation_status").notNull().default('auto_approved'),
  moderationNotes: text("moderation_notes"),
  moderatedBy: uuid("moderated_by").references(() => users.id, { onDelete: 'set null' }),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedbackItems = pgTable("feedback_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: uuid("thread_id").notNull().references(() => feedbackThreads.id, { onDelete: 'cascade' }),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  slackUserId: text("slack_user_id").notNull(),
  content: text("content"),
  behavior: text("behavior"),
  impact: text("impact"),
  situationCoarse: varchar("situation_coarse", { length: 120 }),
  submitterHash: varchar("submitter_hash", { length: 64 }),
  createdAtDay: date("created_at_day"),
  status: text("status").notNull().default('pending'),
  moderationStatus: text("moderation_status").notNull().default('auto_approved'),
  moderationNotes: text("moderation_notes"),
  moderatorId: uuid("moderator_id").references(() => users.id, { onDelete: 'set null' }),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueParticipation: unique().on(table.threadId, table.slackUserId),
}));

export const moderationAudit = pgTable("moderation_audit", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  action: text("action").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  reason: text("reason"),
  adminUserId: uuid("admin_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const topicSuggestions = pgTable("topic_suggestions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  suggestedBy: uuid("suggested_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 60 }).notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orgStatusIndex: unique().on(table.orgId, table.status, table.createdAt),
}));

// Insert schemas
export const insertOrgSchema = createInsertSchema(orgs).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSlackTeamSchema = createInsertSchema(slackTeams).omit({ id: true, createdAt: true });
export const insertSlackSettingsSchema = createInsertSchema(slackSettings).omit({ id: true, createdAt: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true });
export const insertFeedbackThreadSchema = createInsertSchema(feedbackThreads).omit({ id: true, createdAt: true });
export const insertFeedbackItemSchema = createInsertSchema(feedbackItems).omit({ id: true, createdAt: true });
export const insertModerationAuditSchema = createInsertSchema(moderationAudit).omit({ id: true, createdAt: true });
export const insertTopicSuggestionSchema = createInsertSchema(topicSuggestions).omit({ id: true, createdAt: true });

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

export type FeedbackThread = typeof feedbackThreads.$inferSelect;
export type InsertFeedbackThread = z.infer<typeof insertFeedbackThreadSchema>;

export type FeedbackItem = typeof feedbackItems.$inferSelect;
export type InsertFeedbackItem = z.infer<typeof insertFeedbackItemSchema>;

export type ModerationAudit = typeof moderationAudit.$inferSelect;
export type InsertModerationAudit = z.infer<typeof insertModerationAuditSchema>;

export type TopicSuggestion = typeof topicSuggestions.$inferSelect;
export type InsertTopicSuggestion = z.infer<typeof insertTopicSuggestionSchema>;

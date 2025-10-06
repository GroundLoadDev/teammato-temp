import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, uuid, integer, unique, date, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
  toDriver(value: Buffer) {
    return value;
  },
  fromDriver(value: unknown) {
    return value as Buffer;
  },
});

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
    enable_theming: false,
    plan: 'trial',
    retention_days: 365,
    legal_hold: false
  }),
  // Stripe billing fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  billingStatus: text("billing_status").default('trialing'),
  seatCap: integer("seat_cap").default(250),
  billingPeriod: text("billing_period").default('monthly'),
  priceAmount: integer("price_amount").default(0), // in cents
  trialEnd: timestamp("trial_end"),
  cancelsAt: timestamp("cancels_at"),
  graceEndsAt: timestamp("grace_ends_at"),
  billingEmail: text("billing_email"),
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
  parentTopicId: uuid("parent_topic_id").references((): any => topics.id, { onDelete: 'cascade' }),
  isParent: boolean("is_parent").notNull().default(false),
  windowStart: timestamp("window_start"),
  windowEnd: timestamp("window_end"),
  instanceIdentifier: text("instance_identifier"),
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
  contentCt: bytea("content_ct"),
  behaviorCt: bytea("behavior_ct"),
  impactCt: bytea("impact_ct"),
  nonce: bytea("nonce"),
  aadHash: bytea("aad_hash"),
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

export const orgKeys = pgTable("org_keys", {
  orgId: uuid("org_id").primaryKey().references(() => orgs.id, { onDelete: 'cascade' }),
  wrappedDek: bytea("wrapped_dek").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  rotatedAt: timestamp("rotated_at"),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  slackUserId: text("slack_user_id").notNull(),
  slackHandle: text("slack_handle").notNull(),
  email: text("email"),
  role: text("role").notNull(),
  invitedBy: uuid("invited_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  uniquePendingInvite: unique().on(table.orgId, table.slackUserId, table.status),
}));

export const postEmbeddings = pgTable("post_embeddings", {
  postId: uuid("post_id").primaryKey().references(() => feedbackItems.id, { onDelete: 'cascade' }),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  periodDate: date("period_date").notNull(),
  vector: jsonb("vector").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const themes = pgTable("themes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  label: text("label").notNull(),
  summary: text("summary").notNull(),
  postsCount: integer("posts_count").notNull(),
  topTerms: text("top_terms").array().notNull(),
  channels: text("channels").array().notNull(),
  deptHits: jsonb("dept_hits").notNull(),
  trendDelta: integer("trend_delta").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const themePosts = pgTable("theme_posts", {
  themeId: uuid("theme_id").notNull().references(() => themes.id, { onDelete: 'cascade' }),
  postId: uuid("post_id").notNull().references(() => feedbackItems.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: unique().on(table.themeId, table.postId),
}));

export const orgAudience = pgTable("org_audience", {
  orgId: uuid("org_id").primaryKey().references(() => orgs.id, { onDelete: 'cascade' }),
  mode: text("mode").notNull().default('workspace'),
  usergroupId: text("usergroup_id"),
  channelIds: text("channel_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  excludeGuests: boolean("exclude_guests").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orgUsage = pgTable("org_usage", {
  orgId: uuid("org_id").primaryKey().references(() => orgs.id, { onDelete: 'cascade' }),
  eligibleCount: integer("eligible_count").notNull().default(0),
  lastSynced: timestamp("last_synced").notNull().defaultNow(),
});

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
export const insertOrgKeySchema = createInsertSchema(orgKeys).omit({ createdAt: true });
export const insertInvitationSchema = createInsertSchema(invitations).omit({ id: true, createdAt: true });
export const insertPostEmbeddingSchema = createInsertSchema(postEmbeddings).omit({ createdAt: true });
export const insertThemeSchema = createInsertSchema(themes).omit({ id: true, createdAt: true });
export const insertThemePostSchema = createInsertSchema(themePosts);
export const insertOrgAudienceSchema = createInsertSchema(orgAudience).omit({ updatedAt: true });
export const insertOrgUsageSchema = createInsertSchema(orgUsage).omit({ lastSynced: true });

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

export type OrgKey = typeof orgKeys.$inferSelect;
export type InsertOrgKey = z.infer<typeof insertOrgKeySchema>;

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

export type PostEmbedding = typeof postEmbeddings.$inferSelect;
export type InsertPostEmbedding = z.infer<typeof insertPostEmbeddingSchema>;

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = z.infer<typeof insertThemeSchema>;

export type ThemePost = typeof themePosts.$inferSelect;
export type InsertThemePost = z.infer<typeof insertThemePostSchema>;

export type OrgAudience = typeof orgAudience.$inferSelect;
export type InsertOrgAudience = z.infer<typeof insertOrgAudienceSchema>;

export type OrgUsage = typeof orgUsage.$inferSelect;
export type InsertOrgUsage = z.infer<typeof insertOrgUsageSchema>;

// Audience Mode Enum
export const AUDIENCE_MODE = {
  WORKSPACE: 'workspace',
  USER_GROUP: 'user_group',
  CHANNELS: 'channels',
} as const;

export type AudienceMode = typeof AUDIENCE_MODE[keyof typeof AUDIENCE_MODE];

// Topic Status Enum
export const TOPIC_STATUS = {
  COLLECTING: 'collecting',
  IN_REVIEW: 'in_review',
  ACTION_DECIDED: 'action_decided',
  ACTIONED: 'actioned',
  ARCHIVED: 'archived'
} as const;

export type TopicStatus = typeof TOPIC_STATUS[keyof typeof TOPIC_STATUS];

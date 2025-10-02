# Teammato - Anonymous Feedback Platform

## Project Overview

Teammato is an enterprise-grade Slack-first anonymous feedback SaaS with privacy-first architecture including k-anonymity, per-org encryption, and multi-tenant isolation.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + PostgreSQL (Neon) with Drizzle ORM
- **Billing**: Stripe
- **Integration**: Slack (OAuth v2, Slash Commands, Events API)
- **Session Management**: express-session with MemoryStore (dev) / Redis (prod)

## Project Structure

```
/client/src
  /pages/public         # Landing, Pricing, FAQ, Contact, Privacy, Trust, Terms
  /pages/admin          # GetStarted, SlackSettings, BillingSettings, Analytics, Export, Retention
  /pages                # PostInstall, NoOrg, Auth
  /lib                  # appEnv.ts, slackInstall.ts
  /components           # Reusable UI components

/supabase
  /functions            # 17 Edge Functions
    /_shared            # logger.ts (structured logging)
    /slack              # command, oauth, events, slack_digest_now
    /                   # submit_feedback, submit_comment, moderation_actions
                        # digest_cron, analytics_backfill, analytics_daily_cron
                        # billing_portal, stripe_webhook
                        # export_admin, retention_purge_cron, org_delete_request
                        # seed_topics, health_config
  schema.sql            # Complete database schema with RLS and k-anonymity views
```

## Environment Variables

### Server-only (Edge Functions):
- APP_ENV
- SLACK_CLIENT_ID / SLACK_CLIENT_ID_TEST
- SLACK_CLIENT_SECRET / SLACK_CLIENT_SECRET_TEST
- SLACK_SIGNING_SECRET / SLACK_SIGNING_SECRET_TEST
- SLACK_REDIRECT_URI / SLACK_REDIRECT_URI_TEST
- STRIPE_SECRET_KEY / STRIPE_SECRET_KEY_TEST
- STRIPE_WEBHOOK_SECRET / STRIPE_WEBHOOK_SECRET_TEST
- STRIPE_PRICE_ID_PRO / STRIPE_PRICE_ID_PRO_TEST
- STRIPE_PRICE_ID_PRO_ANNUAL / STRIPE_PRICE_ID_PRO_ANNUAL_TEST

### Public (Frontend via Vite):
- VITE_PUBLIC_APP_ENV
- VITE_PUBLIC_SLACK_CLIENT_ID / VITE_PUBLIC_SLACK_CLIENT_ID_TEST
- VITE_PUBLIC_SLACK_REDIRECT_URI / VITE_PUBLIC_SLACK_REDIRECT_URI_TEST

## Database Schema

### Tables (Currently Implemented):
- `orgs` - Organizations with settings (k_anonymity, retention, etc.)
- `users` - Users with org binding and roles (owner, admin, moderator, viewer)
- `topics` - **Time-boxed feedback campaigns** with description, expiresAt, windowDays, status (collecting/in_review/action_decided/actioned), ownerId, actionNotes for transparent action loops
- `threads` - Anonymous feedback posts with moderation fields (moderationStatus, moderationNotes, moderatedBy, moderatedAt)
- `items` - **SBI feedback items** with behavior, impact, situationCoarse, submitterHash, createdAtDay, moderation fields
- `comments` - Comments on feedback threads
- `slack_teams` - Slack workspace mappings with access tokens
- `moderation_audit` - Immutable audit trail for all moderation actions
- `slack_settings` - Per-org Slack configuration (digest channel, enabled status)
- `topic_suggestions` - User-suggested topics with orgId, suggestedBy, title, status (pending/approved/rejected)

### Planned Tables:
- `reactions` - Deduplicated reactions by actor_hash
- `analytics_daily` - Aggregated metrics

### Security:
- Row-Level Security (RLS) on all tables using `current_org_id()` from JWT
- K-anonymity views (`v_thread_participants`, `v_threads`, `v_comments`)
- Content encrypted with per-org AEAD keys
- Pseudonymous handles (no real names in content tables)
- No IP/UA logging in content

## Authentication & Onboarding Flow

1. User clicks "Sign In with Slack" on homepage (/)
2. Frontend redirects to `/api/slack/install`
3. Backend redirects to Slack OAuth with CSRF protection
4. User authorizes in Slack workspace
5. Slack OAuth callback → `/api/slack/oauth`
6. Backend auto-provisions: Create org → slack_teams → user as owner
7. Backend creates session (userId, orgId, role)
8. Redirect to `/admin/get-started`
9. User configures topics, invites admins, sets up moderation

## Key Features

- **Privacy-First**: K-anonymity, encryption, pseudonyms, no PII
- **Multi-Tenant**: Complete isolation with RLS
- **Slack Integration**: OAuth, slash commands, events, digests
- **Moderation**: Flag queue, bulk actions, audit trails
- **Analytics**: Privacy-preserving aggregates, CSV/PDF export
- **Compliance**: GDPR/CCPA ready, retention policies, legal hold

## Implementation Status

### ✅ Completed (Phase 1 MVP)
- Admin authentication system with session-based auth
- Slack OAuth flow (install, callback, auto-provisioning)
- Role-based access control (owner, admin, viewer)
- Admin Dashboard with real-time org stats
- Topic Management with CRUD operations
  - **Topic description field** (optional text to help employees understand topic purpose)
  - **Duration selector** with preset options: 7, 14, 21, 30, 60, 90 days
  - Topic cards display: description (line-clamped), duration, k-threshold
  - Slack channel mapping (slackChannelId)
  - Per-topic k-anonymity thresholds (kThreshold)
  - Real-time duplicate validation
- Feedback Management page with moderation tools
- **Analytics Page** (Oct 2025)
  - Real-time metrics: Total Threads, Total Feedback, Unique Participants, Ready to View
  - Topic activity breakdown with visualization
  - Weekly activity trends (7-day chart)
  - Privacy-preserving aggregates (no PII exposed)
  - Loading states and empty state handling
  - Backend APIs: `/api/analytics/topic-activity`, `/api/analytics/weekly-trend`, `/api/analytics/participant-count`
- **Slack Settings Page** (Oct 2025)
  - Workspace connection status display
  - Daily digest configuration (channel ID, enabled/disabled toggle)
  - Settings persistence with validation
  - Backend APIs: `GET/POST /api/slack-settings` with Zod validation
- **Slack Slash Command & SBI Modal** (Oct 2025) ✅ COMPLETE
  - `/teammato <slug> [optional text]` - Opens Block Kit modal instead of direct text submission
  - **Context-aware modal header** displays:
    - Topic name (bold)
    - Creator name (fetched from Slack user info, fallback to email)
    - Topic description (if provided)
    - Status emoji + text + duration + expiry countdown
  - HMAC-SHA256 signature verification with replay attack prevention (5-minute window)
  - Modal prefill: Text after slug populates Behavior field automatically
  - **Topic-specific modals**: No topic suggestion option when targeting a specific topic (prevents topic hijacking)
  - Block Kit modal with conditional paths:
    1. **SBI Feedback Submission** (when topic specified): Situation (optional), Behavior (required), Impact (required)
    2. **Topic Suggestion** (future: when no topic specified): Checkbox reveals title input, skips feedback validation
  - Situation coarsening: Extracts temporal markers (week/month/quarter), strips specifics before storage
  - PII/@mention blocking: Filters all feedback fields to protect k-anonymity
  - Submitter hash: Daily-rotating hash for deduplication and rate-limiting (no identifying info stored)
  - Topic routing by slug with org-scoped lookup
  - K-anonymity enforcement: find-or-create active collecting thread per topic
  - Race condition handling: DB unique constraint + application-level retry on conflict
  - Duplicate submission protection (one feedback per user per thread)
  - Atomic participant count tracking with status transitions
  - Inline validation errors: Slack nested format `{block_id: {action_id: message}}`
  - Contribution receipts: DM users with hash + anti-retaliation policy link after submission
  - Backend APIs: `POST /api/slack/command`, `POST /api/slack/modal`
  - Storage methods: createTopicSuggestion, getTopicSuggestions, updateTopicSuggestionStatus
- **Moderation Workflow** (Oct 2025) ✅ COMPLETE
  - Database schema: moderationStatus, moderationNotes, moderatedBy, moderatedAt fields on threads and items
  - Moderation audit table: Immutable audit trail with action, previous/new status, reason, admin user, timestamp
  - Thread-level actions: Approve, Flag, Hide, Archive with reason capture
  - Item-level actions: Approve, Flag, Hide with reason capture
  - Admin notes: Internal comments on threads (not visible to employees)
  - Audit trail UI: Complete moderation history viewer with timestamps and reasons
  - Role-based access: Owner, admin, and moderator roles with org scoping for security
  - Zod validation: Enum validation for moderation statuses (6 thread statuses, 5 item statuses)
  - Backend APIs: `POST /api/moderation/threads/:id`, `POST /api/moderation/items/:id`, `GET /api/moderation/audit/:targetType/:targetId`
  - Storage methods: getFeedbackItem with org scoping, updateThreadModeration, updateItemModeration, addModerationAudit
  - React Query optimization: Proper query key structure with full URL paths for automatic cache invalidation
  - Production-ready: All critical bugs fixed, RBAC aligned, no LSP errors
- **Time-Boxed Topics & Action Loop** (Oct 2025) ✅ COMPLETE Phase 1 & 2
  - Topic lifecycle: expiresAt, windowDays, status (collecting → in_review → action_decided → actioned)
  - PII/@mention blocking filter to protect k-anonymity (`server/utils/contentFilter.ts`)
  - Contribution receipts: DM users with hash + anti-retaliation policy link after submission
  - `/teammato list` command: Shows active topics with expiry dates and status icons
  - Topic countdown display in Slack responses when submitting feedback
  - Auto-lock cron job: Hourly task locks expired topics, sends owner reminders (`server/cron/topicExpiry.ts`)
  - Auto-post "You said / We did": Posts action notes to Slack when topic marked as actioned
  - Status transition validation: Server-side enforcement of allowed state changes
  - K-anonymity enforcement: Blocks actioning topics until participant threshold met
  - Backend APIs: Enhanced `PATCH /api/topics/:id` with status, actionNotes, participant count validation
- **General Feedback with Rolling Instances** (Oct 2025) ✅ COMPLETE
  - Schema: parentTopicId, isParent, instanceIdentifier, windowStart, windowEnd fields support parent/instance relationships
  - Auto-routing: `/teammato <free text>` routes to current General feedback instance
  - Parent topic creation: System auto-creates parent topic (isParent=true, slug="general-feedback") on first use
  - Instance management: getCurrentGeneralFeedbackInstance() gets or creates current weekly instance
  - Week-based instances: instanceIdentifier format "YYYY-Www" (e.g., "2025-W41") using ISO week numbers
  - Instance rotation cron: Hourly job checks for expired instances, creates next weekly instance
  - Modal prefill: Free text from command prefills Behavior field in SBI modal
  - Admin UI filtering: TopicManagement.tsx filters out parent topics (isParent=true), shows instance badges
  - K-anonymity preservation: Each instance has own kThreshold (typically 5), maintains privacy across time windows
  - Storage methods: getOrCreateParentTopic, getCurrentGeneralFeedbackInstance, createGeneralFeedbackInstance, getExpiredInstances
  - Week calculation helpers: getISOWeekNumber, formatWeekIdentifier in server/cron/topicExpiry.ts
- **Topic Suggestions Admin UI** (Oct 2025) ✅ COMPLETE
  - Admin page at `/admin/topic-suggestions` for democratic feedback workflow
  - Approve/reject UI for user-suggested topics with toast feedback
  - Auto-creates topics from approved suggestions with suggested title
  - Separate sections: Pending Suggestions and Reviewed Suggestions
  - Backend APIs: `GET /api/topic-suggestions`, `PATCH /api/topic-suggestions/:id`
  - Storage methods: getTopicSuggestions, updateTopicSuggestionStatus
  - Navigation integration with Lightbulb icon
- **Topic Management Reorganization** (Oct 2025) ✅ COMPLETE
  - Categorized topics into three sections: Created Topics, Weekly Topics, Archived Topics
  - "Created Topics" shows custom feedback campaigns (not instances, not parent)
  - "Weekly Topics" displays rolling General Feedback instances with instance badges
  - "Archived Topics" with pagination (6 per page) for archived/actioned topics
  - Added 'archived' status to topic lifecycle with validation and transition rules
  - Backend API: `GET /api/topics/categorized` returns organized topic categories
  - Storage method: getCategorizedTopics() for efficient category retrieval
  - Prevents UI clutter as orgs scale with many topics and instances
- Security hardening (session regeneration, CSRF protection, org scoping)
- Multi-tenant isolation with org-scoped queries

### 🚧 In Progress / Next Steps
- **Web Portal** - Public /topics page for browsing available feedback campaigns
- Per-org encryption for feedback content
- CSV/PDF export functionality for Analytics
- Digest notifications to Slack channels (settings page complete, cron job pending)
- User invitation and management
- Billing integration with Stripe
- Public landing pages and marketing content

### 📝 Configuration Required (External)
- **Slack App Settings**: Enable "Interactivity & Shortcuts" and set Request URL to `https://[YOUR-DOMAIN]/api/slack/modal` for modal submissions to work

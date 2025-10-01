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
- `topics` - Feedback taxonomy with slackChannelId and kThreshold for k-anonymity
- `threads` - Anonymous feedback posts with moderation fields (moderationStatus, moderationNotes, moderatedBy, moderatedAt)
- `items` - Individual feedback items with moderation fields (moderationStatus, moderatedBy, moderatedAt)
- `comments` - Comments on feedback threads
- `slack_teams` - Slack workspace mappings with access tokens
- `moderation_audit` - Immutable audit trail for all moderation actions

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
- **Slack Slash Command Handler** (Oct 2025)
  - `/teammato topic-slug Feedback content` command processing
  - HMAC-SHA256 signature verification with replay attack prevention (5-minute window)
  - Topic routing by slug with org-scoped lookup
  - K-anonymity enforcement: find-or-create active collecting thread per topic
  - Race condition handling: DB unique constraint + application-level retry on conflict
  - Duplicate submission protection (one feedback per user per thread)
  - Atomic participant count tracking with status transitions
  - User-friendly ephemeral responses with progress indicators
  - Backend API: `POST /api/slack/command` with raw body parsing for signature verification
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
- Security hardening (session regeneration, CSRF protection, org scoping)
- Multi-tenant isolation with org-scoped queries

### 🚧 In Progress / Next Steps
- Per-org encryption for feedback content
- CSV/PDF export functionality for Analytics
- Digest notifications to Slack channels (settings page complete, cron job pending)
- User invitation and management
- Billing integration with Stripe
- Public landing pages and marketing content

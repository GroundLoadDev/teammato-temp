# Teammato - Anonymous Feedback Platform

### Overview
Teammato is an enterprise-grade, Slack-first SaaS platform designed for anonymous feedback within organizations. It prioritizes privacy through a k-anonymity architecture, per-organization encryption, and multi-tenant isolation. The platform aims to facilitate transparent feedback loops, enhance employee engagement, and provide actionable insights while safeguarding user anonymity. Key capabilities include time-boxed feedback campaigns, robust moderation tools, privacy-preserving analytics, and seamless Slack integration. The project includes a marketing website rebuild focused on "Show Don't Tell" with interactive elements, and a multi-phase redesign of the Admin Dashboard for enhanced billing, compliance, system health, and audience configuration features. A significant new feature is the integration of a CPU-based ML pipeline for automatic theme generation from feedback.

### User Preferences
I prefer iterative development and clear, concise explanations. Ask before making major changes to the architecture or core functionalities. Ensure all new features align with the privacy-first principle.

### Recent Changes (October 2025)

#### Unified Admin Dashboard (Completed - October 7, 2025)
- **Single-Page Architecture**: Implemented unified admin dashboard with tabbed interface (Overview, Topics, Suggestions, Feedback, Themes, Analytics, Settings) replacing scattered individual pages
- **Global Filter System**: Created comprehensive filter bar with channel, time range (Last 7/30/90 days, All time), and status filters that apply across all tabs
- **K-Safety Enforcement**: Integrated k-safety banner component that displays when current filters don't meet k-anonymity thresholds, preventing inadvertent data exposure
- **Topics Tab Structure**: Built hierarchical tab system with sub-tabs (Active, Upcoming, Expired, Archived) for organized topic lifecycle management
- **Feedback Tab**: Displays only k-safe threads (participantCount >= kThreshold) with visual indicators and counts
- **Performance Indexes**: Added 8 database indexes for common admin queries:
  - `idx_topics_org_status_created` (orgId, status, createdAt DESC)
  - `idx_feedback_threads_topic_created` (topicId, createdAt DESC)
  - `idx_feedback_threads_org_status` (orgId, status)
  - `idx_feedback_items_thread_created` (threadId, createdAt DESC)
  - `idx_topic_suggestions_org_status` (orgId, status)
  - `idx_moderation_audit_target` (targetType, targetId, orgId)
  - `idx_state_transition_target` (targetType, targetId, orgId)
  - `idx_state_transition_created` (createdAt DESC)
- **Schema Enhancements**:
  - Added `workspace_id` (nullable) to topics, feedbackThreads, feedbackItems, themes for future multi-workspace support
  - Created `state_transition_audit` table to track topic lifecycle changes with fields: targetType, targetId, fromState, toState, actorUserId, reason, metadata
- **State Transition Logging**: Implemented automatic logging for:
  - Manual topic status updates via admin dashboard (with user attribution)
  - Auto-lock operations by cron jobs (system-initiated with descriptive reasons)
  - Both regular topics and time-boxed instances
- **Navigation Updates**: Enhanced AppSidebar with direct links to admin sections (Dashboard, Feedback, Topics, Suggestions, Analytics, Themes, Users, Slack, Billing, Audience, Export, Retention)

#### Topic Suggestion Anti-Spam Guardrails (Completed - October 7, 2025)
- **Slash Command Fix**: Fixed `/teammato suggest TopicName` which was incorrectly opening general feedback modal instead of creating topic suggestion
- **Per-User Cooldown**: 24-hour rate limit between suggestions per user with clear "try again in Xh Ym" messaging
- **Similarity Detection**: Automatic duplicate detection using normalized titles (Levenshtein distance < 3) with auto-merge functionality
- **Auto-Merge on Duplicate**: When similar suggestion exists, adds user support to existing suggestion instead of creating duplicate
- **Org-Wide Queue Cap**: Maximum 50 pending suggestions per organization to prevent queue flooding
- **Support Tracking**: New `topic_suggestion_supports` table tracks users who support duplicate suggestions
- **Database Schema**: Added `normalized_title`, `duplicate_of_id`, `status_reason` to suggestions; `last_suggestion_at` to users
- **Identity Disclosure**: All Slack responses explicitly state "Your name is attached to topic suggestions (feedback remains anonymous)"
- **Admin UI Enhancements**: Supporter count displayed on suggestion cards using optimized LEFT JOIN aggregation (no N+1 queries)
- **Performance**: Single-query supporter count retrieval via `storage.getTopicSuggestions()` with GROUP BY aggregation

#### Stripe Checkout Bug Fix (Completed - October 7, 2025)
- **Critical Production Bug**: Fixed "Skip trial" checkout flow that was completely broken for all customers
- **Root Cause**: System was sending `trial_end: 'now'` (string) to Stripe instead of Unix timestamp integer, causing Stripe to reject requests with "Invalid integer: now" error
- **User Impact**: Customers saw misleading "Session expired" error when attempting to skip trial and subscribe immediately
- **Fix**: Changed lines 606 and 620 in `server/routes.ts` to use `Math.floor(Date.now() / 1000)` instead of string `'now'`
- **Validation**: Removed unsafe `as any` type assertion - now properly typed as `number | undefined` matching Stripe's API requirements
- **Scope**: Affects all "Skip trial" flows and previously-trialed organizations attempting to re-subscribe

#### Anti-Gamification System (Completed)
- **Schema Enforcement**: Added NOT NULL `topicId` to `feedbackItems` with unique constraint on (orgId, topicId, slackUserId) to prevent duplicate submissions per topic
- **Topic Creator Restriction**: Implemented validation logic to block topic creators from submitting feedback to their own topics (prevents identity revelation)
- **Duplicate Submission Prevention**: Enforces one submission per user per topic across all thread instances (prevents gaming k-anonymity threshold)
- **Database Integrity**: Changed ON DELETE behavior from SET NULL to CASCADE to eliminate NULL-bypass vulnerability in unique constraints
- **Storage Methods**: Added `hasUserSubmittedToTopic()` and `isUserTopicCreator()` methods for validation checks
- **User Feedback**: Clear error messages explain why submissions are blocked (creator restriction or duplicate submission)

#### KSAFE-280: K-Safe Export Implementation (Completed)
- **Database Views**: Created `v_threads` and `v_comments` views that calculate `renderState` field based on `participantCount` vs k-threshold
- **Storage Methods**: Implemented k-safe storage methods (`getKSafeThreads()`, `getKSafeComments()`, `getKSafeCommentsByThread()`) that enforce k-anonymity at database query level
- **Export Hardening**: Updated all three export routes (threads, comments, audit logs) to use k-safe methods with belt-and-suspenders protection (view-based + filter-based)
- **Content Updates**: Enhanced Trust & Security, FAQ, Compliance, and Features pages to reflect robust database-level k-safe export architecture
- **How It Works Page Redesign**: Expanded human/tech toggle from hero section to ALL sections (StorySteps, FlowRail, PrivacyPoster, UnderTheHood, NotWhatWeDo) with comprehensive technical details about k-safe exports in both modes

#### Billing State Machine (Completed - October 2025)
- **8-State Architecture**: Implemented production-ready billing state machine with complete persistence:
  - `installed_no_checkout`: Initial state after OAuth (no trial started yet)
  - `trialing`: Active 14-day trial after Stripe Checkout completion
  - `active`: Paid subscription active
  - `trial_expired_unpaid`: Trial ended, requires payment
  - `past_due`: Payment failed, grace period from Stripe
  - `over_cap_grace`: 100-110% seat usage, 7-day grace period
  - `over_cap_blocked`: >110% usage OR grace expired, requires upgrade
  - `canceled`: Subscription canceled by user
- **State Persistence**: All transitions durably persisted to database via `checkAndTransitionBillingState()` function
- **Priority Logic**: Trial expiration checked FIRST (prevents blocked orgs from reverting to trialing when usage drops)
- **Sticky Blocking**: `over_cap_blocked` state requires subscription to clear (prevents payment bypass)
- **Grace Period Security**: 7-day timestamp persisted on every >100% check (prevents restart exploits)
- **Smart Recovery**: When usage <100%, restores correct state based on subscription and trial validity
- **Read-Only Access**: Blocked/expired states can view admin pages but cannot perform write operations
- **OAuth-to-Checkout Flow**: Mandatory Stripe Checkout at installation with plan selection
- **Trial Exhaustion Detection**: Previously trialed orgs skip trial and charge immediately
- **Auth-Aware Routing**: Logged-in users bypass OAuth and route directly to checkout for upgrades
- **Deep Link System**: Billing page handles action parameters (e.g., ?action=start_trial&price=cap_250_m)
- **Slack Command Gating**: `/teammato` blocked in non-active states with contextual error messages and deep links

### System Architecture

#### UI/UX Decisions
The frontend uses React, TypeScript, Vite, and Tailwind CSS, focusing on a clean, modern administrative interface and responsive public pages (landing, pricing, documentation). Admin dashboards provide real-time statistics, topic management, feedback moderation, and user/billing settings. The design incorporates consistent emerald-600 accents, rounded cards, responsive grids, and accessibility features.

#### Technical Implementations
- **Frontend**: React + TypeScript + Vite + Tailwind CSS.
- **Backend**: Express.js with PostgreSQL (Neon) via Drizzle ORM.
- **Authentication & Authorization**: Session-based authentication, Slack OAuth v2, and role-based access control (Owner, Admin, Moderator, Viewer) with Row-Level Security (RLS) for multi-tenant data isolation.
- **Privacy Architecture**: K-anonymity (k=5 threshold), application-layer encryption (XChaCha20-Poly1305 AEAD with per-org DEKs), pseudonymity, PII/`@mention` content filtering, and daily-rotating submitter hashes.
- **Slack Integration**: Utilizes Slack's OAuth v2, Slash Commands, and Events API for feedback submission (SBI model via modals), daily digests, and invitation workflows.
- **Moderation Workflow**: Flag queue, bulk actions, and immutable audit trail for thread and item-level moderation.
- **Topic Management**: Time-boxed feedback campaigns with a defined lifecycle, auto-lock cron jobs, "You said / We did" action loops, and user-suggested topics. Anti-gamification safeguards prevent topic creators from self-submitting and enforce one submission per user per topic (via unique constraint on orgId, topicId, slackUserId) to protect k-anonymity integrity.
- **Analytics & Export**: Privacy-preserving aggregated metrics with k-safe export capabilities. Database views (v_threads, v_comments) calculate renderState based on k-anonymity thresholds. Export endpoints (threads, comments, audit) enforce k-anonymity by only exporting data with renderState='visible' (participantCount >= k threshold).
- **User Management**: Slack-native invitation system, role management, and user removal.
- **Security**: Session regeneration, CSRF protection, and robust org-scoping.
- **Theming System**: CPU-based ML pipeline for zero-cost local processing of feedback embeddings (@xenova/transformers on ONNX runtime) using agglomerative hierarchical clustering, c-TF-IDF keywording, and template-based summarization. Access controlled by `enable_theming` flag and k-anonymity thresholds.
- **Billing & Subscription**: Comprehensive Stripe integration with 7 pricing tiers (250 to 25k seats), monthly/annual billing options, seat-based capacity management linked to Audience settings, contextual banners for trial/grace/over-cap states, invoice history with download links, and deep integration with Stripe Checkout and Customer Portal. Database tracks customer IDs, subscription status, billing periods, seat caps, trial/cancel/grace timestamps, and billing email.
- **Seat-Cap Notifications**: Automated Slack DM and email notifications for owner/admin users at capacity thresholds: warning at ≥90%, grace period start at >100%, and blocking at >110% or grace expiry. Includes 24-hour cooldown to prevent spam and tracks last notification timestamps per threshold.

#### System Design Choices
- **Multi-tenancy**: Achieved through RLS using `current_org_id()` from JWT claims and per-org encryption.
- **Event-Driven**: Centralized Slack Events API integration.
- **Scheduled Tasks**: Cron jobs for topic lifecycle management, new feedback instances, and reminders.
- **Database Schema**: Designed for privacy and scalability, including tables for `orgs`, `users`, `topics`, `threads`, `items`, `comments`, `slack_teams`, `moderation_audit`, `slack_settings`, `topic_suggestions`, `org_keys`, `post_embeddings`, `themes`, and `theme_posts`.
- **Environment Management**: Separation of server-only and public environment variables.

### External Dependencies

- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Encryption**: libsodium-wrappers (XChaCha20-Poly1305 AEAD)
- **Machine Learning**: @xenova/transformers (ONNX runtime)
- **Billing**: Stripe
- **Integration Platform**: Slack (OAuth v2, Slash Commands, Events API)
- **Email**: Resend (transactional emails for seat-cap notifications)
- **Session Store**: Redis (production)
- **Serverless Functions**: Supabase Edge Functions
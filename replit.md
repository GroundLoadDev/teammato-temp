# Teammato - Anonymous Feedback Platform

### Overview
Teammato is an enterprise-grade, Slack-first SaaS platform for anonymous feedback within organizations. It ensures privacy through k-anonymity, per-organization encryption, and multi-tenant isolation. The platform aims to foster transparent feedback, boost employee engagement, and deliver actionable insights while protecting user anonymity. Key features include time-boxed feedback campaigns, robust moderation, privacy-preserving analytics, and seamless Slack integration. The project includes a marketing website rebuild with interactive elements, a multi-phase Admin Dashboard redesign (billing, compliance, system health, audience config), and a CPU-based ML pipeline for automatic theme generation from feedback.

### User Preferences
I prefer iterative development and clear, concise explanations. Ask before making major changes to the architecture or core functionalities. Ensure all new features align with the privacy-first principle.

### Recent Changes (October 11, 2025)

#### Billing Plan Selector Redesign
- **Compact Table Layout**: Replaced grid cards with streamlined table showing all plans in single view
- **Removed Clutter**: Eliminated "popular" badge, special borders, and feature lists (all plans have identical features)
- **Visual Plan Indicators**: 
  - Active plan row highlighted with left border (border-l-4 border-l-primary) and background (bg-muted/50)
  - "Current" badge displays for active (non-trial) subscriptions
  - "Trial" badge displays when user is on trial (automatically removed when trial ends)
- **Contextual Actions**: Button text adapts based on seat comparison:
  - "Current Plan" (disabled) for active plan
  - "Subscribe" for trial users on their trial tier
  - "Upgrade" for higher seat tiers
  - "Downgrade" for lower seat tiers
  - "Select Plan" as fallback
- **Preserved Functionality**: All trial logic, checkout flow, RBAC controls, and billing period toggle work identically

#### Subscription Cancellation with RBAC
- **Cancellation Section**: Added "Subscription Cancellation" section in Billing page with role-based controls:
  - **Owners**: See active "Cancel Subscription" button that opens Stripe Customer Portal
  - **Admins**: See disabled button with lock icon and tooltip explaining only owners can cancel
  - **Moderators/Viewers**: Section completely hidden (no access)
- **Post-Cancellation UI**: When subscription is cancelled:
  - Cancellation section hidden, replaced with "Reactivation Section"
  - Shows cancellation end date if available
  - "Choose a Plan" button scrolls to pricing section for easy reactivation
- **Integration**: Leverages existing Stripe Customer Portal and webhook handling for cancellation
- **All interactive elements**: Proper data-testid attributes for testing

#### Billing Trial Flow Fixes
- **New Schedule Plan Endpoint**: Added `/api/billing/schedule-change` endpoint for trial users to select a plan without ending trial early
- **Fixed Plan Selection Logic**: Updated `handleConfirmUpgrade` to correctly route based on trial state and "Skip trial" checkbox:
  - Trial + "Skip trial" checked → Stripe Checkout (ends trial, charges immediately)
  - Trial + "Skip trial" unchecked → Schedule plan change (stays on trial, plan takes effect after trial)
  - Active subscription → Update with proration (existing behavior)
  - No subscription → Stripe Checkout (new subscriber)
- **Contextual Success Messages**: Different toast messages for trial plan selection vs active subscription changes
- **Dynamic Button Text**: Button text updates based on action ("Continue to Checkout", "Confirm Plan Selection", or "Confirm Change")
- **Banner Refresh Fix**: Added query cache invalidation to ensure billing banner updates immediately without page refresh
- **Reset State**: `chargeToday` checkbox resets when modal opens to avoid stale state

#### Simulator Integration & Navigation
- **Footer Navigation Update**: Replaced "Docs" link with "Anonymous Simulator" linking to /simulator in Resources section
- **Simulator Page Layout**: Added Header and Footer components to Simulator page for consistent site navigation (removed custom footer)
- **Cross-Page CTAs**: Integrated simulator mentions across marketing pages:
  - Trust page: CTA card after K-anonymity section with "Try the Simulator" button
  - How It Works page: Inline link in Privacy Poster section ("try our interactive simulator")
  - Features page: Inline link in Safety Row section ("Try our interactive simulator")
- All simulator links tested and verified working across navigation flows

#### Privacy & Anti-Gamification Enhancements (October 8, 2025)
- **K-Threshold Enforcement**: K-threshold now enforces a minimum of 5 and cannot be edited after topic creation to prevent anonymity bypass attacks
- **Collection Window Lock**: windowDays field is non-editable after topic creation to prevent gaming feedback timing
- **Tooltips Added**: Explanatory tooltips on locked fields explain privacy protection rationale

#### Topic Suggestion Tracking (October 8, 2025)
- **Schema Enhancement**: Added `suggestionId` field to topics table to track which topics originated from user suggestions
- **Display Updates**: Topic cards now show "Suggested by: {email}" and "Approved by: {email}" for suggested topics
- **Visual Badge**: "Suggested" badge displays on topic cards that originated from suggestions

#### K-Threshold Progress Display (October 8, 2025)
- **Color-Coded Progress**: Visual indicator shows participant count vs k-threshold with color coding:
  - Red: <50% of threshold
  - Yellow: ≥50% and <100% of threshold
  - Green: ≥100% of threshold (ready for release)
- **Days Remaining**: Topic cards display countdown of days remaining in collection window

#### Slash Command Improvements (October 8, 2025)
- **Case-Insensitive Matching**: Topic slug matching in Slack commands now case-insensitive (prevents lookup failures)
- **Enhanced Help**: Updated `/teammato help` command with comprehensive instructions including privacy tips, suggest command, and case-insensitivity examples

### System Architecture

#### UI/UX Decisions
The frontend utilizes React, TypeScript, Vite, and Tailwind CSS for a modern administrative interface and responsive public pages. Admin dashboards offer real-time statistics, topic and feedback management, and user/billing settings. Design principles include consistent emerald-600 accents, rounded cards, responsive grids, and accessibility.

#### Technical Implementations
- **Frontend**: React + TypeScript + Vite + Tailwind CSS.
- **Backend**: Express.js with PostgreSQL (Neon) via Drizzle ORM.
- **Authentication & Authorization**: Session-based authentication, Slack OAuth v2, and role-based access control (Owner, Admin, Moderator, Viewer) with Row-Level Security (RLS) for multi-tenancy.
- **Privacy Architecture**: K-anonymity (k=5 minimum enforced), application-layer encryption (XChaCha20-Poly1305 AEAD with per-org DEKs), pseudonymity, PII/`@mention` filtering, and daily-rotating submitter hashes. K-threshold and collection window are locked after topic creation to prevent anonymity gaming.
- **Slack Integration**: Slack OAuth v2, Slash Commands (case-insensitive topic slug matching), and Events API for feedback submission (modals), daily digests, and invitations.
- **Moderation Workflow**: Flag queue, bulk actions, and immutable audit trails for moderation.
- **Topic Management**: Time-boxed feedback campaigns, auto-lock cron jobs, "You said / We did" loops, and user-suggested topics with tracking (suggestionId field). Anti-gamification safeguards prevent topic creators from submitting feedback to their own topics and enforce one submission per user per topic. Topic cards display k-threshold progress with color coding (red <50%, yellow ≥50%, green ≥100%) and days remaining.
- **Analytics & Export**: Privacy-preserving aggregated metrics with k-safe export capabilities using database views (`v_threads`, `v_comments`) that enforce k-anonymity thresholds.
- **User Management**: Slack-native invitation system, role management, and user removal.
- **Security**: Session regeneration, CSRF protection, and robust org-scoping.
- **Theming System**: CPU-based ML pipeline for local processing of feedback embeddings (@xenova/transformers on ONNX runtime) using agglomerative hierarchical clustering, c-TF-IDF keywording, and template-based summarization.
- **Billing & Subscription**: Comprehensive Stripe integration with 7 pricing tiers, monthly/annual options, seat-based capacity management, contextual banners, invoice history, and deep integration with Stripe Checkout and Customer Portal. An 8-state billing state machine (installed_no_checkout, trialing, active, trial_expired_unpaid, past_due, over_cap_grace, over_cap_blocked, canceled) with persistence is implemented.
- **Seat-Cap Notifications**: Automated Slack DM and email notifications for owner/admin users at capacity thresholds (≥90%, >100%, >110% or grace expiry).

#### System Design Choices
- **Multi-tenancy**: Achieved through RLS using `current_org_id()` and per-org encryption.
- **Event-Driven**: Centralized Slack Events API integration.
- **Scheduled Tasks**: Cron jobs for topic lifecycle, new feedback instances, and reminders.
- **Database Schema**: Designed for privacy and scalability, including tables for `orgs`, `users`, `topics`, `threads`, `items`, `comments`, `slack_teams`, `moderation_audit`, `slack_settings`, `topic_suggestions`, `org_keys`, `post_embeddings`, `themes`, and `theme_posts`.

### External Dependencies

- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Encryption**: libsodium-wrappers (XChaCha20-Poly1305 AEAD)
- **Machine Learning**: @xenova/transformers (ONNX runtime)
- **Billing**: Stripe
- **Integration Platform**: Slack (OAuth v2, Slash Commands, Events API)
- **Email**: Resend
- **Session Store**: Redis
- **Serverless Functions**: Supabase Edge Functions
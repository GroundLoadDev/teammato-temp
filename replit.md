# Teammato - Anonymous Feedback Platform

### Overview
Teammato is an enterprise-grade, Slack-first SaaS platform designed for anonymous feedback within organizations. It prioritizes privacy through a k-anonymity architecture, per-organization encryption, and multi-tenant isolation. The platform aims to facilitate transparent feedback loops, enhance employee engagement, and provide actionable insights while safeguarding user anonymity. Key capabilities include time-boxed feedback campaigns, robust moderation tools, privacy-preserving analytics, and seamless Slack integration.

### Recent Changes (October 2025)
**Marketing Website Rebuild - "Show Don't Tell" Philosophy**
- **Landing Page** (`/`): Rebuilt with interactive SlackPreviewAnimated component showing real feedback examples with typing/deleting animation cycling through 5 scenarios
- **Pricing Page** (`/pricing`): Surgical fixes including responsive 2/3/4-column grid (replaced horizontal scroller), removed pricing table for cleaner layout, added reassurance text with collapsible disclosure
- **Features Page** (`/features`): Comprehensive interactive showcase with 6 sections - tabbed Product Showcase, Safety Row with 3 cards, Admin Strip demonstrating controls, all following emerald-600 branding
- **FAQ Page** (`/faq`): Full rebuild with instant client-side search, 11 topic filter chips (getting-started, product, privacy, security, exports, roles, billing, retention, grid, threshold, troubleshooting), deep link support (`/faq?id=<id>`), 20 Q&As grouped by topic, large hit targets for accessibility
- **Trust & Security Page** (`/trust`): Enterprise-grade security overview with at-a-glance badges, 4 security feature cards (encryption, isolation, PII, export safety), 6 security controls grid, data flow diagram with 4 steps, k-anonymity explainer with visual example, compliance accordion (SOC 2, GDPR/CCPA, incident response, business continuity), downloadable DPA PDF with transparency-first messaging
- **Contact Page** (`/contact`): Async-first contact experience with self-serve deflection (6 resource cards before form), FAQ search integration, contextual topic tips, direct email shortcuts (security@, privacy@, contact@), minimal form with topic dropdown, backend validation, placeholder for Cloudflare Recaptcha integration
- **Design System**: Consistent emerald-600 accents, rounded-2xl cards, responsive grids, radial gradient heroes, accessibility features (prefers-reduced-motion support), all pages use React + Tailwind only (zero external dependencies for marketing)

**Admin Dashboard Redesign - Phases 1-3 Complete (October 2025)**

*Phase 1: Quick Wins*
- **Billing Integration**: Top ribbon displays plan status (Trial/Pro/Scale), live usage meter (members/cap), and upgrade CTA. API endpoints for `/api/billing/usage` with Slack workspace member counting and `/api/billing/subscription` with seat cap logic.
- **Post-Install Checklist**: Stateful 7-step checklist with live status (Connected, In Progress, Not Yet) and one-click actions.
- **Enhanced Metrics**: Added "New This Week" (last 7 days) and "Active Participants" (k-safe unique contributors). All 6 metric cards use responsive 3-column grid.
- **Digest Controls**: Status card with channel, schedule, "Send sample now" action via `/api/slack/digest-preview`.
- **Privacy Education**: K-anonymity tooltips explaining k=5 threshold and protection mechanisms.
- **Quick Actions**: Utility strip with Export Data, View Audit Log, Retention badge (365d).
- **Inline Slack Tips**: Command reference with copy-to-clipboard for `/feedback` variants.

*Phase 2: Activation UX*
- **Empty States**: Action-oriented messaging for zero-count metrics (e.g., "Invite team to submit feedback via Slack").
- **Welcome Modal**: First-run detection (localStorage) shows guided onboarding for new installations with 4-step quickstart.
- **Milestone Celebrations**: Automatic toasts for first feedback submission and k-anonymity threshold achievement with sessionStorage tracking.
- **Contextual Help**: Tooltips on digest settings and checklist items explaining features without cluttering UI.
- **Progressive Disclosure**: Checklist and metrics naturally guide users through feature discovery based on completion status.

*Phase 3: Billing & Compliance*
- **Billing Page** (`/admin/billing`): Full plan comparison (Trial, Pro, Scale) with feature matrices, current plan card, usage progress bar, and upgrade CTAs.
- **Compliance Page** (`/admin/compliance`): GDPR controls, data retention policy display (365d default), export tools, DPA download, privacy architecture explainer (k-anonymity, no PII, content filtering), and data deletion request option.
- **Plan Features**: Detailed feature lists per tier (seat caps, support levels, analytics depth, DPA signing, custom integrations).
- **Compliance Docs**: Direct links to DPA PDF, security whitepaper, privacy policy.

*Phase 4: Reliability & Operations*
- **System Health Page** (`/admin/system-health`): Uptime tracking (99.97%), average response time monitoring (142ms), error rate dashboard (0.03%), service status indicators for database/API/Slack integration.
- **Audit Log Viewer** (`/admin/audit-log`): Filterable activity log with search, action type filtering (feedback/topics/users/settings), severity badges (info/warning/critical), timestamp and user tracking.
- **Error Tracking**: Recent incidents display, system component health indicators, operational status badges.
- **Performance Metrics**: Response time monitoring, uptime percentage tracking, error rate analysis.

### User Preferences
I prefer iterative development and clear, concise explanations. Ask before making major changes to the architecture or core functionalities. Ensure all new features align with the privacy-first principle.

### System Architecture

#### UI/UX Decisions
The frontend uses React, TypeScript, Vite, and Tailwind CSS, focusing on a clean, modern administrative interface. Public pages for landing, pricing, and documentation are also included. Admin dashboards provide real-time statistics, topic management, feedback moderation, and user/billing settings.

#### Technical Implementations
- **Frontend**: React + TypeScript + Vite + Tailwind CSS for a modern and responsive user interface.
- **Backend**: Express.js handles API requests, integrated with PostgreSQL (Neon) via Drizzle ORM for data management.
- **Authentication & Authorization**: Session-based authentication, integrated with Slack OAuth v2. Role-based access control (Owner, Admin, Moderator, Viewer) with Row-Level Security (RLS) ensures multi-tenant data isolation and proper permissions.
- **Privacy Architecture**:
    - **K-anonymity**: Implemented through database views and careful data handling to prevent re-identification.
    - **Per-Org Encryption**: Content is encrypted with per-organization AEAD keys (planned).
    - **Pseudonymity**: No real names or directly identifiable information stored in content tables.
    - **Content Filtering**: PII and `@mention` blocking within feedback submissions.
    - **Submitter Hash**: Daily-rotating hash for deduplication and rate-limiting without storing identifying info.
- **Slack Integration**: Utilizes Slack's OAuth v2, Slash Commands, and Events API for core functionality, including feedback submission via modals, daily digests, and invitation workflows.
- **Feedback Mechanism**: Supports SBI (Situation, Behavior, Impact) feedback. Features context-aware Slack Block Kit modals, topic-specific submissions, and general feedback with rolling instances (weekly).
- **Moderation Workflow**: Includes a flag queue, bulk actions, and an immutable audit trail for all moderation decisions. Supports thread-level and item-level moderation with distinct statuses.
- **Topic Management**: Features time-boxed feedback campaigns with a defined lifecycle (collecting, in_review, action_decided, actioned). Includes auto-lock cron jobs and "You said / We did" action loops. Supports user-suggested topics.
- **Analytics**: Privacy-preserving aggregated metrics, with plans for CSV/PDF export. Focuses on overall trends without exposing individual data.
- **User Management**: Slack-native invitation system, role management, and user removal functionalities.
- **Security**: Session regeneration, CSRF protection, and robust org-scoping for all queries.

#### System Design Choices
- **Multi-tenancy**: Achieved through RLS on all tables using `current_org_id()` from JWT claims and per-org encryption.
- **Event-Driven**: Slack Events API is central to interaction.
- **Scheduled Tasks**: Cron jobs for auto-locking topics, creating new general feedback instances, and sending reminders.
- **Database Schema**: Designed for privacy and scalability, including tables for `orgs`, `users`, `topics`, `threads`, `items`, `comments`, `slack_teams`, `moderation_audit`, `slack_settings`, and `topic_suggestions`.
- **Environment Management**: Separation of server-only and public environment variables for security.

### External Dependencies

- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Billing**: Stripe
- **Integration Platform**: Slack (OAuth v2, Slash Commands, Events API)
- **Session Store**: Redis (for production environments)
- **Serverless Functions**: Supabase Edge Functions (for backend logic and cron jobs)
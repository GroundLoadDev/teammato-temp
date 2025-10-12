# Teammato - Anonymous Feedback Platform

### Overview
Teammato is an enterprise-grade, Slack-first SaaS platform for anonymous feedback within organizations. It ensures privacy through k-anonymity, per-organization encryption, and multi-tenant isolation. The platform aims to foster transparent feedback, boost employee engagement, and deliver actionable insights while protecting user anonymity. Key capabilities include time-boxed feedback campaigns, robust moderation, privacy-preserving analytics, and seamless Slack integration. The project includes a marketing website rebuild, a multi-phase Admin Dashboard redesign (billing, compliance, system health, audience config), and a CPU-based ML pipeline for automatic theme generation from feedback.

### User Preferences
I prefer iterative development and clear, concise explanations. Ask before making major changes to the architecture or core functionalities. Ensure all new features align with the privacy-first principle.

### System Architecture

#### UI/UX Decisions
The frontend utilizes React, TypeScript, Vite, and Tailwind CSS for a modern administrative interface and responsive public pages. Admin dashboards offer real-time statistics, topic and feedback management, and user/billing settings. Design principles include consistent emerald-600 accents, rounded cards, responsive grids, and accessibility. The Slack integration provides expanded, interactive command cards for guided usage.

#### Technical Implementations
- **Frontend**: React + TypeScript + Vite + Tailwind CSS.
- **Backend**: Express.js with PostgreSQL (Neon) via Drizzle ORM.
- **Authentication & Authorization**: Session-based authentication, Slack OAuth v2, and role-based access control (Owner, Admin, Moderator, Viewer) with Row-Level Security (RLS) for multi-tenancy.
- **Privacy Architecture**: K-anonymity (k=5 minimum enforced), application-layer encryption (XChaCha20-Poly1305 AEAD with per-org DEKs), pseudonymity, PII/`@mention` filtering, per-thread submitter hashes, 5-30s timing jitter for notifications, timestamp rounding to day level, differential privacy (Laplace noise ε=0.5), k+2 buffer threshold, and 10-user minimum org population. K-threshold and collection window are locked after topic creation to prevent anonymity gaming. Encryption monitoring tracks all operations with structured logging. Key rotation policy supports manual master key rotation with audit trail (recommended every 90 days).
- **Slack Integration**: Slack OAuth v2, Slash Commands (case-insensitive topic slug matching), and Events API for feedback submission (modals), daily digests, and invitations.
- **Moderation Workflow**: Flag queue, bulk actions, and immutable audit trails.
- **Topic Management**: Time-boxed feedback campaigns, auto-lock cron jobs, "You said / We did" loops, user-suggested topics with tracking, and anti-gamification safeguards. Topic cards display k-threshold progress with color coding and days remaining.
- **Analytics & Export**: Privacy-preserving aggregated metrics with k-safe export capabilities using database views.
- **User Management**: Slack-native invitation system, role management, and user removal.
- **Security**: Session regeneration, CSRF protection, and robust org-scoping.
- **Theming System**: CPU-based ML pipeline for local processing of feedback embeddings using agglomerative hierarchical clustering, c-TF-IDF keywording, and template-based summarization.
- **Billing & Subscription**: Comprehensive Stripe integration with 7 pricing tiers, monthly/annual options, seat-based capacity management, contextual banners, invoice history, and deep integration with Stripe Checkout and Customer Portal. An 8-state billing state machine with persistence is implemented. Seat-cap notifications are automated via Slack DM and email.
- **Retention Policies**: Configurable data retention periods up to 3 years.

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
# Teammato - Anonymous Feedback Platform

### Overview
Teammato is an enterprise-grade, Slack-first SaaS platform designed for anonymous feedback within organizations. It prioritizes privacy through a k-anonymity architecture, per-organization encryption, and multi-tenant isolation. The platform aims to facilitate transparent feedback loops, enhance employee engagement, and provide actionable insights while safeguarding user anonymity. Key capabilities include time-boxed feedback campaigns, robust moderation tools, privacy-preserving analytics, and seamless Slack integration. The project includes a marketing website rebuild focused on "Show Don't Tell" with interactive elements, and a multi-phase redesign of the Admin Dashboard for enhanced billing, compliance, system health, and audience configuration features. A significant new feature is the integration of a CPU-based ML pipeline for automatic theme generation from feedback.

### User Preferences
I prefer iterative development and clear, concise explanations. Ask before making major changes to the architecture or core functionalities. Ensure all new features align with the privacy-first principle.

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
- **Topic Management**: Time-boxed feedback campaigns with a defined lifecycle, auto-lock cron jobs, "You said / We did" action loops, and user-suggested topics.
- **Analytics**: Privacy-preserving aggregated metrics with planned export capabilities.
- **User Management**: Slack-native invitation system, role management, and user removal.
- **Security**: Session regeneration, CSRF protection, and robust org-scoping.
- **Theming System**: CPU-based ML pipeline for zero-cost local processing of feedback embeddings (@xenova/transformers on ONNX runtime) using agglomerative hierarchical clustering, c-TF-IDF keywording, and template-based summarization. Access controlled by `enable_theming` flag and k-anonymity thresholds.
- **Billing & Subscription**: Comprehensive Stripe integration with 7 pricing tiers (250 to 25k seats), monthly/annual billing options, seat-based capacity management linked to Audience settings, contextual banners for trial/grace/over-cap states, invoice history with download links, and deep integration with Stripe Checkout and Customer Portal. Database tracks customer IDs, subscription status, billing periods, seat caps, trial/cancel/grace timestamps, and billing email.

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
- **Session Store**: Redis (production)
- **Serverless Functions**: Supabase Edge Functions
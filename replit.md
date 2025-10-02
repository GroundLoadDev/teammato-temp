# Teammato - Anonymous Feedback Platform

### Overview
Teammato is an enterprise-grade, Slack-first SaaS platform designed for anonymous feedback within organizations. It prioritizes privacy through a k-anonymity architecture, per-organization encryption, and multi-tenant isolation. The platform aims to facilitate transparent feedback loops, enhance employee engagement, and provide actionable insights while safeguarding user anonymity. Key capabilities include time-boxed feedback campaigns, robust moderation tools, privacy-preserving analytics, and seamless Slack integration.

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
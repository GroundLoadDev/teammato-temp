# Teammato - Anonymous Feedback Platform

## Project Overview

Teammato is an enterprise-grade Slack-first anonymous feedback SaaS with privacy-first architecture including k-anonymity, per-org encryption, and multi-tenant isolation.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + RLS)
- **Billing**: Stripe
- **Integration**: Slack (OAuth v2, Slash Commands, Events API)
- **Logging**: Structured logger with redaction

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

### Tables (9 total):
- `orgs` - Organizations with settings (k_anonymity, retention, etc.)
- `users` - App shadow of Supabase auth with org binding and roles
- `topics` - Feedback taxonomy
- `threads` - Anonymous posts (encrypted)
- `comments` - Anonymous comments (encrypted)
- `reactions` - Deduplicated by actor_hash
- `moderation_flags` - Flag queue
- `analytics_daily` - Aggregated metrics only
- `audit_admin` - Admin actions (no poster identity)
- `slack_teams` - Slack workspace mappings
- `slack_settings` - Slack configuration per org

### Security:
- Row-Level Security (RLS) on all tables using `current_org_id()` from JWT
- K-anonymity views (`v_thread_participants`, `v_threads`, `v_comments`)
- Content encrypted with per-org AEAD keys
- Pseudonymous handles (no real names in content tables)
- No IP/UA logging in content

## Onboarding Flow

1. User clicks "Add to Slack" on landing page
2. Slack OAuth → `/slack/oauth` Edge Function
3. Auto-provision: Create org → slack_teams → map installer as owner
4. Redirect to `/post-install` with success message
5. User configures settings, topics, and invites admins

## Key Features

- **Privacy-First**: K-anonymity, encryption, pseudonyms, no PII
- **Multi-Tenant**: Complete isolation with RLS
- **Slack Integration**: OAuth, slash commands, events, digests
- **Moderation**: Flag queue, bulk actions, audit trails
- **Analytics**: Privacy-preserving aggregates, CSV/PDF export
- **Compliance**: GDPR/CCPA ready, retention policies, legal hold

## Next Steps

This scaffold provides:
- ✅ Complete folder structure
- ✅ All 17 Edge Function stubs with structured logging
- ✅ Database schema with RLS and k-anonymity views
- ✅ Environment helpers (appEnv.ts, slackInstall.ts)
- ✅ All public, auth, and admin pages
- ✅ Slack OAuth auto-provisioning stub

To implement:
- [ ] Complete Edge Function logic (encryption, JWT validation, etc.)
- [ ] Wire up Supabase client in frontend
- [ ] Implement actual Slack OAuth exchange
- [ ] Add per-org encryption with AEAD
- [ ] Build moderation queue UI
- [ ] Implement analytics dashboard with real data
- [ ] Add OIDC SSO integration

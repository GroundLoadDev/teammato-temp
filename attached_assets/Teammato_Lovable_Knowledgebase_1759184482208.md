
# Teammato — Enterprise-Grade Internal Anonymous Feedback SaaS
**Knowledgebase & Lovable Handoff**  
Version 2025-09-26 23:33 UTC  

> Purpose: Provide an exhaustive, copy‑pasteable guide and specification to build Teammato using Lovable (React + Vite + Tailwind + TypeScript + Supabase). This document is optimized for **credit preservation**: deterministic prompts, explicit schemas, acceptance criteria, and anti‑thrash guidelines.

---

## 0) Credit Preservation Rules (Read First)
**Goal:** Ship fast with minimal Lovable credits.
- **Plan outside Lovable.** Paste only *precise tasks*. No brainstorming inside Lovable.
- **Chunk by complete artifacts.** Each prompt yields a working module (UI + server + tests).
- **Lock the stack:** React, Vite, Tailwind, TypeScript, Supabase (Auth/Postgres/Edge Functions/Storage).
- **No secrets in client.** All sensitive logic in Edge Functions; environment variables server-only.
- **OIDC SSO first.** Defer SAML/SCIM until requested by a paying customer.
- **RLS/View tests gate deploys.** CI fails on any cross‑tenant or k‑anonymity regression.
- **Batch UI tweaks.** Avoid iterative micro-edits—specify all states in one prompt.

---

## 1) Product Overview
**Teammato** enables employees to submit **anonymous feedback** inside their company. It ensures privacy (no IP/UA persisted in content tables, pseudonymous handles, per‑org encryption) and gives admins **privacy‑preserving analytics**, moderation tools, retention/legal‑hold controls, and optional integrations (OIDC SSO now; Slack/LLM moderation later).

### Roles
- **Owner:** Billing/plan, org‑wide settings, SSO, legal hold, retention, invite admins.
- **Admin:** Moderation actions, topics, analytics, exports, configure thresholds.
- **Moderator:** Resolve flags, remove/restore content, respond officially.
- **Member:** Submit threads/comments anonymously; react and search.

### Core Guarantees
- **Multi-tenancy isolation** with RLS.
- **Anonymity** via pseudonyms, actor hashes, k‑anonymity gating, and optional per‑org encryption.
- **No PII** (no IP/UA or emails in content tables).
- **Observability** without leaking content.
- **Retention & Legal Hold** per‑org.

---

## 2) Information Architecture (Pages)
- `/auth` — Login (magic link + OIDC toggle). First‑time org join via verified domain.
- `/app/threads` — List (topic filter, search, sort). Hidden content placeholders until k≥5.
- `/app/threads/new` — Create Thread (title/body/topic). “Under review” banner if flagged.
- `/app/threads/:id` — Thread detail (comments, reactions, admin banners if flagged/removed).
- `/admin/moderation` — Flag queue with triage, filters, bulk actions, audit trail.
- `/admin/analytics` — Trends, heatmaps, participation counts, exports (CSV/PDF).
- `/admin/settings` — Org profile, plan gates, thresholds (k, profanity policy), retention & legal hold.
- `/admin/settings/sso` — OIDC metadata, enable/disable, instructions.
- `/admin/settings/topics` — Manage taxonomy.

---

## 3) Data Model (Postgres/Supabase)
> **Rule:** Every tenant table has `org_id UUID` and **RLS** enforcing `auth.jwt().org_id = org_id`.

### 3.1 Tables (SQL)
```sql
-- ORGS
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  verified_domains text[] not null default '{}',
  sso_provider jsonb, -- OIDC metadata (SAML later)
  settings jsonb not null default jsonb_build_object(
    'k_anonymity', 5,
    'profanity_policy', 'strict',
    'redact_ui', true,
    'enable_oidc', false,
    'enable_llm_moderation', false,
    'plan', 'trial',
    'retention_days', 365,
    'legal_hold', false
  ),
  created_at timestamptz not null default now()
);

-- USERS (app shadow of Supabase auth.users)
create table public.users (
  id uuid primary key, -- matches auth.uid()
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text, -- optional mirror; source of truth is auth
  role text not null check (role in ('owner','admin','moderator','member')) default 'member',
  profile jsonb, -- dept/location/function (from SSO claims or CSV import)
  created_at timestamptz not null default now()
);

-- TOPICS (taxonomy)
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  unique(org_id, slug)
);

-- THREADS (anonymous posts)
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title_ciphertext bytea not null,
  body_ciphertext bytea not null,
  nonce bytea not null, -- for AEAD (nonce/iv)
  status text not null check (status in ('visible','flagged','removed','archived')) default 'visible',
  created_by_pseud text not null, -- pseudonymous handle
  created_at timestamptz not null default now()
);

-- COMMENTS
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  thread_id uuid not null references public.threads(id) on delete cascade,
  body_ciphertext bytea not null,
  nonce bytea not null,
  status text not null check (status in ('visible','flagged','removed')) default 'visible',
  created_by_pseud text not null,
  created_at timestamptz not null default now()
);

-- REACTIONS (dedup by actor_hash)
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  thread_id uuid references public.threads(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reaction text not null check (reaction in ('up','down','tomato','brain','heart')),
  actor_hash text not null, -- per-org salted hash of user id
  created_at timestamptz not null default now(),
  constraint one_target check ((thread_id is not null) <> (comment_id is not null)),
  unique (org_id, actor_hash, thread_id, comment_id, reaction)
);

-- MODERATION FLAGS
create table public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  subject_type text not null check (subject_type in ('thread','comment')),
  subject_id uuid not null,
  flag_type text not null check (flag_type in ('toxicity','pii','harassment','spam','legal','profanity')),
  details jsonb,
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ANALYTICS (aggregates only)
create table public.analytics_daily (
  org_id uuid not null references public.orgs(id) on delete cascade,
  date date not null,
  topic_id uuid,
  threads_count int not null default 0,
  comments_count int not null default 0,
  unique_participants int not null default 0,
  toxicity_rate numeric not null default 0,
  sentiment_avg numeric,
  primary key (org_id, date, topic_id)
);

-- ADMIN AUDIT (no poster identity ever)
create table public.audit_admin (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  admin_user_id uuid not null references public.users(id),
  action text not null,
  subject jsonb,
  created_at timestamptz not null default now()
);
```

### 3.2 Row-Level Security (RLS) Policies (SQL)
```sql
-- Enable RLS
alter table public.orgs enable row level security;
alter table public.users enable row level security;
alter table public.topics enable row level security;
alter table public.threads enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.moderation_flags enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.audit_admin enable row level security;

-- Helper: current org from JWT
create or replace function public.current_org_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'org_id','')::uuid
$$;

-- Generic tenant-isolation policies
do $$
declare t text;
begin
  for t in select unnest(array[
    'orgs','users','topics','threads','comments','reactions','moderation_flags','analytics_daily','audit_admin'
  ]) loop
    execute format('
      create policy %I_select on public.%I
        for select using (org_id = public.current_org_id());
      ', t||'_sel', t);
    execute format('
      create policy %I_insert on public.%I
        for insert with check (org_id = public.current_org_id());
      ', t||'_ins', t);
    execute format('
      create policy %I_update on public.%I
        for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
      ', t||'_upd', t);
    execute format('
      create policy %I_delete on public.%I
        for delete using (org_id = public.current_org_id());
      ', t||'_del', t);
  end loop;
end $$;
```

### 3.3 K‑Anonymity Views (SQL)
```sql
-- Participants per thread (distinct pseudonyms)
create or replace view public.v_thread_participants as
select
  t.org_id,
  t.id as thread_id,
  count(distinct c.created_by_pseud) + 1 as distinct_participants -- +1 for thread author
from public.threads t
left join public.comments c
  on c.thread_id = t.id and c.org_id = t.org_id and c.status = 'visible'
where t.status = 'visible'
group by t.org_id, t.id;

-- Secure thread view: suppress until k
create or replace view public.v_threads as
select
  t.org_id, t.id, t.topic_id, t.title_ciphertext, t.body_ciphertext, t.nonce,
  case when p.distinct_participants >= coalesce((t_org.settings->>'k_anonymity')::int,5)
    then 'visible' else 'suppressed' end as render_state,
  t.created_by_pseud, t.created_at
from public.threads t
join public.orgs t_org on t_org.id = t.org_id
left join public.v_thread_participants p
  on p.org_id = t.org_id and p.thread_id = t.id;

-- Comments suppressed with parent
create or replace view public.v_comments as
select
  c.org_id, c.id, c.thread_id, c.body_ciphertext, c.nonce,
  v.render_state, c.created_by_pseud, c.created_at
from public.comments c
join public.v_threads v
  on v.org_id = c.org_id and v.id = c.thread_id
where c.status = 'visible';
```

### 3.4 Seeds (SQL)
```sql
insert into public.orgs (id, name, verified_domains) values
  ('00000000-0000-0000-0000-000000000001','Acme Inc', array['acme.com']);

insert into public.users (id, org_id, email, role)
values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','alice@acme.com','owner');
```

---

## 4) Anonymity & Crypto (Server Expectations)
- **Pseudonyms:** `created_by_pseud = 'anon-' || left(encode(sha256(org_salt || user_id || epoch_month), 'hex'), 8)`
- **Actor Hash (dedupe):** `actor_hash = encode(sha256(org_actor_salt || user_id), 'hex')`
- **Content Encryption:** AEAD (XChaCha20-Poly1305 or AES‑GCM) with per‑org key. Store `{ciphertext, nonce}`. Keys in server env only; rotate via `key_version` pointer in `orgs.settings`.
- **No IP/UA** in content tables; logs redact content and identity.

---

## 5) Edge Functions (API Contracts)
### 5.1 `submit_feedback`
**Input:**
```json
{ "title": "text", "body": "text", "topic_id": "uuid|null" }
```
**Output:**
```json
{ "id":"uuid","render_state":"visible|suppressed|flagged","created_at":"iso" }
```
**Errors:** 400 (validation), 429 (rate limit), 403 (org mismatch).

### 5.2 `submit_comment`
```json
{ "thread_id":"uuid","body":"text" }
```
Returns `{ "id":"uuid","render_state":"visible|suppressed" }`.

### 5.3 `react`
```json
{ "subject_type":"thread|comment","subject_id":"uuid","reaction":"up|down|tomato|brain|heart" }
```
Returns counts snapshot; dedupe by `actor_hash`.

### 5.4 `moderation_actions` (Admin)
```json
{ "action":"remove|restore|respond","subject_type":"thread|comment","subject_id":"uuid","admin_note":"text?" }
```

### 5.5 `analytics_rollup` (cron)
Populate `analytics_daily`.

### 5.6 `admin_export`
Produce signed URL to CSV aggregates.

### 5.7 `slack_webhook` (optional)
Validate signature; map slash args → topic; call `submit_feedback`.

---

## 6) UI Specs
### Threads List
- Filters: topic, time, sort. Rows show topic chip, render_state badge, time, reactions.
- Placeholder for suppressed content.

### New Thread
- Fields: title (≤160), body (markdown-lite), topic (select). Banners for visible/flagged.

### Thread Detail
- Comments composer, reactions (one per actor), admin banners.

### Admin Moderation
- Table, detail drawer, bulk actions; audit log display; redaction mode.

### Analytics
- KPIs, line/bar/heatmap; CSV export.

### Settings
- k‑anonymity, retention, legal hold, profanity policy, plan gates, OIDC settings.

---

## 7) Tests
### SQL/Policy
- Cross‑tenant access denied (select/insert/update/delete).
- K‑anonymity suppression verified.
- Reaction dedupe enforced.
- Admin actions produce audit entries.

### Unit (Edge)
- submit_feedback: clean vs flagged; ciphertext present.
- submit_comment: inherits suppression.
- react: dedupe/counts.
- moderation_actions: RBAC & audit.

### E2E
- Member flow (suppression → visible at k).
- Admin moderation & export.

---

## 8) Observability & Ops
- Structured logs: request_id, org_id, fn, decision, latency_ms (no content).
- Alerts: 4xx/5xx spikes, flagged rate spikes, cron failures.
- Backups, WAF/CDN, secrets management (per‑org salts/keys), key rotation.

---

## 9) Retention & Legal Hold
- Purge after `retention_days` unless `legal_hold=true`.
- Keep analytics aggregates.

---

## 10) Lovable Prompts (Copy‑Paste)

### P1 — Scaffold
Create a multi-tenant web app named “Teammato” with React + Vite + Tailwind + TypeScript and Supabase (Auth, Postgres, Edge Functions). Add routes: /auth, /app, /admin with a shell (top nav + left sidebar). Acceptance: project builds; /auth renders; Tailwind working; Supabase configured.

### P2 — Apply Schema & Policies
Apply the following SQL verbatim to Supabase (schema, RLS, views, seeds). Generate a migration and run it. Add SQL policy tests to CI that fail on cross-tenant reads or if v_threads/v_comments show rows when participants < k. [PASTE SQL FROM SECTIONS 3.1–3.4 HERE]
Acceptance: migration applied; tests pass; views suppress < k.

### P3 — Auth & Org Binding
Implement Supabase Auth with Magic Link and an OIDC SSO toggle (orgs.settings.enable_oidc). On first login, map user to org by email domain (orgs.verified_domains), create users row with role=member. Show org in header.
Acceptance: login + org binding OK.

### P4 — Edge: submit_feedback
Build submit_feedback Edge Function with validation (Zod), pseud generation, AEAD encryption, regex moderation, status visible/flagged, DTO return. Unit tests included.
Acceptance: ciphertext stored; flagged path works; no plaintext logs.

### P5 — UI: New Thread
Build /app/threads/new form; call submit_feedback; show banners. No client DB writes.
Acceptance: happy + flagged paths OK.

### P6 — Comments & Reactions
Edge submit_comment + react (actor_hash dedupe at DB). UI: thread detail with comments & reactions.
Acceptance: dedupe enforced; optimistic updates OK.

### P7 — Views Enforcement
Use v_threads/v_comments for reads; show suppressed placeholders.
Acceptance: suppression enforced at < k.

### P8 — Admin Moderation
/admin/moderation with actions remove/restore/respond via moderation_actions; audit_admin writes; redact_ui honored.
Acceptance: RBAC enforced; audit entries exist.

### P9 — Analytics & Export
Cron analytics_rollup → analytics_daily; /admin/analytics charts; admin_export CSV with signed URL.
Acceptance: charts render; CSV contains aggregates only.

### P10 — OIDC SSO Settings
/admin/settings/sso to enable OIDC; discovery URL, client ID/secret saved to orgs.sso_provider; hide magic link when enabled.
Acceptance: dev OIDC login works.

### P11 — Logs, Rate Limits, Retention
Structured logs, per-actor/org rate limits (429), purge cron with legal_hold skip.
Acceptance: logs visible; simulated spike alert; purge dry-run OK.

---

## 11) Post‑MVP Roadmap
- SAML + SCIM, LLM moderation (feature-flagged), Slack/Teams bots, Stripe billing, key rotation, PWA.

---

## 12) Security & Go‑Live Checklist
- RLS, views, tests ✅
- Secrets server-only ✅
- No IP/UA in content tables ✅
- Audit Admin immutable ✅
- CSP/HTTPS/SameSite ✅
- OIDC tested; magic link disabled when enabled ✅
- Rate limits & alerts ✅
- Backups & DR ✅

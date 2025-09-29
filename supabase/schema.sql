-- Teammato Database Schema
-- Multi-tenant anonymous feedback with k-anonymity and RLS

-- ORGS
CREATE TABLE public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  verified_domains TEXT[] NOT NULL DEFAULT '{}',
  sso_provider JSONB,
  settings JSONB NOT NULL DEFAULT jsonb_build_object(
    'k_anonymity', 5,
    'profanity_policy', 'strict',
    'redact_ui', true,
    'enable_oidc', false,
    'enable_llm_moderation', false,
    'plan', 'trial',
    'retention_days', 365,
    'legal_hold', false
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USERS (app shadow of Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','moderator','member')) DEFAULT 'member',
  profile JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TOPICS (taxonomy)
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(org_id, slug)
);

-- THREADS (anonymous posts)
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  title_ciphertext BYTEA NOT NULL,
  body_ciphertext BYTEA NOT NULL,
  nonce BYTEA NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('visible','flagged','removed','archived')) DEFAULT 'visible',
  created_by_pseud TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  body_ciphertext BYTEA NOT NULL,
  nonce BYTEA NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('visible','flagged','removed')) DEFAULT 'visible',
  created_by_pseud TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REACTIONS (dedup by actor_hash)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('up','down','tomato','brain','heart')),
  actor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_target CHECK ((thread_id IS NOT NULL) <> (comment_id IS NOT NULL)),
  UNIQUE (org_id, actor_hash, thread_id, comment_id, reaction)
);

-- MODERATION FLAGS
CREATE TABLE public.moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('thread','comment')),
  subject_id UUID NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('toxicity','pii','harassment','spam','legal','profanity')),
  details JSONB,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ANALYTICS (aggregates only)
CREATE TABLE public.analytics_daily (
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  topic_id UUID,
  threads_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  unique_participants INT NOT NULL DEFAULT 0,
  toxicity_rate NUMERIC NOT NULL DEFAULT 0,
  sentiment_avg NUMERIC,
  PRIMARY KEY (org_id, date, topic_id)
);

-- ADMIN AUDIT (no poster identity ever)
CREATE TABLE public.audit_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  subject JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLACK TEAMS
CREATE TABLE public.slack_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  bot_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLACK SETTINGS
CREATE TABLE public.slack_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  digest_channel TEXT,
  digest_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id)
);

-- Enable RLS
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_settings ENABLE ROW LEVEL SECURITY;

-- Helper: current org from JWT
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID LANGUAGE SQL STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'org_id','')::UUID
$$;

-- Generic tenant-isolation policies
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT UNNEST(ARRAY[
    'orgs','users','topics','threads','comments','reactions','moderation_flags','analytics_daily','audit_admin','slack_teams','slack_settings'
  ]) LOOP
    EXECUTE format('
      CREATE POLICY %I ON public.%I
        FOR SELECT USING (org_id = public.current_org_id());
      ', t||'_sel', t);
    EXECUTE format('
      CREATE POLICY %I ON public.%I
        FOR INSERT WITH CHECK (org_id = public.current_org_id());
      ', t||'_ins', t);
    EXECUTE format('
      CREATE POLICY %I ON public.%I
        FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
      ', t||'_upd', t);
    EXECUTE format('
      CREATE POLICY %I ON public.%I
        FOR DELETE USING (org_id = public.current_org_id());
      ', t||'_del', t);
  END LOOP;
END $$;

-- K-Anonymity Views
CREATE OR REPLACE VIEW public.v_thread_participants AS
SELECT
  t.org_id,
  t.id AS thread_id,
  COUNT(DISTINCT c.created_by_pseud) + 1 AS distinct_participants
FROM public.threads t
LEFT JOIN public.comments c
  ON c.thread_id = t.id AND c.org_id = t.org_id AND c.status = 'visible'
WHERE t.status = 'visible'
GROUP BY t.org_id, t.id;

CREATE OR REPLACE VIEW public.v_threads AS
SELECT
  t.org_id, t.id, t.topic_id, t.title_ciphertext, t.body_ciphertext, t.nonce,
  CASE WHEN p.distinct_participants >= COALESCE((t_org.settings->>'k_anonymity')::INT,5)
    THEN 'visible' ELSE 'suppressed' END AS render_state,
  t.created_by_pseud, t.created_at
FROM public.threads t
JOIN public.orgs t_org ON t_org.id = t.org_id
LEFT JOIN public.v_thread_participants p
  ON p.org_id = t.org_id AND p.thread_id = t.id;

CREATE OR REPLACE VIEW public.v_comments AS
SELECT
  c.org_id, c.id, c.thread_id, c.body_ciphertext, c.nonce,
  v.render_state, c.created_by_pseud, c.created_at
FROM public.comments c
JOIN public.v_threads v
  ON v.org_id = c.org_id AND v.id = c.thread_id
WHERE c.status = 'visible';

-- Seed data
INSERT INTO public.orgs (id, name, verified_domains) VALUES
  ('00000000-0000-0000-0000-000000000001','Acme Inc', ARRAY['acme.com']);

INSERT INTO public.users (id, org_id, email, role) VALUES
  ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','alice@acme.com','owner');

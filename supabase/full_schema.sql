-- ==============================================================================
-- SPROJ COMPLETE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/buhzizyeewkvvnczddtm/sql/new
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('running', 'paused', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.focus_type AS ENUM ('explore', 'learn', 'build', 'review', 'plan');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.session_source AS ENUM ('timer', 'manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.attachment_kind AS ENUM ('file', 'link');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.goal_type AS ENUM ('hours', 'sessions', 'outcome');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'missed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  timezone    TEXT NOT NULL DEFAULT 'UTC',
  week_start  SMALLINT NOT NULL DEFAULT 1 CHECK (week_start BETWEEN 0 AND 6),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  invite_code  TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- 5. SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status        public.session_status NOT NULL DEFAULT 'running',
  focus_type    public.focus_type NOT NULL DEFAULT 'build',
  intent        TEXT NOT NULL DEFAULT '',
  outcome       TEXT,
  notes         TEXT,
  source        public.session_source NOT NULL DEFAULT 'timer',
  project_tag   TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_user
  ON public.sessions (user_id)
  WHERE status IN ('running', 'paused');

-- 6. SESSION SEGMENTS
CREATE TABLE IF NOT EXISTS public.session_segments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  duration_s  INTEGER
);

-- 7. ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.attachments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind         public.attachment_kind NOT NULL,
  name         TEXT NOT NULL,
  url          TEXT,
  storage_path TEXT,
  mime_type    TEXT,
  size_bytes   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  type          public.goal_type NOT NULL,
  title         TEXT NOT NULL,
  target        NUMERIC,
  current       NUMERIC NOT NULL DEFAULT 0,
  status        public.goal_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. WEEKLY REFLECTIONS
CREATE TABLE IF NOT EXISTS public.weekly_reflections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  wins          TEXT,
  blockers      TEXT,
  next_week     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id, week_start)
);

-- 10. REACTIONS
CREATE TABLE IF NOT EXISTS public.reactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  reflection_id UUID REFERENCES public.weekly_reflections(id) ON DELETE CASCADE,
  emoji         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (session_id IS NOT NULL AND reflection_id IS NULL) OR
    (session_id IS NULL AND reflection_id IS NOT NULL)
  )
);

-- 11. PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. RLS & SECURITY HELPER
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
    AND user_id = (SELECT auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
CREATE POLICY "Users can view any profile" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- Workspaces Policies
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces" ON public.workspaces FOR SELECT USING (public.is_workspace_member(id) OR created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Workspace creator can update workspace" ON public.workspaces;
CREATE POLICY "Workspace creator can update workspace" ON public.workspaces FOR UPDATE USING (created_by = (SELECT auth.uid()));

-- Workspace Members Policies
DROP POLICY IF EXISTS "Members can view workspace membership" ON public.workspace_members;
CREATE POLICY "Members can view workspace membership" ON public.workspace_members FOR SELECT USING (public.is_workspace_member(workspace_id) OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can join a workspace" ON public.workspace_members;
CREATE POLICY "Users can join a workspace" ON public.workspace_members FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Sessions Policies
DROP POLICY IF EXISTS "Workspace members can view sessions" ON public.sessions;
CREATE POLICY "Workspace members can view sessions" ON public.sessions FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Session Segments Policies
DROP POLICY IF EXISTS "Workspace members can view segments" ON public.session_segments;
CREATE POLICY "Workspace members can view segments" ON public.session_segments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND public.is_workspace_member(s.workspace_id))
);

DROP POLICY IF EXISTS "Users can insert segments for own sessions" ON public.session_segments;
CREATE POLICY "Users can insert segments for own sessions" ON public.session_segments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Users can update segments for own sessions" ON public.session_segments;
CREATE POLICY "Users can update segments for own sessions" ON public.session_segments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.user_id = (SELECT auth.uid()))
);

-- Attachments Policies
DROP POLICY IF EXISTS "Workspace members can view attachments" ON public.attachments;
CREATE POLICY "Workspace members can view attachments" ON public.attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND public.is_workspace_member(s.workspace_id))
);

DROP POLICY IF EXISTS "Users can insert own attachments" ON public.attachments;
CREATE POLICY "Users can insert own attachments" ON public.attachments FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;
CREATE POLICY "Users can delete own attachments" ON public.attachments FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Goals Policies
DROP POLICY IF EXISTS "Workspace members can view goals" ON public.goals;
CREATE POLICY "Workspace members can view goals" ON public.goals FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals" ON public.goals FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Reflections Policies
DROP POLICY IF EXISTS "Workspace members can view reflections" ON public.weekly_reflections;
CREATE POLICY "Workspace members can view reflections" ON public.weekly_reflections FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can insert own reflections" ON public.weekly_reflections;
CREATE POLICY "Users can insert own reflections" ON public.weekly_reflections FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can update own reflections" ON public.weekly_reflections;
CREATE POLICY "Users can update own reflections" ON public.weekly_reflections FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Reactions Policies
DROP POLICY IF EXISTS "Workspace members can view reactions" ON public.reactions;
CREATE POLICY "Workspace members can view reactions" ON public.reactions FOR SELECT USING (
  (session_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND public.is_workspace_member(s.workspace_id)))
  OR
  (reflection_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.weekly_reflections r WHERE r.id = reflection_id AND public.is_workspace_member(r.workspace_id)))
);

DROP POLICY IF EXISTS "Users can insert own reactions" ON public.reactions;
CREATE POLICY "Users can insert own reactions" ON public.reactions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own reactions" ON public.reactions;
CREATE POLICY "Users can delete own reactions" ON public.reactions FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Push Subscriptions Policies
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL USING (user_id = (SELECT auth.uid()));

-- 13. INDEXES
CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON public.sessions (workspace_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions (status) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_segments_session ON public.session_segments (session_id);
CREATE INDEX IF NOT EXISTS idx_attachments_session ON public.attachments (session_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_week ON public.goals (user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_goals_workspace_week ON public.goals (workspace_id, week_start);
CREATE INDEX IF NOT EXISTS idx_reflections_user_week ON public.weekly_reflections (user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_reactions_session ON public.reactions (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_reflection ON public.reactions (reflection_id) WHERE reflection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions (user_id);

-- 14. STORAGE BUCKET & STORAGE POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'session-files',
  'session-files',
  false,
  52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'text/plain','text/markdown','audio/mpeg','audio/ogg','audio/webm',
        'video/mp4','video/webm']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload to own path" ON storage.objects;
CREATE POLICY "Users can upload to own path" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'session-files'
  AND (storage.foldername(name))[1] IN (
    SELECT ws.id::text FROM public.workspace_members wm
    JOIN public.workspaces ws ON ws.id = wm.workspace_id
    WHERE wm.user_id = (SELECT auth.uid())
  )
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can read workspace files" ON storage.objects;
CREATE POLICY "Users can read workspace files" ON storage.objects FOR SELECT USING (
  bucket_id = 'session-files'
  AND (storage.foldername(name))[1] IN (
    SELECT ws.id::text FROM public.workspace_members wm
    JOIN public.workspaces ws ON ws.id = wm.workspace_id
    WHERE wm.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (
  bucket_id = 'session-files'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

-- 15. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

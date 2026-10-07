-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  timezone    TEXT NOT NULL DEFAULT 'UTC',
  week_start  SMALLINT NOT NULL DEFAULT 1 CHECK (week_start BETWEEN 0 AND 6), -- 0=Sun, 1=Mon
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
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

-- ============================================================
-- WORKSPACES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  invite_code  TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'), -- 12-char hex
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

-- ============================================================
-- SESSIONS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('running', 'paused', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.focus_type AS ENUM ('explore', 'learn', 'build', 'review', 'plan');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.session_source AS ENUM ('timer', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status        public.session_status NOT NULL DEFAULT 'running',
  focus_type    public.focus_type NOT NULL DEFAULT 'build',
  intent        TEXT NOT NULL DEFAULT '',
  outcome       TEXT,
  notes         TEXT,                -- Markdown
  source        public.session_source NOT NULL DEFAULT 'timer',
  project_tag   TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  total_seconds INTEGER NOT NULL DEFAULT 0,  -- Computed on stop/pause
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one running or paused session per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_user
  ON public.sessions (user_id)
  WHERE status IN ('running', 'paused');

-- ============================================================
-- SESSION SEGMENTS (pause/resume tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.session_segments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ,           -- NULL while running
  duration_s  INTEGER                -- Computed when ended
);

-- ============================================================
-- ATTACHMENTS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.attachment_kind AS ENUM ('file', 'link');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.attachments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind         public.attachment_kind NOT NULL,
  name         TEXT NOT NULL,
  url          TEXT,                    -- For links
  storage_path TEXT,                   -- For files: {workspace}/{user}/{session}/{filename}
  mime_type    TEXT,
  size_bytes   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- GOALS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.goal_type AS ENUM ('hours', 'sessions', 'outcome');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'missed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,          -- Monday (or user's week start) of the target week
  type          public.goal_type NOT NULL,
  title         TEXT NOT NULL,
  target        NUMERIC,                -- Hours or session count (NULL for outcome goals)
  current       NUMERIC NOT NULL DEFAULT 0,
  status        public.goal_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- WEEKLY REFLECTIONS
-- ============================================================
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

-- ============================================================
-- REACTIONS (on sessions or reflections)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  reflection_id UUID REFERENCES public.weekly_reflections(id) ON DELETE CASCADE,
  emoji         TEXT NOT NULL,            -- e.g., '🔥', '💪', '👀'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (session_id IS NOT NULL AND reflection_id IS NULL) OR
    (session_id IS NULL AND reflection_id IS NOT NULL)
  )
);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
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

-- Helper: check if user is in the workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
    AND user_id = (SELECT auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES ──
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
CREATE POLICY "Users can view any profile"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- ── WORKSPACES ──
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id) OR created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Workspace creator can update workspace" ON public.workspaces;
CREATE POLICY "Workspace creator can update workspace"
  ON public.workspaces FOR UPDATE
  USING (created_by = (SELECT auth.uid()));

-- ── WORKSPACE MEMBERS ──
DROP POLICY IF EXISTS "Members can view workspace membership" ON public.workspace_members;
CREATE POLICY "Members can view workspace membership"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id) OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can join a workspace" ON public.workspace_members;
CREATE POLICY "Users can join a workspace"
  ON public.workspace_members FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ── SESSIONS ──
DROP POLICY IF EXISTS "Workspace members can view sessions" ON public.sessions;
CREATE POLICY "Workspace members can view sessions"
  ON public.sessions FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ── SESSION SEGMENTS ──
DROP POLICY IF EXISTS "Workspace members can view segments" ON public.session_segments;
CREATE POLICY "Workspace members can view segments"
  ON public.session_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
      AND public.is_workspace_member(s.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Users can insert segments for own sessions" ON public.session_segments;
CREATE POLICY "Users can insert segments for own sessions"
  ON public.session_segments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update segments for own sessions" ON public.session_segments;
CREATE POLICY "Users can update segments for own sessions"
  ON public.session_segments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.user_id = (SELECT auth.uid())
    )
  );

-- ── ATTACHMENTS ──
DROP POLICY IF EXISTS "Workspace members can view attachments" ON public.attachments;
CREATE POLICY "Workspace members can view attachments"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
      AND public.is_workspace_member(s.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Users can insert own attachments" ON public.attachments;
CREATE POLICY "Users can insert own attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;
CREATE POLICY "Users can delete own attachments"
  ON public.attachments FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ── GOALS ──
DROP POLICY IF EXISTS "Workspace members can view goals" ON public.goals;
CREATE POLICY "Workspace members can view goals"
  ON public.goals FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals"
  ON public.goals FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ── WEEKLY REFLECTIONS ──
DROP POLICY IF EXISTS "Workspace members can view reflections" ON public.weekly_reflections;
CREATE POLICY "Workspace members can view reflections"
  ON public.weekly_reflections FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can insert own reflections" ON public.weekly_reflections;
CREATE POLICY "Users can insert own reflections"
  ON public.weekly_reflections FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can update own reflections" ON public.weekly_reflections;
CREATE POLICY "Users can update own reflections"
  ON public.weekly_reflections FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- ── REACTIONS ──
DROP POLICY IF EXISTS "Workspace members can view reactions" ON public.reactions;
CREATE POLICY "Workspace members can view reactions"
  ON public.reactions FOR SELECT
  USING (
    (session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.sessions s WHERE s.id = session_id AND public.is_workspace_member(s.workspace_id)
    ))
    OR
    (reflection_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.weekly_reflections r WHERE r.id = reflection_id AND public.is_workspace_member(r.workspace_id)
    ))
  );

DROP POLICY IF EXISTS "Users can insert own reactions" ON public.reactions;
CREATE POLICY "Users can insert own reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own reactions" ON public.reactions;
CREATE POLICY "Users can delete own reactions"
  ON public.reactions FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ── PUSH SUBSCRIPTIONS ──
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (user_id = (SELECT auth.uid()));

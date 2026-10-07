-- Performance indexes
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

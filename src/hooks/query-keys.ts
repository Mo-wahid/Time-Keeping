export const queryKeys = {
  activeSession: (wsId: string) => ['active-session', wsId] as const,
  sessions: (wsId: string, filters?: Record<string, unknown>) => ['sessions', wsId, filters] as const,
  todaySessions: (wsId: string) => ['sessions', wsId, { today: true }] as const,
  weekSessions: (wsId: string, weekStart: string) => ['sessions', wsId, { week: weekStart }] as const,
  goals: (wsId: string, weekStart: string) => ['goals', wsId, weekStart] as const,
  reflections: (wsId: string, weekStart: string) => ['reflections', wsId, weekStart] as const,
  members: (wsId: string) => ['workspace-members', wsId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  attachments: (sessionId: string) => ['attachments', sessionId] as const,
  reactions: (targetId: string) => ['reactions', targetId] as const,
  heatmap: (wsId: string, userId: string) => ['heatmap', wsId, userId] as const,
  focusBreakdown: (wsId: string, userId: string, period: string) => ['focus-breakdown', wsId, userId, period] as const,
};

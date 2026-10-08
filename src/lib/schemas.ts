import { z } from 'zod';

export const FOCUS_TYPES = ['explore', 'learn', 'build', 'review', 'plan'] as const;
export type FocusType = (typeof FOCUS_TYPES)[number];

export const focusTypeSchema = z.enum(FOCUS_TYPES);

// ── Session ──
export const createSessionSchema = z.object({
  workspace_id: z.string().uuid(),
  intent: z.string().min(1, 'Intent is required').max(200),
  focus_type: focusTypeSchema,
  project_tag: z.string().max(50).optional().nullable(),
});

export const stopSessionSchema = z.object({
  id: z.string().uuid(),
  outcome: z.string().max(500).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
});

export const backfillSessionSchema = z
  .object({
    workspace_id: z.string().uuid(),
    intent: z.string().min(1, 'Intent is required').max(200),
    focus_type: focusTypeSchema,
    started_at: z.string().datetime(),
    ended_at: z.string().datetime(),
    outcome: z.string().max(500).optional().nullable(),
    notes: z.string().max(10000).optional().nullable(),
    project_tag: z.string().max(50).optional().nullable(),
  })
  .refine(
    (data) => new Date(data.ended_at).getTime() > new Date(data.started_at).getTime(),
    {
      message: 'End time must be after start time',
      path: ['ended_at'],
    }
  );

// ── Goal ──
export const createGoalSchema = z.object({
  workspace_id: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  type: z.enum(['hours', 'sessions', 'outcome']),
  title: z.string().min(1, 'Goal title is required').max(200),
  target: z.number().positive().optional().nullable(),
});

// ── Reflection ──
export const upsertReflectionSchema = z.object({
  workspace_id: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  wins: z.string().max(2000).optional().nullable(),
  blockers: z.string().max(2000).optional().nullable(),
  next_week: z.string().max(2000).optional().nullable(),
});

// ── Attachment (link) ──
export const addLinkSchema = z.object({
  session_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  url: z.string().url('Must be a valid URL'),
});

// ── Profile ──
export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Name cannot be empty').max(100),
  timezone: z.string().max(50),
  week_start: z.number().int().min(0).max(6),
});

// ── Workspace ──
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(50),
});

export const joinWorkspaceSchema = z.object({
  invite_code: z.string().min(6, 'Invite code must be at least 6 characters'),
});

// ── Reaction ──
export const toggleReactionSchema = z.object({
  session_id: z.string().uuid().optional().nullable(),
  reflection_id: z.string().uuid().optional().nullable(),
  emoji: z.string().min(1).max(8),
}).refine(d => (d.session_id ? 1 : 0) + (d.reflection_id ? 1 : 0) === 1, {
  message: 'Provide exactly one of session_id or reflection_id',
});

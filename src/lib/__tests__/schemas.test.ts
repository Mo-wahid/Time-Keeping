import { describe, it, expect } from 'vitest';
import {
  createSessionSchema,
  stopSessionSchema,
  createGoalSchema,
  createWorkspaceSchema,
} from '../schemas';

describe('Zod Validation Schemas', () => {
  it('validates session creation with valid focus type', () => {
    const valid = {
      workspace_id: '123e4567-e89b-12d3-a456-426614174000',
      intent: 'Understand Postgres RLS',
      focus_type: 'explore',
      project_tag: 'backend',
    };
    expect(() => createSessionSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid focus type in session creation', () => {
    const invalid = {
      workspace_id: '123e4567-e89b-12d3-a456-426614174000',
      intent: 'Doing something',
      focus_type: 'sleeping',
    };
    expect(() => createSessionSchema.parse(invalid)).toThrow();
  });

  it('validates stop session payload with outcome and notes', () => {
    const valid = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      outcome: 'Configured row level security and verified multi-tenant isolation',
      notes: '## Notes\nTested on Supabase local instance.',
    };
    expect(() => stopSessionSchema.parse(valid)).not.toThrow();
  });

  it('validates goal creation', () => {
    const valid = {
      workspace_id: '123e4567-e89b-12d3-a456-426614174000',
      week_start: '2026-10-05',
      type: 'hours',
      title: 'Log 20 hours of focused deep work',
      target: 20,
    };
    expect(() => createGoalSchema.parse(valid)).not.toThrow();
  });

  it('validates workspace name requirement', () => {
    expect(() => createWorkspaceSchema.parse({ name: '' })).toThrow();
    expect(() => createWorkspaceSchema.parse({ name: 'Study Team' })).not.toThrow();
  });
});

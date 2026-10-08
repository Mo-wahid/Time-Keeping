import { cache } from 'react';
import { createServerSupabase } from './server';
import type { Profile, Workspace } from '../types';

export const getCurrentUser = cache(async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createServerSupabase();
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('id, full_name, avatar_url, timezone, week_start')
    .eq('id', userId)
    .maybeSingle();

  return (profile as Profile | null) || null;
});

export interface ActiveWorkspaceResult {
  workspaceId: string;
  role: 'owner' | 'member';
  workspace: {
    id: string;
    name: string;
    invite_code: string;
  } | null;
}

export const getActiveWorkspace = cache(async (userId: string): Promise<ActiveWorkspaceResult | null> => {
  const supabase = await createServerSupabase();

  // Try member query first
  const { data: memberRows }: any = await (supabase.from('workspace_members') as any)
    .select('workspace_id, role, workspaces(id, name, invite_code)')
    .eq('user_id', userId)
    .limit(1);

  if (memberRows && memberRows.length > 0) {
    const row = memberRows[0];
    return {
      workspaceId: row.workspace_id,
      role: row.role || 'member',
      workspace: row.workspaces || null,
    };
  }

  // Fallback if workspace row was directly created by user
  const { data: wsRows }: any = await (supabase.from('workspaces') as any)
    .select('id, name, invite_code')
    .eq('created_by', userId)
    .limit(1);

  if (wsRows && wsRows.length > 0) {
    const ws = wsRows[0];
    return {
      workspaceId: ws.id,
      role: 'owner',
      workspace: ws,
    };
  }

  return null;
});

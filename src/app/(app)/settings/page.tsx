import React from 'react';
import { createServerSupabase } from '@/lib/supabase/server';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile
  const { data: profile }: any = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch all workspaces user is a member of
  const { data: memberRows }: any = await supabase
    .from('workspace_members')
    .select('role, workspaces(*)')
    .eq('user_id', user.id);

  const activeWorkspace = memberRows?.[0]?.workspaces as any;
  const isOwner = memberRows?.[0]?.role === 'owner';

  return (
    <SettingsClient
      profile={profile || {
        id: user.id,
        full_name: user.email?.split('@')[0] || 'User',
        timezone: 'UTC',
        week_start: 1,
      }}
      workspace={activeWorkspace}
      isOwner={isOwner}
      userEmail={user.email || ''}
    />
  );
}

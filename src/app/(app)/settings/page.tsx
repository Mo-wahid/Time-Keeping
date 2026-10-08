import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getUserProfile, getActiveWorkspace } from '@/lib/supabase/cached';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [profile, activeWsResult] = await Promise.all([
    getUserProfile(user.id),
    getActiveWorkspace(user.id),
  ]);

  const activeWorkspace = activeWsResult?.workspace;
  const isOwner = activeWsResult?.role === 'owner';

  return (
    <SettingsClient
      profile={
        profile || {
          id: user.id,
          full_name: user.email?.split('@')[0] || 'User',
          timezone: 'UTC',
          week_start: 1,
        }
      }
      workspace={activeWorkspace}
      isOwner={isOwner}
      userEmail={user.email || ''}
    />
  );
}

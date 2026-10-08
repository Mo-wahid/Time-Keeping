import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentUser, getActiveWorkspace, getUserProfile } from '@/lib/supabase/cached';
import { TodayClient } from './today-client';
import { getWeekStartDateString } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [activeWs, profile] = await Promise.all([
    getActiveWorkspace(user.id),
    getUserProfile(user.id),
  ]);

  const workspaceId = activeWs?.workspaceId;
  if (!workspaceId) {
    redirect('/settings');
  }

  const supabase = await createServerSupabase();
  const startOfToday = startOfDay(new Date()).toISOString();
  const endOfToday = endOfDay(new Date()).toISOString();
  const weekStart = getWeekStartDateString(
    new Date(),
    profile?.week_start === 0 ? 0 : 1
  );

  // Fetch partner, today's sessions, weekly progress, and goal in parallel
  const [
    { data: otherMembers },
    { data: todaySessions },
    { data: weekSessions },
    { data: hoursGoal },
  ]: any = await Promise.all([
    supabase
      .from('workspace_members')
      .select('user_id, profiles(id, full_name, avatar_url)')
      .eq('workspace_id', workspaceId)
      .neq('user_id', user.id)
      .limit(1),
    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .gte('started_at', startOfToday)
      .lte('started_at', endOfToday)
      .order('started_at', { ascending: false }),
    supabase
      .from('sessions')
      .select('total_seconds')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .gte('started_at', `${weekStart}T00:00:00Z`),
    supabase
      .from('goals')
      .select('target')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('week_start', weekStart)
      .eq('type', 'hours')
      .maybeSingle(),
  ]);

  const userName = profile?.full_name || user.email?.split('@')[0] || 'User';

  const partnerProfile = otherMembers?.[0]?.profiles as any;
  const partnerInfo = partnerProfile
    ? {
        id: partnerProfile.id,
        name: partnerProfile.full_name || 'Partner',
        avatarUrl: partnerProfile.avatar_url,
      }
    : null;

  const weekTotalSeconds = (weekSessions || []).reduce(
    (sum: number, s: any) => sum + (s.total_seconds || 0),
    0
  );

  const weekTargetHours = hoursGoal?.target ? Number(hoursGoal.target) : 20;

  return (
    <TodayClient
      workspaceId={workspaceId}
      currentUser={{
        id: user.id,
        name: userName,
        avatarUrl: profile?.avatar_url,
      }}
      partnerInfo={partnerInfo}
      todaySessions={todaySessions || []}
      weekTotalSeconds={weekTotalSeconds}
      weekTargetHours={weekTargetHours}
    />
  );
}

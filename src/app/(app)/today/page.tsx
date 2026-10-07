import React from 'react';
import { createServerSupabase } from '@/lib/supabase/server';
import { TodayClient } from './today-client';
import { getWeekStartDateString } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Get workspace membership
  const { data: memberRows }: any = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', user.id)
    .limit(1);

  let workspace = memberRows?.[0]?.workspaces as any;
  if (!workspace) {
    const { data: wsRows }: any = await supabase
      .from('workspaces')
      .select('*')
      .eq('created_by', user.id)
      .limit(1);
    workspace = wsRows?.[0];
  }
  const workspaceId = workspace?.id;

  // 2. Get profile
  const { data: profile }: any = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userName = profile?.full_name || user.email?.split('@')[0] || 'User';

  // 3. Find partner in the workspace
  const { data: otherMembers }: any = await supabase
    .from('workspace_members')
    .select('user_id, profiles(*)')
    .eq('workspace_id', workspaceId)
    .neq('user_id', user.id)
    .limit(1);

  const partnerProfile = otherMembers?.[0]?.profiles as any;
  const partnerInfo = partnerProfile
    ? {
        id: partnerProfile.id,
        name: partnerProfile.full_name || 'Partner',
        avatarUrl: partnerProfile.avatar_url,
      }
    : null;

  // 4. Fetch today's completed sessions
  const startOfToday = startOfDay(new Date()).toISOString();
  const endOfToday = endOfDay(new Date()).toISOString();

  const { data: todaySessions }: any = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .gte('started_at', startOfToday)
    .lte('started_at', endOfToday)
    .order('started_at', { ascending: false });

  // 5. Fetch this week's completed sessions for progress ring
  const weekStart = getWeekStartDateString();
  const { data: weekSessions }: any = await supabase
    .from('sessions')
    .select('total_seconds')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .gte('started_at', `${weekStart}T00:00:00Z`);

  const weekTotalSeconds = (weekSessions || []).reduce(
    (sum: number, s: any) => sum + (s.total_seconds || 0),
    0
  );

  // 6. Fetch weekly hours goal if configured
  const { data: hoursGoal }: any = await supabase
    .from('goals')
    .select('target')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .eq('week_start', weekStart)
    .eq('type', 'hours')
    .maybeSingle();

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

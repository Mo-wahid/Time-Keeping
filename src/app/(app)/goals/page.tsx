import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentUser, getActiveWorkspace } from '@/lib/supabase/cached';
import { getWeekStartDateString } from '@/lib/utils';
import { GoalsClient } from './goals-client';
import { subWeeks, format, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const activeWs = await getActiveWorkspace(user.id);
  const workspaceId = activeWs?.workspaceId;
  if (!workspaceId) redirect('/settings');

  const supabase = await createServerSupabase();
  const currentWeekStart = getWeekStartDateString();

  // Fetch this week's sessions, goals, past streaks, and reflection in parallel
  const [
    { data: weekSessions },
    { data: rawGoals },
    { data: pastCompletedGoals },
    { data: reflection },
  ]: any = await Promise.all([
    supabase
      .from('sessions')
      .select('total_seconds')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .gte('started_at', `${currentWeekStart}T00:00:00Z`),
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('week_start', currentWeekStart)
      .order('created_at', { ascending: true }),
    supabase
      .from('goals')
      .select('week_start')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .order('week_start', { ascending: false })
      .limit(52),
    supabase
      .from('weekly_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('week_start', currentWeekStart)
      .maybeSingle(),
  ]);

  // Compute current week actuals
  const currentWeekSeconds = (weekSessions || []).reduce(
    (sum: number, s: any) => sum + (s.total_seconds || 0),
    0
  );
  const currentWeekHours = +(currentWeekSeconds / 3600).toFixed(1);
  const currentWeekSessionCount = weekSessions?.length || 0;

  // Auto-update 'hours' and 'sessions' goals based on actuals
  const goals = (rawGoals || []).map((g: any) => {
    if (g.type === 'hours') {
      return {
        ...g,
        current: currentWeekHours,
        status:
          g.target && currentWeekHours >= g.target ? 'completed' : g.status,
      };
    } else if (g.type === 'sessions') {
      return {
        ...g,
        current: currentWeekSessionCount,
        status:
          g.target && currentWeekSessionCount >= g.target
            ? 'completed'
            : g.status,
      };
    }
    return g;
  });

  // Calculate true consecutive weekly streak
  const completedWeeks = new Set((pastCompletedGoals || []).map((g: any) => g.week_start));
  let streakCount = 0;
  let checkDate = parseISO(currentWeekStart);

  // If current week has a completed goal, count it as part of streak
  if (completedWeeks.has(currentWeekStart)) {
    streakCount++;
    checkDate = subWeeks(checkDate, 1);
  } else {
    // Current week still in progress without completion; test prior week to maintain active streak
    checkDate = subWeeks(checkDate, 1);
  }

  // Iterate backwards through consecutive weeks
  while (completedWeeks.has(format(checkDate, 'yyyy-MM-dd'))) {
    streakCount++;
    checkDate = subWeeks(checkDate, 1);
  }

  return (
    <GoalsClient
      workspaceId={workspaceId}
      weekStart={currentWeekStart}
      goals={goals as any}
      streakCount={streakCount}
      currentWeekHours={currentWeekHours}
      currentWeekSessions={currentWeekSessionCount}
      initialReflection={reflection}
    />
  );
}

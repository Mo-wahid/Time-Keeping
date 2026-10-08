import React from 'react';
import { createServerSupabase } from '@/lib/supabase/server';
import { GoalCard } from '@/components/goal-card';
import { ReflectionForm } from '@/components/reflection-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getWeekStartDateString } from '@/lib/utils';
import { GoalsClient } from './goals-client';
import { Target, Flame, Trophy, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Get workspace
  const { data: memberRows }: any = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1);

  const workspaceId = memberRows?.[0]?.workspace_id;
  const currentWeekStart = getWeekStartDateString();

  // 2. Fetch this week's sessions, goals, past streaks, and reflection in parallel
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
      .order('week_start', { ascending: false }),
    supabase
      .from('weekly_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('week_start', currentWeekStart)
      .maybeSingle(),
  ]);

  const currentWeekHours = Number(
    (
      (weekSessions || []).reduce((sum: number, s: any) => sum + (s.total_seconds || 0), 0) /
      3600
    ).toFixed(1)
  );
  const currentWeekSessionCount = weekSessions?.length || 0;

  // Update computed current values for hours & sessions goals
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

  // Calculate streak (past weeks with at least one completed goal)
  const completedWeeks = new Set((pastCompletedGoals || []).map((g: any) => g.week_start));
  let streakCount = completedWeeks.has(currentWeekStart) ? 1 : 0;

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

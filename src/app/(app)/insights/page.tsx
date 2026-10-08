import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentUser, getActiveWorkspace } from '@/lib/supabase/cached';
import { CalendarHeatmap } from '@/components/calendar-heatmap';
import { FocusBreakdownChart } from '@/components/focus-breakdown-chart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FocusType } from '@/lib/types';
import { formatDurationHuman } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { BarChart3, Download, Clock, Zap, BookOpen, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const activeWs = await getActiveWorkspace(user.id);
  const workspaceId = activeWs?.workspaceId;
  if (!workspaceId) redirect('/settings');

  const supabase = await createServerSupabase();
  const ninetyDaysAgo = subDays(new Date(), 90).toISOString();

  // Narrow column selection: only fetch what's needed for metrics and charts
  const { data: sessions }: any = await supabase
    .from('sessions')
    .select('started_at, total_seconds, focus_type')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .gte('started_at', ninetyDaysAgo)
    .order('started_at', { ascending: false });

  // Build daysData map for CalendarHeatmap
  const daysData: Record<string, { totalSeconds: number; sessionCount: number }> = {};
  let totalSecondsOverall = 0;

  // Build focus breakdown data
  const focusSeconds: Record<FocusType, number> = {
    explore: 0,
    learn: 0,
    build: 0,
    review: 0,
    plan: 0,
  };

  (sessions || []).forEach((sess: any) => {
    const dayKey = format(new Date(sess.started_at), 'yyyy-MM-dd');
    if (!daysData[dayKey]) {
      daysData[dayKey] = { totalSeconds: 0, sessionCount: 0 };
    }
    daysData[dayKey].totalSeconds += sess.total_seconds || 0;
    daysData[dayKey].sessionCount += 1;

    totalSecondsOverall += sess.total_seconds || 0;

    const f = sess.focus_type as FocusType;
    if (focusSeconds[f] !== undefined) {
      focusSeconds[f] += sess.total_seconds || 0;
    }
  });

  const focusBreakdownList = (Object.keys(focusSeconds) as FocusType[]).map((f) => ({
    focusType: f,
    totalSeconds: focusSeconds[f],
  }));

  const totalSessionsCount = sessions?.length || 0;
  const avgSessionSeconds =
    totalSessionsCount > 0 ? Math.round(totalSecondsOverall / totalSessionsCount) : 0;

  // Find top focus mode
  const topFocus = (Object.entries(focusSeconds) as [FocusType, number][]).reduce(
    (max, curr) => (curr[1] > max[1] ? curr : max),
    ['build' as FocusType, 0]
  );

  return (
    <div className="space-y-6">
      {/* Header with Export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            Study & Work Insights
          </h1>
          <p className="text-xs text-muted-foreground">
            Analysis of your study habits and focus allocation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 cursor-pointer">
            <a href="/api/export?format=csv" download="sproj-sessions.csv" className="cursor-pointer">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 cursor-pointer">
            <a href="/api/export?format=json" download="sproj-sessions.json" className="cursor-pointer">
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </a>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" /> Total Time
            </p>
            <p className="text-xl font-bold font-timer tracking-tight">
              {formatDurationHuman(totalSecondsOverall)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-emerald-500" /> Total Sessions
            </p>
            <p className="text-xl font-bold font-timer tracking-tight">
              {totalSessionsCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Avg Session
            </p>
            <p className="text-xl font-bold font-timer tracking-tight">
              {formatDurationHuman(avgSessionSeconds)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-blue-500" /> Top Focus
            </p>
            <p className="text-xl font-bold capitalize tracking-tight">
              {topFocus[0]}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Heatmap (90 days) */}
      <CalendarHeatmap daysData={daysData} totalDays={84} />

      {/* Focus Breakdown Donut Chart */}
      <FocusBreakdownChart data={focusBreakdownList} />
    </div>
  );
}

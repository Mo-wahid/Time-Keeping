import React from 'react';
import { createServerSupabase } from '@/lib/supabase/server';
import { TeamBars } from '@/components/team-bars';
import { ActivityFeed, FeedItem } from '@/components/activity-feed';
import { Card, CardContent } from '@/components/ui/card';
import { getWeekStartDateString } from '@/lib/utils';
import { format, startOfWeek, addDays } from 'date-fns';
import { Users, UserPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Get workspace
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

  // 2. Get all members of the workspace
  const { data: members }: any = await supabase
    .from('workspace_members')
    .select('user_id, role, profiles(*)')
    .eq('workspace_id', workspaceId);

  const memberMap = new Map<string, { name: string; avatar?: string | null }>();
  (members || []).forEach((m: any) => {
    const prof = m.profiles;
    memberMap.set(m.user_id, {
      name: prof?.full_name || 'Member',
      avatar: prof?.avatar_url,
    });
  });

  const memberNames = Array.from(memberMap.values()).map((m) => m.name);

  // 3. Prepare side-by-side bar chart data for this week (Mon -> Sun)
  const weekStartStr = getWeekStartDateString();
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const { data: weekSessions }: any = await supabase
    .from('sessions')
    .select('user_id, total_seconds, started_at')
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .gte('started_at', `${weekStartStr}T00:00:00Z`);

  const barsData = dayNames.map((dayName, idx) => {
    const targetDate = addDays(monday, idx);
    const datePrefix = format(targetDate, 'yyyy-MM-dd');

    const entry: Record<string, any> = { day: dayName };
    memberNames.forEach((n) => {
      entry[n] = 0;
    });

    (weekSessions || []).forEach((sess: any) => {
      if (sess.started_at?.startsWith(datePrefix)) {
        const u = memberMap.get(sess.user_id);
        if (u) {
          const currentHours = (entry[u.name] as number) || 0;
          entry[u.name] = Number(
            (currentHours + (sess.total_seconds || 0) / 3600).toFixed(1)
          );
        }
      }
    });

    return entry as any;
  });

  // 4. Fetch recent sessions for activity feed (limit 25)
  const { data: feedSessions }: any = await supabase
    .from('sessions')
    .select('*, reactions(*)')
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .order('ended_at', { ascending: false })
    .limit(20);

  // 5. Fetch reflections for feed
  const { data: feedReflections }: any = await supabase
    .from('weekly_reflections')
    .select('*, reactions(*)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Format feed items
  const feedItems: FeedItem[] = [];

  (feedSessions || []).forEach((s: any) => {
    const mem = memberMap.get(s.user_id);
    const reactions = s.reactions || [];

    // Group reactions by emoji
    const reactionCounts: Record<string, { count: number; hasReacted: boolean }> = {};
    reactions.forEach((r: any) => {
      if (!reactionCounts[r.emoji]) {
        reactionCounts[r.emoji] = { count: 0, hasReacted: false };
      }
      reactionCounts[r.emoji].count++;
      if (r.user_id === user.id) {
        reactionCounts[r.emoji].hasReacted = true;
      }
    });

    feedItems.push({
      id: s.id,
      type: 'session',
      user_id: s.user_id,
      userName: mem?.name || 'Member',
      userAvatar: mem?.avatar,
      timestamp: s.ended_at || s.started_at,
      focusType: s.focus_type,
      intent: s.intent,
      outcome: s.outcome,
      durationSeconds: s.total_seconds,
      projectTag: s.project_tag,
      reactions: Object.entries(reactionCounts).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        hasReacted: data.hasReacted,
      })),
    });
  });

  (feedReflections || []).forEach((r: any) => {
    const mem = memberMap.get(r.user_id);
    const reactions = r.reactions || [];

    const reactionCounts: Record<string, { count: number; hasReacted: boolean }> = {};
    reactions.forEach((rec: any) => {
      if (!reactionCounts[rec.emoji]) {
        reactionCounts[rec.emoji] = { count: 0, hasReacted: false };
      }
      reactionCounts[rec.emoji].count++;
      if (rec.user_id === user.id) {
        reactionCounts[rec.emoji].hasReacted = true;
      }
    });

    feedItems.push({
      id: r.id,
      type: 'reflection',
      user_id: r.user_id,
      userName: mem?.name || 'Member',
      userAvatar: mem?.avatar,
      timestamp: r.created_at,
      wins: r.wins,
      blockers: r.blockers,
      nextWeek: r.next_week,
      reactions: Object.entries(reactionCounts).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        hasReacted: data.hasReacted,
      })),
    });
  });

  // Sort combined feed by timestamp DESC
  feedItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const isSolo = (members?.length || 0) <= 1;

  return (
    <div className="space-y-6">
      {/* Solo Banner if partner hasn't joined yet */}
      {isSolo && (
        <Card className="border-amber-500/30 bg-amber-500/10 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Invite your accountability partner!
                </p>
                <p className="text-xs text-muted-foreground">
                  Give them invite code{' '}
                  <strong className="font-mono text-foreground font-bold">
                    {workspace?.invite_code}
                  </strong>{' '}
                  to see each other&apos;s live status, hours, and notes.
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs shrink-0">
              <Link href="/settings">Manage Workspace</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Side-by-side weekly hours chart */}
      <TeamBars data={barsData} userNames={memberNames} />

      {/* Team Activity Feed */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-500" />
          Workspace Activity Feed
        </h2>
        <ActivityFeed items={feedItems} currentUserId={user.id} />
      </div>
    </div>
  );
}

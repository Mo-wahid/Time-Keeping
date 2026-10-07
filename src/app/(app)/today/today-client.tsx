'use client';

import React from 'react';
import { TimerCard } from '@/components/timer-card';
import { PartnerPresenceCard } from '@/components/partner-presence-card';
import { WeeklyProgressRing } from '@/components/weekly-progress-ring';
import { SessionList } from '@/components/session-list';
import { usePresence } from '@/hooks/use-presence';
import { useTimer } from '@/hooks/use-timer';
import { Session, Profile } from '@/lib/types';

interface TodayClientProps {
  workspaceId: string;
  currentUser: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  partnerInfo?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  todaySessions: Session[];
  weekTotalSeconds: number;
  weekTargetHours: number;
}

export function TodayClient({
  workspaceId,
  currentUser,
  partnerInfo,
  todaySessions,
  weekTotalSeconds,
  weekTargetHours,
}: TodayClientProps) {
  const { status, intent, focusType, elapsed } = useTimer(workspaceId);

  // My current state to broadcast via Supabase Realtime presence
  const myPresenceState = {
    user_id: currentUser.id,
    full_name: currentUser.name,
    avatar_url: currentUser.avatarUrl,
    status: (status as 'running' | 'paused') || ('idle' as const),
    intent,
    focus_type: focusType,
    elapsed_seconds: elapsed,
    segment_started_at: status === 'running' ? new Date().toISOString() : null,
    accumulated_seconds: elapsed,
  };

  const onlineUsers = usePresence(workspaceId, myPresenceState);

  // Find partner in presence list
  const partnerPresence = onlineUsers.find((u) => u.user_id !== currentUser.id) || null;

  return (
    <div className="space-y-6">
      {/* Partner Presence Live Accountability Card */}
      <PartnerPresenceCard
        partner={partnerPresence}
        partnerName={partnerInfo?.name || 'Accountability Partner'}
      />

      {/* Main Grid: Timer on left, Weekly ring on right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-2">
          <TimerCard workspaceId={workspaceId} />
        </div>
        <div className="md:col-span-1">
          <WeeklyProgressRing
            totalSeconds={weekTotalSeconds}
            targetHours={weekTargetHours}
          />
        </div>
      </div>

      {/* Today's Completed Sessions with Backfill option */}
      <SessionList
        sessions={todaySessions}
        workspaceId={workspaceId}
        title="Today's Sessions"
      />
    </div>
  );
}

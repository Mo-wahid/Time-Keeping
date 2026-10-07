'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FocusType } from '@/lib/types';

export interface PresenceUser {
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  status: 'idle' | 'running' | 'paused';
  intent?: string;
  focus_type?: FocusType;
  segment_started_at?: string | null;
  accumulated_seconds?: number;
  online_at: string;
}

export function usePresence(
  workspaceId: string,
  myState: Omit<PresenceUser, 'online_at'> | null
) {
  const supabase = createClient();
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase.channel(`workspace:${workspaceId}`, {
      config: {
        presence: {
          key: myState?.user_id || 'anonymous',
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const flattened = Object.values(state).flat();
        setUsers(flattened);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && myState) {
          await channel.track({
            ...myState,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, myState?.user_id]);

  // Update tracked state when status / intent / focus changes
  useEffect(() => {
    if (channelRef.current && myState) {
      channelRef.current.track({
        ...myState,
        online_at: new Date().toISOString(),
      });
    }
  }, [
    myState?.status,
    myState?.intent,
    myState?.focus_type,
    myState?.segment_started_at,
    myState?.accumulated_seconds,
  ]);

  return users;
}

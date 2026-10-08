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
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!workspaceId) return;

    let isMounted = true;
    isSubscribedRef.current = false;

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
        if (!isMounted) return;
        const state = channel.presenceState<PresenceUser>();
        const flattened = Object.values(state).flat();
        setUsers(flattened);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          if (myState && isMounted) {
            try {
              await channel.track({
                ...myState,
                online_at: new Date().toISOString(),
              });
            } catch (err) {
              console.debug('Initial presence track error:', err);
            }
          }
        } else {
          isSubscribedRef.current = false;
        }
      });

    return () => {
      isMounted = false;
      isSubscribedRef.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [workspaceId, myState?.user_id]);

  // Update tracked state when status / intent / focus changes
  useEffect(() => {
    if (channelRef.current && isSubscribedRef.current && myState) {
      try {
        channelRef.current
          .track({
            ...myState,
            online_at: new Date().toISOString(),
          })
          .catch((err: any) => console.debug('Presence track error:', err));
      } catch (err) {
        console.debug('Presence tracking error:', err);
      }
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

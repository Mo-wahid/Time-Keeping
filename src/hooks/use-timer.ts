'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { enqueueAction, flushOfflineQueue } from '@/lib/offline-queue';
import { FocusType } from '@/lib/types';
import { toast } from 'sonner';

export interface ActiveTimerData {
  sessionId: string;
  status: 'running' | 'paused';
  intent: string;
  focusType: FocusType;
  projectTag?: string | null;
  segmentStartedAt: string | null;
  accumulatedSeconds: number;
}

export function useTimer(
  workspaceId: string,
  options: { runTicker?: boolean } = {}
) {
  const runTicker = options.runTicker ?? true;
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active session from Supabase
  const { data: activeSession, isLoading, refetch } = useQuery<ActiveTimerData | null>({
    queryKey: queryKeys.activeSession(workspaceId),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: session }: any = await supabase
        .from('sessions')
        .select('*, session_segments(*)')
        .eq('user_id', user.id)
        .in('status', ['running', 'paused'])
        .maybeSingle();

      if (!session) return null;

      const segments = session.session_segments || [];
      const completedSegments = segments.filter((s: any) => s.ended_at);
      const accumulated = completedSegments.reduce(
        (sum: number, s: any) => sum + (s.duration_s || 0),
        0
      );
      const runningSeg = segments.find((s: any) => !s.ended_at);

      return {
        sessionId: session.id,
        status: session.status as 'running' | 'paused',
        intent: session.intent,
        focusType: session.focus_type as FocusType,
        projectTag: session.project_tag,
        segmentStartedAt: runningSeg ? runningSeg.started_at : null,
        accumulatedSeconds: accumulated,
      };
    },
    enabled: !!workspaceId,
  });

  // Client-side ticking logic
  useEffect(() => {
    if (!runTicker) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (activeSession?.status === 'running' && activeSession.segmentStartedAt) {
      const tick = () => {
        const segStartMs = new Date(activeSession.segmentStartedAt!).getTime();
        const currentSegSecs = Math.max(0, Math.floor((Date.now() - segStartMs) / 1000));
        setElapsed(activeSession.accumulatedSeconds + currentSegSecs);
      };

      tick();
      intervalRef.current = setInterval(tick, 1000);

      const handleWake = () => {
        if (!document.hidden) {
          tick();
        }
      };

      document.addEventListener('visibilitychange', handleWake);
      window.addEventListener('focus', handleWake);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        document.removeEventListener('visibilitychange', handleWake);
        window.removeEventListener('focus', handleWake);
      };
    } else if (activeSession?.status === 'paused') {
      setElapsed(activeSession.accumulatedSeconds);
    } else {
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeSession?.status, activeSession?.segmentStartedAt, activeSession?.accumulatedSeconds]);

  // Offline sync listener
  useEffect(() => {
    const handleOnline = async () => {
      const flushed = await flushOfflineQueue(async (item) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return false;

          const now = new Date(item.timestamp).toISOString();

          if (item.action === 'start') {
            const { data: session, error } = await (supabase.from('sessions') as any)
              .insert({
                user_id: user.id,
                workspace_id: item.payload.workspaceId || workspaceId,
                intent: item.payload.intent,
                focus_type: item.payload.focusType,
                project_tag: item.payload.projectTag || null,
                status: 'running',
                source: 'timer',
                started_at: item.payload.startedAt || now,
              })
              .select()
              .single();

            if (error || !session) return false;

            await (supabase.from('session_segments') as any).insert({
              session_id: session.id,
              started_at: item.payload.startedAt || now,
            });
            return true;
          }

          if (item.action === 'pause') {
            const sessionId = item.payload.sessionId;
            if (!sessionId) return true;

            const { data: seg } = await (supabase.from('session_segments') as any)
              .select('id, started_at')
              .eq('session_id', sessionId)
              .is('ended_at', null)
              .limit(1)
              .maybeSingle();

            if (seg) {
              const segStartMs = new Date(seg.started_at).getTime();
              const segSecs = Math.max(0, Math.floor((item.timestamp - segStartMs) / 1000));
              await (supabase.from('session_segments') as any)
                .update({ ended_at: now, duration_s: segSecs })
                .eq('id', seg.id);
            }

            await (supabase.from('sessions') as any)
              .update({ status: 'paused' })
              .eq('id', sessionId);
            return true;
          }

          if (item.action === 'resume') {
            const sessionId = item.payload.sessionId;
            if (!sessionId) return true;

            await (supabase.from('session_segments') as any).insert({
              session_id: sessionId,
              started_at: now,
            });

            await (supabase.from('sessions') as any)
              .update({ status: 'running' })
              .eq('id', sessionId);
            return true;
          }

          if (item.action === 'stop') {
            const sessionId = item.payload.sessionId;
            if (!sessionId) return true;

            const { data: seg } = await (supabase.from('session_segments') as any)
              .select('id, started_at')
              .eq('session_id', sessionId)
              .is('ended_at', null)
              .limit(1)
              .maybeSingle();

            if (seg) {
              const segStartMs = new Date(seg.started_at).getTime();
              const segSecs = Math.max(0, Math.floor((item.timestamp - segStartMs) / 1000));
              await (supabase.from('session_segments') as any)
                .update({ ended_at: now, duration_s: segSecs })
                .eq('id', seg.id);
            }

            const { data: allSegs } = await (supabase.from('session_segments') as any)
              .select('duration_s')
              .eq('session_id', sessionId);

            const total = (allSegs || []).reduce(
              (acc: number, s: any) => acc + (s.duration_s || 0),
              0
            );

            await (supabase.from('sessions') as any)
              .update({
                status: 'completed',
                ended_at: now,
                total_seconds: total,
                outcome: item.payload.outcome || null,
                notes: item.payload.notes || null,
              })
              .eq('id', sessionId);
            return true;
          }

          return true;
        } catch (err) {
          console.error('Error syncing offline item:', err);
          return false;
        }
      });

      if (flushed > 0) {
        toast.success(`Synced ${flushed} offline action(s)`);
        refetch();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetch, supabase, workspaceId]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activeSession(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.todaySessions(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions(workspaceId) });
  }, [queryClient, workspaceId]);

  // Start Mutation
  const startMutation = useMutation({
    mutationFn: async ({
      intent,
      focusType,
      projectTag,
    }: {
      intent: string;
      focusType: FocusType;
      projectTag?: string;
    }) => {
      if (!navigator.onLine) {
        await enqueueAction({
          action: 'start',
          payload: { workspaceId, intent, focusType, projectTag },
        });
        toast.info('Started offline. Action queued for sync.');
        return null;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date().toISOString();
      const { data: session, error }: any = await (supabase.from('sessions') as any)
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          intent,
          focus_type: focusType,
          project_tag: projectTag || null,
          status: 'running',
          source: 'timer',
          started_at: now,
        })
        .select()
        .single();

      if (error || !session) throw new Error(error?.message || 'Failed to start');

      await (supabase.from('session_segments') as any).insert({
        session_id: session.id,
        started_at: now,
      });

      return session;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Session started');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not start session');
    },
  });

  // Pause Mutation
  const pauseMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.sessionId) throw new Error('No active session');

      if (!navigator.onLine) {
        await enqueueAction({ action: 'pause', payload: { sessionId: activeSession.sessionId } });
        toast.info('Paused offline');
        return;
      }

      const now = new Date().toISOString();
      const segStartMs = activeSession.segmentStartedAt
        ? new Date(activeSession.segmentStartedAt).getTime()
        : Date.now();
      const segSecs = Math.max(0, Math.floor((Date.now() - segStartMs) / 1000));

      const { data: seg }: any = await (supabase.from('session_segments') as any)
        .select('id')
        .eq('session_id', activeSession.sessionId)
        .is('ended_at', null)
        .limit(1)
        .maybeSingle();

      if (seg) {
        await (supabase.from('session_segments') as any)
          .update({ ended_at: now, duration_s: segSecs })
          .eq('id', seg.id);
      }

      const total = activeSession.accumulatedSeconds + segSecs;
      await (supabase.from('sessions') as any)
        .update({ status: 'paused', total_seconds: total })
        .eq('id', activeSession.sessionId);
    },
    onSuccess: () => {
      invalidate();
      toast.info('Session paused');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not pause session');
    },
  });

  // Resume Mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.sessionId) throw new Error('No active session');

      if (!navigator.onLine) {
        await enqueueAction({ action: 'resume', payload: { sessionId: activeSession.sessionId } });
        toast.info('Resumed offline');
        return;
      }

      const now = new Date().toISOString();
      await (supabase.from('session_segments') as any).insert({
        session_id: activeSession.sessionId,
        started_at: now,
      });

      await (supabase.from('sessions') as any)
        .update({ status: 'running' })
        .eq('id', activeSession.sessionId);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Session resumed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not resume session');
    },
  });

  // Stop Mutation
  const stopMutation = useMutation({
    mutationFn: async ({ outcome, notes }: { outcome?: string; notes?: string }) => {
      if (!activeSession?.sessionId) throw new Error('No active session');

      if (!navigator.onLine) {
        await enqueueAction({
          action: 'stop',
          payload: { sessionId: activeSession.sessionId, outcome, notes },
        });
        toast.info('Stopped offline. Will sync when back online.');
        return;
      }

      const now = new Date().toISOString();
      let total = activeSession.accumulatedSeconds;

      if (activeSession.status === 'running' && activeSession.segmentStartedAt) {
        const segStartMs = new Date(activeSession.segmentStartedAt).getTime();
        const segSecs = Math.max(0, Math.floor((Date.now() - segStartMs) / 1000));
        total += segSecs;

        const { data: seg }: any = await (supabase.from('session_segments') as any)
          .select('id')
          .eq('session_id', activeSession.sessionId)
          .is('ended_at', null)
          .limit(1)
          .maybeSingle();

        if (seg) {
          await (supabase.from('session_segments') as any)
            .update({ ended_at: now, duration_s: segSecs })
            .eq('id', seg.id);
        }
      }

      await (supabase.from('sessions') as any)
        .update({
          status: 'completed',
          ended_at: now,
          total_seconds: total,
          outcome: outcome || null,
          notes: notes || null,
        })
        .eq('id', activeSession.sessionId);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Session completed! Great work.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not stop session');
    },
  });

  return {
    elapsed,
    status: (activeSession?.status || 'idle') as 'idle' | 'running' | 'paused',
    sessionId: activeSession?.sessionId || null,
    intent: activeSession?.intent || '',
    focusType: (activeSession?.focusType as FocusType) || 'build',
    projectTag: activeSession?.projectTag || null,
    segmentStartedAt: activeSession?.segmentStartedAt || null,
    accumulatedSeconds: activeSession?.accumulatedSeconds || 0,
    isLoading,
    isSubmitting:
      startMutation.isPending ||
      pauseMutation.isPending ||
      resumeMutation.isPending ||
      stopMutation.isPending,
    start: startMutation.mutateAsync,
    pause: pauseMutation.mutateAsync,
    resume: resumeMutation.mutateAsync,
    stop: stopMutation.mutateAsync,
  };
}

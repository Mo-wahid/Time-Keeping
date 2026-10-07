'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import {
  createSessionSchema,
  stopSessionSchema,
  backfillSessionSchema,
} from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function createSession(data: {
  workspace_id: string;
  intent: string;
  focus_type: 'explore' | 'learn' | 'build' | 'review' | 'plan';
  project_tag?: string | null;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = createSessionSchema.parse(data);

  // Check if already has an active session
  const { data: existing }: any = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['running', 'paused'])
    .maybeSingle();

  if (existing) {
    throw new Error('You already have an active session in progress');
  }

  const { data: session, error }: any = await (supabase.from('sessions') as any)
    .insert({
      user_id: user.id,
      workspace_id: parsed.workspace_id,
      intent: parsed.intent,
      focus_type: parsed.focus_type,
      project_tag: parsed.project_tag || null,
      status: 'running',
      source: 'timer',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !session) throw new Error(error?.message || 'Failed to start session');

  // Insert first segment
  await (supabase.from('session_segments') as any).insert({
    session_id: session.id,
    started_at: session.started_at,
  });

  revalidatePath('/today');
  revalidatePath('/team');
  return session;
}

export async function pauseSession(sessionId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const now = new Date().toISOString();

  // Find running segment
  const { data: segment }: any = await supabase
    .from('session_segments')
    .select('*')
    .eq('session_id', sessionId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let segDuration = 0;
  if (segment) {
    segDuration = Math.max(0, Math.floor((new Date(now).getTime() - new Date(segment.started_at).getTime()) / 1000));
    await (supabase.from('session_segments') as any)
      .update({ ended_at: now, duration_s: segDuration })
      .eq('id', segment.id);
  }

  // Get total accumulated seconds from all ended segments
  const { data: allSegments }: any = await supabase
    .from('session_segments')
    .select('duration_s')
    .eq('session_id', sessionId);

  const total = (allSegments || []).reduce((sum: number, s: any) => sum + (s.duration_s || 0), 0);

  const { data: updated, error }: any = await (supabase.from('sessions') as any)
    .update({
      status: 'paused',
      total_seconds: total,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/today');
  revalidatePath('/team');
  return updated;
}

export async function resumeSession(sessionId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const now = new Date().toISOString();

  // Create new active segment
  await (supabase.from('session_segments') as any).insert({
    session_id: sessionId,
    started_at: now,
  });

  const { data: updated, error }: any = await (supabase.from('sessions') as any)
    .update({
      status: 'running',
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/today');
  revalidatePath('/team');
  return updated;
}

export async function stopSession(data: {
  id: string;
  outcome?: string | null;
  notes?: string | null;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = stopSessionSchema.parse(data);
  const now = new Date().toISOString();

  // End active segment if running
  const { data: activeSeg }: any = await supabase
    .from('session_segments')
    .select('*')
    .eq('session_id', parsed.id)
    .is('ended_at', null)
    .limit(1)
    .maybeSingle();

  if (activeSeg) {
    const segDuration = Math.max(
      0,
      Math.floor((new Date(now).getTime() - new Date(activeSeg.started_at).getTime()) / 1000)
    );
    await (supabase.from('session_segments') as any)
      .update({ ended_at: now, duration_s: segDuration })
      .eq('id', activeSeg.id);
  }

  // Sum all segments
  const { data: allSegments }: any = await supabase
    .from('session_segments')
    .select('duration_s')
    .eq('session_id', parsed.id);

  const total = (allSegments || []).reduce((sum: number, s: any) => sum + (s.duration_s || 0), 0);

  const { data: completed, error }: any = await (supabase.from('sessions') as any)
    .update({
      status: 'completed',
      ended_at: now,
      total_seconds: total,
      outcome: parsed.outcome || null,
      notes: parsed.notes || null,
      updated_at: now,
    })
    .eq('id', parsed.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/today');
  revalidatePath('/team');
  revalidatePath('/goals');
  revalidatePath('/insights');
  return completed;
}

export async function backfillSession(data: {
  workspace_id: string;
  intent: string;
  focus_type: 'explore' | 'learn' | 'build' | 'review' | 'plan';
  started_at: string;
  ended_at: string;
  outcome?: string | null;
  notes?: string | null;
  project_tag?: string | null;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = backfillSessionSchema.parse(data);
  const startMs = new Date(parsed.started_at).getTime();
  const endMs = new Date(parsed.ended_at).getTime();
  if (endMs <= startMs) {
    throw new Error('End time must be after start time');
  }

  const durationSeconds = Math.floor((endMs - startMs) / 1000);

  const { data: session, error }: any = await (supabase.from('sessions') as any)
    .insert({
      user_id: user.id,
      workspace_id: parsed.workspace_id,
      intent: parsed.intent,
      focus_type: parsed.focus_type,
      project_tag: parsed.project_tag || null,
      outcome: parsed.outcome || null,
      notes: parsed.notes || null,
      status: 'completed',
      source: 'manual',
      started_at: parsed.started_at,
      ended_at: parsed.ended_at,
      total_seconds: durationSeconds,
    })
    .select()
    .single();

  if (error || !session) throw new Error(error?.message || 'Failed to backfill session');

  // Insert single completed segment
  await (supabase.from('session_segments') as any).insert({
    session_id: session.id,
    started_at: parsed.started_at,
    ended_at: parsed.ended_at,
    duration_s: durationSeconds,
  });

  revalidatePath('/today');
  revalidatePath('/team');
  revalidatePath('/goals');
  revalidatePath('/insights');
  return session;
}

export async function deleteSession(sessionId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/today');
  revalidatePath('/team');
  revalidatePath('/insights');
}

export async function updateSessionNotes(sessionId: string, notes: string, outcome?: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const payload: Record<string, any> = { notes, updated_at: new Date().toISOString() };
  if (outcome !== undefined) payload.outcome = outcome;

  const { data, error }: any = await (supabase.from('sessions') as any)
    .update(payload)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/session/${sessionId}`);
  return data;
}

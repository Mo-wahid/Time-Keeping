'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { createGoalSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function createGoal(data: {
  workspace_id: string;
  week_start: string;
  type: 'hours' | 'sessions' | 'outcome';
  title: string;
  target?: number | null;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = createGoalSchema.parse(data);

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      workspace_id: parsed.workspace_id,
      week_start: parsed.week_start,
      type: parsed.type,
      title: parsed.title,
      target: parsed.target ?? null,
      current: 0,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/goals');
  revalidatePath('/today');
  return goal;
}

export async function updateGoalProgress(goalId: string, current: number) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: goal, error } = await supabase
    .from('goals')
    .update({
      current,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/goals');
  return goal;
}

export async function toggleGoalStatus(goalId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: existing } = await supabase
    .from('goals')
    .select('status')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single();

  if (!existing) throw new Error('Goal not found');

  const newStatus = existing.status === 'completed' ? 'active' : 'completed';

  const { data: goal, error } = await supabase
    .from('goals')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/goals');
  return goal;
}

export async function deleteGoal(goalId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/goals');
}

'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { upsertReflectionSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function upsertReflection(data: {
  workspace_id: string;
  week_start: string;
  wins?: string | null;
  blockers?: string | null;
  next_week?: string | null;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = upsertReflectionSchema.parse(data);

  // Check if existing reflection for this week
  const { data: existing }: any = await supabase
    .from('weekly_reflections')
    .select('id')
    .eq('user_id', user.id)
    .eq('workspace_id', parsed.workspace_id)
    .eq('week_start', parsed.week_start)
    .maybeSingle();

  let result;
  if (existing) {
    const { data: updated, error }: any = await (supabase.from('weekly_reflections') as any)
      .update({
        wins: parsed.wins || null,
        blockers: parsed.blockers || null,
        next_week: parsed.next_week || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    result = updated;
  } else {
    const { data: created, error }: any = await (supabase.from('weekly_reflections') as any)
      .insert({
        user_id: user.id,
        workspace_id: parsed.workspace_id,
        week_start: parsed.week_start,
        wins: parsed.wins || null,
        blockers: parsed.blockers || null,
        next_week: parsed.next_week || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    result = created;
  }

  revalidatePath('/goals');
  revalidatePath('/team');
  return result;
}

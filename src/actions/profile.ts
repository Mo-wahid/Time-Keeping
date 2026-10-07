'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { updateProfileSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function updateProfile(data: {
  full_name: string;
  timezone: string;
  week_start: number;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = updateProfileSchema.parse(data);

  const { data: updated, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: parsed.full_name,
      timezone: parsed.timezone,
      week_start: parsed.week_start,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  revalidatePath('/today');
  return updated;
}

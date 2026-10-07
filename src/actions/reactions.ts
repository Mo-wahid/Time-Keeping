'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { toggleReactionSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function toggleReaction(data: {
  session_id?: string | null;
  reflection_id?: string | null;
  emoji: string;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = toggleReactionSchema.parse(data);

  let query = supabase
    .from('reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('emoji', parsed.emoji);

  if (parsed.session_id) {
    query = query.eq('session_id', parsed.session_id);
  } else if (parsed.reflection_id) {
    query = query.eq('reflection_id', parsed.reflection_id);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Delete reaction
    await supabase.from('reactions').delete().eq('id', existing.id);
  } else {
    // Add reaction
    await supabase.from('reactions').insert({
      user_id: user.id,
      session_id: parsed.session_id || null,
      reflection_id: parsed.reflection_id || null,
      emoji: parsed.emoji,
    });
  }

  revalidatePath('/team');
  revalidatePath('/today');
}

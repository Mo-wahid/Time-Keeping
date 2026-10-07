'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { addLinkSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function addLink(data: {
  session_id: string;
  name: string;
  url: string;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = addLinkSchema.parse(data);

  const { data: attachment, error } = await supabase
    .from('attachments')
    .insert({
      session_id: parsed.session_id,
      user_id: user.id,
      kind: 'link',
      name: parsed.name,
      url: parsed.url,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/session/${parsed.session_id}`);
  return attachment;
}

export async function recordUploadedFile(data: {
  session_id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: attachment, error } = await supabase
    .from('attachments')
    .insert({
      session_id: data.session_id,
      user_id: user.id,
      kind: 'file',
      name: data.name,
      storage_path: data.storage_path,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/session/${data.session_id}`);
  return attachment;
}

export async function deleteAttachment(attachmentId: string, sessionId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // If it's a file, we could also delete from storage bucket
  const { data: existing } = await supabase
    .from('attachments')
    .select('*')
    .eq('id', attachmentId)
    .eq('user_id', user.id)
    .single();

  if (existing?.kind === 'file' && existing.storage_path) {
    await supabase.storage.from('session-files').remove([existing.storage_path]);
  }

  const { error } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/session/${sessionId}`);
}

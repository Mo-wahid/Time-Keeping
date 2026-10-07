'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { createWorkspaceSchema, joinWorkspaceSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function createWorkspace(formData: FormData) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const rawName = formData.get('name') as string;
  const parsed = createWorkspaceSchema.parse({ name: rawName });

  const { data: workspace, error: wsError }: any = await (supabase.from('workspaces') as any)
    .insert({
      name: parsed.name,
      created_by: user.id,
    })
    .select()
    .single();

  if (wsError || !workspace) {
    throw new Error(wsError?.message || 'Failed to create workspace');
  }

  // Add creator as owner member
  const { error: memberError }: any = await (supabase.from('workspace_members') as any).insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: 'owner',
  });

  if (memberError) {
    throw new Error(memberError.message);
  }

  revalidatePath('/today');
  revalidatePath('/settings');
  return workspace;
}

export async function joinWorkspace(formData: FormData) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const rawCode = (formData.get('invite_code') as string)?.trim().toLowerCase();
  const parsed = joinWorkspaceSchema.parse({ invite_code: rawCode });

  // Find workspace by invite code
  const { data: workspace, error: findError }: any = await supabase
    .from('workspaces')
    .select('*')
    .eq('invite_code', parsed.invite_code)
    .single();

  if (findError || !workspace) {
    throw new Error('Workspace not found with this invite code');
  }

  // Insert membership
  const { error: joinError }: any = await (supabase.from('workspace_members') as any).insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: 'member',
  });

  if (joinError) {
    if (!joinError.message.includes('duplicate')) {
      throw new Error(joinError.message);
    }
  }

  revalidatePath('/today');
  revalidatePath('/team');
  revalidatePath('/settings');
  return workspace;
}

export async function regenerateInviteCode(workspaceId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Generate random 12-char hex string
  const newCode = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  const { data, error }: any = await (supabase.from('workspaces') as any)
    .update({ invite_code: newCode })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/settings');
  return data;
}

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { SessionDetailClient } from './session-detail-client';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch session with segments and attachments
  const { data: session, error }: any = await supabase
    .from('sessions')
    .select('*, attachments(*), session_segments(*)')
    .eq('id', id)
    .single();

  if (error || !session) {
    notFound();
  }

  // Generate signed URLs for private file attachments
  const attachmentsWithUrls = await Promise.all(
    (session.attachments || []).map(async (att: any) => {
      if (att.kind === 'file' && att.storage_path) {
        const { data } = await supabase.storage
          .from('session-files')
          .createSignedUrl(att.storage_path, 3600); // 1 hour validity
        return {
          ...att,
          signedUrl: data?.signedUrl || null,
        };
      }
      return att;
    })
  );

  return (
    <SessionDetailClient
      session={{
        ...session,
        attachments: attachmentsWithUrls,
      }}
      isOwner={session.user_id === user.id}
    />
  );
}

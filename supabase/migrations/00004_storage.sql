-- Create private storage bucket for session attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'session-files',
  'session-files',
  false,
  52428800,  -- 50MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'text/plain','text/markdown','audio/mpeg','audio/ogg','audio/webm',
        'video/mp4','video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can CRUD their own path, workspace members can read
DROP POLICY IF EXISTS "Users can upload to own path" ON storage.objects;
CREATE POLICY "Users can upload to own path"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'session-files'
    AND (storage.foldername(name))[1] IN (
      SELECT ws.id::text FROM public.workspace_members wm
      JOIN public.workspaces ws ON ws.id = wm.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can read workspace files" ON storage.objects;
CREATE POLICY "Users can read workspace files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'session-files'
    AND (storage.foldername(name))[1] IN (
      SELECT ws.id::text FROM public.workspace_members wm
      JOIN public.workspaces ws ON ws.id = wm.workspace_id
      WHERE wm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'session-files'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

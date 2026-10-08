'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { recordUploadedFile } from '@/actions/attachments';
import { Button } from '@/components/ui/button';
import { Loader2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  sessionId: string;
  workspaceId: string;
}

export function FileUpload({ sessionId, workspaceId }: FileUploadProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds 50MB limit. Consider sharing a cloud link instead.');
      return;
    }

    try {
      setIsUploading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `${workspaceId}/${user.id}/${sessionId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('session-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Record attachment row
      await recordUploadedFile({
        session_id: sessionId,
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
      });

      toast.success(`Uploaded ${file.name}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        aria-label="Upload file attachment"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="h-8 text-xs gap-1.5 border-dashed cursor-pointer"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Paperclip className="h-3.5 w-3.5" />
            Upload File
          </>
        )}
      </Button>
    </div>
  );
}

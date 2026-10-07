'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addLink } from '@/actions/attachments';
import { Link2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface LinkPasteInputProps {
  sessionId: string;
}

export function LinkPasteInput({ sessionId }: LinkPasteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      setIsSubmitting(true);
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const defaultName = name.trim() || new URL(formattedUrl).hostname;

      await addLink({
        session_id: sessionId,
        name: defaultName,
        url: formattedUrl,
      });

      toast.success('Link attached to session');
      setUrl('');
      setName('');
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to attach link');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 text-xs gap-1.5 border-dashed"
      >
        <Link2 className="h-3.5 w-3.5" />
        Paste Link (Loom / Drive / Docs)
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-lg border border-border bg-card/60"
    >
      <Input
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-8 text-xs flex-1"
        required
        autoFocus
      />
      <Input
        placeholder="Link title (e.g. Loom Walkthrough)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 text-xs sm:w-48"
      />
      <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 text-xs px-2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !url.trim()}
          className="h-8 text-xs px-3"
        >
          Attach
        </Button>
      </div>
    </form>
  );
}

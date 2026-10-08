'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/file-upload';
import { LinkPasteInput } from '@/components/link-paste-input';
import { FOCUS_TYPE_CONFIG } from '@/lib/constants';
import { formatDuration, formatDurationHuman, formatDate } from '@/lib/utils';
import { updateSessionNotes, deleteSession } from '@/actions/sessions';
import { deleteAttachment } from '@/actions/attachments';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  Paperclip,
  ExternalLink,
  Trash2,
  Save,
  CheckCircle2,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface SessionDetailClientProps {
  session: any;
  isOwner: boolean;
}

export function SessionDetailClient({ session, isOwner }: SessionDetailClientProps) {
  const router = useRouter();
  const [outcome, setOutcome] = useState(session.outcome || '');
  const [notes, setNotes] = useState(session.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const focus = FOCUS_TYPE_CONFIG[session.focus_type as keyof typeof FOCUS_TYPE_CONFIG] || FOCUS_TYPE_CONFIG.build;

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);
      await updateSessionNotes(session.id, notes, outcome);
      toast.success('Session notes updated');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      setIsDeleting(true);
      await deleteSession(session.id);
      toast.success('Session deleted');
      router.push('/today');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete session');
      setIsDeleting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId, session.id);
      toast.success('Attachment removed');
      router.refresh();
    } catch (err: any) {
      toast.error('Failed to remove attachment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs cursor-pointer">
          <Link href="/today">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Today
          </Link>
        </Button>

        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteSession}
            disabled={isDeleting}
            className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete Session
          </Button>
        )}
      </div>

      {/* Main Session Overview Card */}
      <Card className="border-border bg-card/80 backdrop-blur-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${focus.badgeBg} ${focus.badgeText} ${focus.borderColor} text-xs`}
              >
                {focus.label}
              </Badge>
              {session.project_tag && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  <Tag className="h-3 w-3" />
                  {session.project_tag}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground font-timer">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(session.started_at, 'MMM d, yyyy h:mm a')}
              </span>
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                {formatDurationHuman(session.total_seconds)}
              </span>
            </div>
          </div>

          <CardTitle className="text-xl font-bold mt-2">
            &ldquo;{session.intent}&rdquo;
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Outcome field */}
          <div className="space-y-1.5">
            <Label htmlFor="session-outcome" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Outcome / Key Result
            </Label>
            {isOwner ? (
              <Input
                id="session-outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What did you figure out or ship?"
                className="text-sm font-medium"
              />
            ) : (
              <p className="text-sm text-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                {session.outcome || 'No outcome recorded.'}
              </p>
            )}
          </div>

          {/* Notes field */}
          <div className="space-y-1.5">
            <Label htmlFor="session-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Session Notes (Markdown)
            </Label>
            {isOwner ? (
              <Textarea
                id="session-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write any key takeaways, snippets, or next steps here..."
                rows={6}
                className="font-mono text-xs leading-relaxed"
              />
            ) : (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-xs font-mono whitespace-pre-wrap">
                {session.notes || 'No notes added for this session.'}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments & Artifacts Card */}
      <Card className="border-border bg-card/80 backdrop-blur-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-emerald-500" />
              Attachments & Links
            </CardTitle>
            <CardDescription className="text-xs">
              Screenshots, docs, and links to Loom/Zoom/Drive
            </CardDescription>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <FileUpload sessionId={session.id} workspaceId={session.workspace_id} />
              <LinkPasteInput sessionId={session.id} />
            </div>
          )}
        </CardHeader>

        <CardContent>
          {(session.attachments || []).length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
              No files or links attached yet. Upload a screenshot or paste a link to share proof of work!
            </div>
          ) : (
            <div className="space-y-2">
              {(session.attachments || []).map((att: any) => {
                const isLink = att.kind === 'link';
                const href = isLink ? att.url : att.signedUrl;

                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                        {isLink ? <ExternalLink className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <a
                          href={href || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-foreground hover:underline truncate block cursor-pointer"
                        >
                          {att.name}
                        </a>
                        <span className="text-[10px] text-muted-foreground">
                          {isLink ? att.url : `${(att.size_bytes ? (att.size_bytes / 1024).toFixed(0) : '0')} KB`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {href && (
                        <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer">
                          <a href={href} target="_blank" rel="noreferrer" download={!isLink}>
                            {isLink ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                          </a>
                        </Button>
                      )}

                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="h-7 w-7 text-muted-foreground/40 hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

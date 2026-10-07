'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Session, FocusType } from '@/lib/types';
import { FOCUS_TYPE_CONFIG, FOCUS_TYPES } from '@/lib/constants';
import { formatDuration, formatDurationHuman, formatDate } from '@/lib/utils';
import { backfillSession } from '@/actions/sessions';
import {
  Clock,
  Plus,
  FileText,
  Paperclip,
  CheckCircle2,
  ChevronRight,
  Tag,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface SessionListProps {
  sessions: Session[];
  workspaceId: string;
  title?: string;
}

export function SessionList({
  sessions,
  workspaceId,
  title = "Today's Sessions",
}: SessionListProps) {
  const router = useRouter();
  const [isBackfillOpen, setIsBackfillOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backfill form state
  const [intent, setIntent] = useState('');
  const [focusType, setFocusType] = useState<FocusType>('build');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [projectTag, setProjectTag] = useState('');

  const handleBackfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;

    try {
      setIsSubmitting(true);
      const startedAt = new Date(`${date}T${startTime}:00`).toISOString();
      const endedAt = new Date(`${date}T${endTime}:00`).toISOString();

      await backfillSession({
        workspace_id: workspaceId,
        intent: intent.trim(),
        focus_type: focusType,
        started_at: startedAt,
        ended_at: endedAt,
        outcome: outcome.trim() || undefined,
        notes: notes.trim() || undefined,
        project_tag: projectTag.trim() || undefined,
      });

      toast.success('Past session backfilled successfully');
      router.refresh();
      setIsBackfillOpen(false);
      setIntent('');
      setOutcome('');
      setNotes('');
      setProjectTag('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to backfill session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {title}
          <span className="text-xs font-normal text-muted-foreground">
            ({sessions.length})
          </span>
        </h2>

        {/* Backfill Dialog */}
        <Dialog open={isBackfillOpen} onOpenChange={setIsBackfillOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
              Log Past Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Backfill Session</DialogTitle>
              <DialogDescription>
                Manually record a session that happened offline or without a timer.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBackfillSubmit} className="space-y-3.5 py-2">
              <div className="space-y-1">
                <Label htmlFor="bf-intent" className="text-xs">
                  Intent / What did you work on?
                </Label>
                <Input
                  id="bf-intent"
                  placeholder="e.g. Read Next.js 15 caching docs"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  required
                />
              </div>

              {/* Focus type */}
              <div className="space-y-1">
                <Label className="text-xs">Focus Type</Label>
                <div className="grid grid-cols-5 gap-1">
                  {FOCUS_TYPES.map((t) => {
                    const cfg = FOCUS_TYPE_CONFIG[t];
                    const sel = focusType === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setFocusType(t)}
                        className={`p-1.5 rounded text-xs text-center border transition-all cursor-pointer ${
                          sel
                            ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.borderColor} font-semibold ring-1 ring-primary/20`
                            : 'border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & times */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="bf-date" className="text-xs">
                    Date
                  </Label>
                  <Input
                    id="bf-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bf-start" className="text-xs">
                    Start Time
                  </Label>
                  <Input
                    id="bf-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bf-end" className="text-xs">
                    End Time
                  </Label>
                  <Input
                    id="bf-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tag */}
              <div className="space-y-1">
                <Label htmlFor="bf-tag" className="text-xs">
                  Project Tag (optional)
                </Label>
                <Input
                  id="bf-tag"
                  placeholder="e.g. Frontend, Auth, ML"
                  value={projectTag}
                  onChange={(e) => setProjectTag(e.target.value)}
                />
              </div>

              {/* Outcome */}
              <div className="space-y-1">
                <Label htmlFor="bf-outcome" className="text-xs">
                  Outcome note
                </Label>
                <Input
                  id="bf-outcome"
                  placeholder="Key takeaway or result"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBackfillOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !intent.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Save Log
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-card/30">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No completed sessions yet today. Hit &ldquo;Start Timer&rdquo; to begin your first focus block!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const focus = FOCUS_TYPE_CONFIG[session.focus_type] || FOCUS_TYPE_CONFIG.build;
            return (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="block group cursor-pointer"
              >
                <Card className="border-border/70 hover:border-primary/50 transition-all hover:bg-muted/40 cursor-pointer shadow-2xs hover:shadow-xs">
                  <CardContent className="p-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${focus.badgeBg} ${focus.badgeText} ${focus.borderColor}`}
                        >
                          {focus.label}
                        </Badge>

                        {session.project_tag && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            <Tag className="h-2.5 w-2.5" />
                            {session.project_tag}
                          </span>
                        )}

                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(session.started_at, 'h:mm a')}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {session.intent}
                      </p>

                      {session.outcome && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>{session.outcome}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-right">
                      <div className="space-y-0.5">
                        <span className="font-timer text-sm font-semibold text-foreground">
                          {formatDurationHuman(session.total_seconds)}
                        </span>
                        {session.notes && (
                          <div className="flex justify-end text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

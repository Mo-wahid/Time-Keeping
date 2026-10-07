'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTimer } from '@/hooks/use-timer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FOCUS_TYPE_CONFIG, FOCUS_TYPES } from '@/lib/constants';
import { FocusType } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import { Play, Pause, Square, Sparkles, Tag, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TimerCardProps {
  workspaceId: string;
}

export function TimerCard({ workspaceId }: TimerCardProps) {
  const router = useRouter();
  const {
    elapsed,
    status,
    intent: activeIntent,
    focusType: activeFocusType,
    projectTag: activeProjectTag,
    isLoading,
    isSubmitting,
    start,
    pause,
    resume,
    stop,
  } = useTimer(workspaceId);

  // Form states for Idle mode
  const [intent, setIntent] = useState('');
  const [focusType, setFocusType] = useState<FocusType>('build');
  const [projectTag, setProjectTag] = useState('');

  // Stop Dialog states
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;
    await start({
      intent: intent.trim(),
      focusType,
      projectTag: projectTag.trim() || undefined,
    });
    setIntent('');
    setProjectTag('');
  };

  const handleOpenStop = () => {
    setIsStopDialogOpen(true);
  };

  const handleFinishStop = async () => {
    await stop({
      outcome: outcome.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsStopDialogOpen(false);
    setOutcome('');
    setNotes('');
    router.refresh();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  const currentFocus = FOCUS_TYPE_CONFIG[activeFocusType || focusType];

  return (
    <>
      <Card className="border-border bg-card/80 backdrop-blur-sm relative overflow-hidden transition-all shadow-sm">
        {/* Top colored indicator bar for running/paused */}
        {status === 'running' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse" />
        )}
        {status === 'paused' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        )}

        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Focus Session
            </span>
            {status === 'running' && (
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live
              </span>
            )}
            {status === 'paused' && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Paused
              </span>
            )}
          </div>

          {status !== 'idle' && (
            <Badge
              variant="outline"
              className={`${currentFocus.badgeBg} ${currentFocus.badgeText} ${currentFocus.borderColor} border font-medium text-xs`}
            >
              {currentFocus.label}
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          {status === 'idle' ? (
            /* IDLE FORM */
            <form onSubmit={handleStart} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="intent" className="text-sm font-medium">
                  What are you trying to figure out?
                </Label>
                <div className="relative">
                  <Input
                    id="intent"
                    placeholder="e.g. Understand Postgres RLS policies, Build auth flow..."
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    required
                    className="text-base py-5 placeholder:text-muted-foreground/60"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Focus Type Selection Chips */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Focus Type</Label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {FOCUS_TYPES.map((type) => {
                    const cfg = FOCUS_TYPE_CONFIG[type];
                    const isSelected = focusType === type;
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setFocusType(type)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.borderColor} ring-2 ring-primary/20 font-semibold shadow-xs`
                            : 'border-border/60 text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:border-border'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Project Tag (optional) */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Project / Topic tag (optional)"
                    value={projectTag}
                    onChange={(e) => setProjectTag(e.target.value)}
                    className="pl-8 text-xs h-8"
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!intent.trim() || isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 h-8 gap-1.5 text-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Timer
                </Button>
              </div>
            </form>
          ) : (
            /* RUNNING / PAUSED ACTIVE DISPLAY */
            <div className="space-y-6">
              {/* Large Elapsed Timer */}
              <div className="text-center py-2">
                <div className="font-timer text-5xl sm:text-6xl tracking-tight font-semibold text-foreground select-none">
                  {formatDuration(elapsed)}
                </div>
                <p className="text-sm font-medium text-foreground/90 mt-2 line-clamp-2">
                  &ldquo;{activeIntent}&rdquo;
                </p>
                {activeProjectTag && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1 bg-muted px-2 py-0.5 rounded-md">
                    <Tag className="h-3 w-3" />
                    {activeProjectTag}
                  </span>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-center gap-3">
                {status === 'running' ? (
                  <Button
                    onClick={() => pause()}
                    variant="outline"
                    size="lg"
                    disabled={isSubmitting}
                    className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 min-w-[120px]"
                  >
                    <Pause className="h-4 w-4 fill-current" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={() => resume()}
                    size="lg"
                    disabled={isSubmitting}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Resume
                  </Button>
                )}

                <Button
                  onClick={handleOpenStop}
                  variant="destructive"
                  size="lg"
                  disabled={isSubmitting}
                  className="gap-2 min-w-[120px]"
                >
                  <Square className="h-4 w-4 fill-current" />
                  Finish
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stop / Completion Dialog */}
      <Dialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Session Wrap-up
              </span>
            </div>
            <DialogTitle className="text-xl">What was the outcome?</DialogTitle>
            <DialogDescription>
              Time logged: <strong className="text-foreground">{formatDuration(elapsed)}</strong> on &ldquo;{activeIntent}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="outcome" className="text-sm">
                Key takeaway / outcome note
              </Label>
              <Textarea
                id="outcome"
                placeholder="e.g. Learned RLS using auth.uid() function; fixed issue with workspace member policies."
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={3}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs text-muted-foreground">
                Additional markdown notes or code snippets (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Markdown notes, links, or ideas to remember next time..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsStopDialogOpen(false)}
              disabled={isSubmitting}
            >
              Keep Timing
            </Button>
            <Button
              onClick={handleFinishStop}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Complete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

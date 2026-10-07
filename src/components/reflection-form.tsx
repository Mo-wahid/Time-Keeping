'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WeeklyReflection } from '@/lib/types';
import { upsertReflection } from '@/actions/reflections';
import { Sparkles, Trophy, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ReflectionFormProps {
  workspaceId: string;
  weekStart: string;
  initialReflection?: WeeklyReflection | null;
}

export function ReflectionForm({
  workspaceId,
  weekStart,
  initialReflection,
}: ReflectionFormProps) {
  const [wins, setWins] = useState(initialReflection?.wins || '');
  const [blockers, setBlockers] = useState(initialReflection?.blockers || '');
  const [nextWeek, setNextWeek] = useState(initialReflection?.next_week || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await upsertReflection({
        workspace_id: workspaceId,
        week_start: weekStart,
        wins: wins.trim() || undefined,
        blockers: blockers.trim() || undefined,
        next_week: nextWeek.trim() || undefined,
      });
      toast.success('Friday reflection shared with your partner!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save reflection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-semibold">Friday Reflection</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Take 5 minutes to celebrate wins, acknowledge hurdles, and tee up next week with your accountability partner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rf-wins" className="text-xs flex items-center gap-1.5 font-medium text-emerald-500">
              <Trophy className="h-3.5 w-3.5" />
              Wins & Breakthroughs
            </Label>
            <Textarea
              id="rf-wins"
              placeholder="What went well? What did you build or finally grasp?"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rf-blockers" className="text-xs flex items-center gap-1.5 font-medium text-rose-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              Blockers & Frustrations
            </Label>
            <Textarea
              id="rf-blockers"
              placeholder="What slowed you down? What was harder than expected?"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rf-next" className="text-xs flex items-center gap-1.5 font-medium text-blue-500">
              <ArrowRight className="h-3.5 w-3.5" />
              Focus for Next Week
            </Label>
            <Textarea
              id="rf-next"
              placeholder="Top 1-2 priorities to hit next Monday..."
              value={nextWeek}
              onChange={(e) => setNextWeek(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground text-xs h-8 gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Save Reflection
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Goal } from '@/lib/types';
import { toggleGoalStatus, deleteGoal } from '@/actions/goals';
import { CheckCircle2, Circle, Flame, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface GoalCardProps {
  goal: Goal;
  streakCount?: number;
}

export const GoalCard = memo(function GoalCard({ goal, streakCount }: GoalCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const isCompleted = goal.status === 'completed';

  const handleToggle = async () => {
    try {
      await toggleGoalStatus(goal.id);
      toast.success(isCompleted ? 'Goal marked active' : 'Goal completed! Nice work!');
      router.refresh();
    } catch (err: any) {
      toast.error('Failed to update goal');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      setIsDeleting(true);
      await deleteGoal(goal.id);
      toast.success('Goal removed');
      router.refresh();
    } catch (err: any) {
      toast.error('Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate percentage
  let progressPct = 0;
  if (goal.type === 'outcome') {
    progressPct = isCompleted ? 100 : 0;
  } else if (goal.target && goal.target > 0) {
    progressPct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  }

  return (
    <Card
      className={`border transition-all ${
        isCompleted
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : 'bg-card/70 border-border/70 hover:border-border'
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            {/* Toggle Status Checkbox Button */}
            <button
              onClick={handleToggle}
              role="checkbox"
              aria-checked={isCompleted}
              aria-label={isCompleted ? `Mark ${goal.title} active` : `Mark ${goal.title} completed`}
              className="mt-0.5 text-muted-foreground hover:text-emerald-500 shrink-0 transition-all hover:scale-110 cursor-pointer p-0.5 rounded"
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/60 hover:text-foreground" />
              )}
            </button>

            <div className="min-w-0">
              <h4
                className={`text-sm font-semibold truncate ${
                  isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}
              >
                {goal.title}
              </h4>

              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                  {goal.type}
                </Badge>

                {streakCount !== undefined && streakCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                    <Flame className="h-3 w-3 fill-amber-500" />
                    {streakCount}w streak
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete ${goal.title}`}
            className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Progress Bar for Hours & Sessions types */}
        {goal.type !== 'outcome' && goal.target && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-muted-foreground font-timer">
              <span>
                {goal.current} {goal.type === 'hours' ? 'hrs' : 'sessions'}
              </span>
              <span>
                {goal.target} {goal.type === 'hours' ? 'hrs target' : 'sessions target'}
              </span>
            </div>
            <Progress
              value={progressPct}
              className={`h-2 ${isCompleted ? '[&>div]:bg-emerald-500' : ''}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

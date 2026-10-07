'use client';

import React, { useState } from 'react';
import { GoalCard } from '@/components/goal-card';
import { ReflectionForm } from '@/components/reflection-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Goal, WeeklyReflection, GoalType } from '@/lib/types';
import { createGoal } from '@/actions/goals';
import { Target, Plus, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface GoalsClientProps {
  workspaceId: string;
  weekStart: string;
  goals: Goal[];
  streakCount: number;
  currentWeekHours: number;
  currentWeekSessions: number;
  initialReflection: WeeklyReflection | null;
}

export function GoalsClient({
  workspaceId,
  weekStart,
  goals,
  streakCount,
  currentWeekHours,
  currentWeekSessions,
  initialReflection,
}: GoalsClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [goalType, setGoalType] = useState<GoalType>('outcome');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<number | ''>(20);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await createGoal({
        workspace_id: workspaceId,
        week_start: weekStart,
        type: goalType,
        title: title.trim(),
        target: goalType === 'outcome' ? undefined : Number(target) || undefined,
      });

      toast.success('Weekly goal added!');
      setIsAddOpen(false);
      setTitle('');
      setTarget(20);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedGoals = goals.filter((g) => g.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Streak & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame className="h-5 w-5 fill-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold font-timer tracking-tight">
                {streakCount} {streakCount === 1 ? 'Week' : 'Weeks'}
              </p>
              <p className="text-xs text-muted-foreground">Accountability Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-timer tracking-tight">
                {completedGoals} / {goals.length}
              </p>
              <p className="text-xs text-muted-foreground">Completed Goals</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-timer tracking-tight">
                {currentWeekHours}h / {currentWeekSessions} sessions
              </p>
              <p className="text-xs text-muted-foreground">Logged This Week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" />
            This Week&apos;s Targets
          </h2>

          {/* Add Goal Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                <Plus className="h-3.5 w-3.5" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>Set a Weekly Goal</DialogTitle>
                <DialogDescription>
                  Choose between outcome goals or numerical hours/session targets.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddGoal} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Goal Category</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['outcome', 'hours', 'sessions'] as GoalType[]).map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setGoalType(type)}
                        className={`p-2 rounded-lg text-xs font-medium border capitalize text-center transition-all cursor-pointer ${
                          goalType === type
                            ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                            : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-foreground/30'
                        }`}
                      >
                        {type === 'outcome' ? 'Outcome' : `${type} Target`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="goal-title" className="text-xs">
                    Goal Description
                  </Label>
                  <Input
                    id="goal-title"
                    placeholder={
                      goalType === 'outcome'
                        ? 'e.g. Finish the auth tutorial and deploy to Vercel'
                        : goalType === 'hours'
                        ? 'e.g. Log 20 hours of focused deep work'
                        : 'e.g. Complete 15 study sessions'
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {goalType !== 'outcome' && (
                  <div className="space-y-1">
                    <Label htmlFor="goal-target" className="text-xs">
                      Target {goalType === 'hours' ? 'Hours' : 'Sessions'}
                    </Label>
                    <Input
                      id="goal-target"
                      type="number"
                      min="1"
                      step={goalType === 'hours' ? '0.5' : '1'}
                      value={target}
                      onChange={(e) => setTarget(e.target.value ? Number(e.target.value) : '')}
                      required
                    />
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Save Goal
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {goals.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-card/30">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              No goals set for this week yet. Set an hour target or outcome checklist item to keep each other on track!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} streakCount={streakCount} />
            ))}
          </div>
        )}
      </div>

      {/* Friday Reflection Form */}
      <div className="pt-2">
        <ReflectionForm
          workspaceId={workspaceId}
          weekStart={weekStart}
          initialReflection={initialReflection}
        />
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { eachDayOfInterval, subDays, format, isSameDay } from 'date-fns';
import { Calendar, Flame } from 'lucide-react';

interface HeatmapDay {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  sessionCount: number;
}

interface CalendarHeatmapProps {
  daysData: Record<string, { totalSeconds: number; sessionCount: number }>;
  totalDays?: number;
}

export function CalendarHeatmap({
  daysData,
  totalDays = 84, // 12 weeks
}: CalendarHeatmapProps) {
  const today = new Date();
  const startDate = subDays(today, totalDays - 1);
  const allDays = eachDayOfInterval({ start: startDate, end: today });

  // Calculate stats
  let totalHours = 0;
  let activeDays = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  allDays.forEach((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const data = daysData[key];
    const hours = (data?.totalSeconds || 0) / 3600;
    totalHours += hours;

    if (hours > 0) {
      activeDays++;
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });

  // Calculate current streak from today backwards
  for (let i = allDays.length - 1; i >= 0; i--) {
    const key = format(allDays[i], 'yyyy-MM-dd');
    if ((daysData[key]?.totalSeconds || 0) > 0) {
      currentStreak++;
    } else if (i === allDays.length - 1) {
      // today could be 0 so far, check yesterday
      continue;
    } else {
      break;
    }
  }

  const getColorClass = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'bg-muted/40 border-border/40';
    const hours = seconds / 3600;
    if (hours < 1) return 'bg-emerald-900/60 border-emerald-800';
    if (hours < 2) return 'bg-emerald-700 border-emerald-600';
    if (hours < 4) return 'bg-emerald-500 border-emerald-400';
    return 'bg-emerald-400 border-emerald-300';
  };

  return (
    <TooltipProvider>
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" />
                Consistency Heatmap
              </CardTitle>
              <CardDescription className="text-xs">
                Your study & work volume across the past 12 weeks
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <Flame className="h-3.5 w-3.5 fill-amber-500" />
                {currentStreak} day streak
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{totalHours.toFixed(1)}h</strong> total
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 p-1">
              {allDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const data = daysData[key];
                const hours = ((data?.totalSeconds || 0) / 3600).toFixed(1);
                const count = data?.sessionCount || 0;

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-3.5 w-3.5 rounded-xs border transition-transform hover:scale-125 cursor-pointer ${getColorClass(
                          data?.totalSeconds || 0
                        )}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs p-2">
                      <p className="font-semibold">{format(day, 'EEE, MMM d, yyyy')}</p>
                      <p className="text-muted-foreground">
                        {count > 0 ? `${hours} hrs across ${count} session(s)` : 'No sessions recorded'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/50">
            <span>{activeDays} active days logged</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-xs bg-muted/40 border border-border/40" />
              <div className="h-2.5 w-2.5 rounded-xs bg-emerald-900/60" />
              <div className="h-2.5 w-2.5 rounded-xs bg-emerald-700" />
              <div className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
              <div className="h-2.5 w-2.5 rounded-xs bg-emerald-400" />
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDurationHuman } from '@/lib/utils';
import { Target, TrendingUp } from 'lucide-react';

interface WeeklyProgressRingProps {
  totalSeconds: number;
  targetHours?: number;
}

export function WeeklyProgressRing({
  totalSeconds,
  targetHours = 20, // default 20 hrs target
}: WeeklyProgressRingProps) {
  const targetSeconds = targetHours * 3600;
  const percentage = Math.min(100, Math.round((totalSeconds / targetSeconds) * 100));
  const totalHours = (totalSeconds / 3600).toFixed(1);

  // SVG ring calculations
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span>Weekly Target</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-timer tracking-tight text-foreground">
              {totalHours}h
            </span>
            <span className="text-xs text-muted-foreground">/ {targetHours}h</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {percentage >= 100 ? (
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Target achieved!
              </span>
            ) : (
              `${(targetHours - Number(totalHours)).toFixed(1)}h remaining this week`
            )}
          </p>
        </div>

        {/* Circular SVG Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/40"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-emerald-500 transition-all duration-700 ease-out"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold font-timer leading-none text-foreground">
              {percentage}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { FOCUS_TYPE_CONFIG } from '@/lib/constants';
import { FocusType } from '@/lib/types';
import { PieChart as PieIcon } from 'lucide-react';

interface FocusBreakdownData {
  focusType: FocusType;
  totalSeconds: number;
}

interface FocusBreakdownChartProps {
  data: FocusBreakdownData[];
}

export function FocusBreakdownChart({ data }: FocusBreakdownChartProps) {
  const chartData = data
    .filter((d) => d.totalSeconds > 0)
    .map((d) => ({
      name: FOCUS_TYPE_CONFIG[d.focusType]?.label || d.focusType,
      value: Number((d.totalSeconds / 3600).toFixed(1)),
      color: FOCUS_TYPE_CONFIG[d.focusType]?.color || '#888888',
      focusType: d.focusType,
    }));

  const totalHours = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary" />
            Focus Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Distribution of study and work modes
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
          No focus data recorded yet for this period
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Focus Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of study and work modes
            </CardDescription>
          </div>
          <span className="text-xs font-semibold font-timer text-foreground">
            {totalHours.toFixed(1)}h total
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name || entry.focusType} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const pct = totalHours > 0 ? Math.round((item.value / totalHours) * 100) : 0;
                    return (
                      <div className="rounded-lg border border-border bg-background p-2 shadow-md text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </span>
                        <p className="text-muted-foreground mt-0.5">
                          {item.value} hrs ({pct}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
                layout="horizontal"
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

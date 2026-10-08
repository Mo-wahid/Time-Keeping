'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Users, BarChart2 } from 'lucide-react';

interface DayHours {
  day: string; // 'Mon', 'Tue', etc.
  [userName: string]: string | number;
}

interface TeamBarsProps {
  data: DayHours[];
  userNames: string[];
}

const USER_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

export function TeamBars({ data, userNames }: TeamBarsProps) {
  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-emerald-500" />
              Weekly Accountability Hours
            </CardTitle>
            <CardDescription className="text-xs">
              Daily side-by-side hours comparison this week
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-background p-2.5 shadow-md text-xs">
                        <p className="font-semibold mb-1 text-foreground">{label}</p>
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey || entry.name)}
                            className="flex items-center justify-between gap-4 py-0.5"
                          >
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-semibold text-foreground">
                              {Number(entry.value).toFixed(1)} hrs
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                iconType="circle"
              />
              {userNames.map((name, idx) => (
                <Bar
                  key={name}
                  dataKey={name}
                  name={name}
                  fill={USER_COLORS[idx % USER_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

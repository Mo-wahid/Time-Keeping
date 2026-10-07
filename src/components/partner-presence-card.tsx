'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PresenceUser } from '@/hooks/use-presence';
import { FOCUS_TYPE_CONFIG } from '@/lib/constants';
import { formatDurationHuman } from '@/lib/utils';
import { Users, Sparkles, Clock, CircleDot } from 'lucide-react';

interface PartnerPresenceCardProps {
  partner: PresenceUser | null;
  partnerName?: string;
}

export function PartnerPresenceCard({ partner, partnerName = 'Partner' }: PartnerPresenceCardProps) {
  const [partnerElapsed, setPartnerElapsed] = useState(0);

  // Live client-side elapsed timer for partner
  useEffect(() => {
    if (!partner || partner.status !== 'running' || !partner.segment_started_at) {
      setPartnerElapsed(partner?.accumulated_seconds || 0);
      return;
    }

    const tick = () => {
      const startMs = new Date(partner.segment_started_at!).getTime();
      const currentSegment = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setPartnerElapsed((partner.accumulated_seconds || 0) + currentSegment);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [partner?.status, partner?.segment_started_at, partner?.accumulated_seconds]);

  if (!partner || partner.status === 'idle') {
    return (
      <Card className="border-border/60 bg-card/50 backdrop-blur-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {partner?.full_name || partnerName} is currently offline
              </p>
              <p className="text-xs text-muted-foreground">
                You&apos;re holding down the fort! Start a session to lead by example.
              </p>
            </div>
          </div>
          <span className="flex h-2.5 w-2.5 rounded-full bg-zinc-500/40" />
        </CardContent>
      </Card>
    );
  }

  const focusConfig = partner.focus_type
    ? FOCUS_TYPE_CONFIG[partner.focus_type]
    : FOCUS_TYPE_CONFIG.build;

  const isWorking = partner.status === 'running';

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 transition-all shadow-xs">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <Avatar className="h-11 w-11 border-2 border-background">
              <AvatarImage src={partner.avatar_url || undefined} />
              <AvatarFallback className="bg-emerald-500/20 text-emerald-600 font-semibold text-sm">
                {(partner.full_name || partnerName).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                isWorking ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">
                {partner.full_name || partnerName}
              </span>
              <span className="text-xs text-muted-foreground">
                {isWorking ? 'is working now' : 'is on a pause'}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-4 ${focusConfig.badgeBg} ${focusConfig.badgeText} ${focusConfig.borderColor}`}
              >
                {focusConfig.label}
              </Badge>
            </div>

            <p className="text-xs text-foreground/90 font-medium truncate mt-0.5">
              &ldquo;{partner.intent || 'Working on goals'}&rdquo;
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-timer text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {formatDurationHuman(partnerElapsed)}
          </span>
          <p className="text-[10px] text-muted-foreground">elapsed</p>
        </div>
      </CardContent>
    </Card>
  );
}

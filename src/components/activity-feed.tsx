'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Session, Reaction, Profile, FocusType } from '@/lib/types';
import { FOCUS_TYPE_CONFIG, REACTION_EMOJIS } from '@/lib/constants';
import { formatDurationHuman, formatDate } from '@/lib/utils';
import { toggleReaction } from '@/actions/reactions';
import { CheckCircle2, MessageSquare, SmilePlus, Sparkles, Tag } from 'lucide-react';
import { toast } from 'sonner';

export interface FeedItem {
  id: string;
  type: 'session' | 'reflection';
  user_id: string;
  userName: string;
  userAvatar?: string | null;
  timestamp: string;
  focusType?: FocusType;
  intent?: string;
  outcome?: string | null;
  durationSeconds?: number;
  projectTag?: string | null;
  wins?: string | null;
  blockers?: string | null;
  nextWeek?: string | null;
  reactions: { emoji: string; count: number; hasReacted: boolean }[];
}

interface ActivityFeedProps {
  items: FeedItem[];
  currentUserId: string;
}

export function ActivityFeed({ items, currentUserId }: ActivityFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(items);

  useEffect(() => {
    setFeedItems(items);
  }, [items]);

  const handleToggleReaction = async (
    targetId: string,
    targetType: 'session' | 'reflection',
    emoji: string
  ) => {
    // Optimistic UI update
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id !== targetId) return item;

        const existingReaction = item.reactions.find((r) => r.emoji === emoji);
        let updatedReactions = [...item.reactions];

        if (existingReaction) {
          if (existingReaction.hasReacted) {
            // Remove user's reaction
            if (existingReaction.count <= 1) {
              updatedReactions = updatedReactions.filter((r) => r.emoji !== emoji);
            } else {
              updatedReactions = updatedReactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, hasReacted: false }
                  : r
              );
            }
          } else {
            // Add user's reaction
            updatedReactions = updatedReactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, hasReacted: true } : r
            );
          }
        } else {
          // Brand new reaction on this item
          updatedReactions.push({ emoji, count: 1, hasReacted: true });
        }

        return { ...item, reactions: updatedReactions };
      })
    );

    try {
      await toggleReaction({
        session_id: targetType === 'session' ? targetId : undefined,
        reflection_id: targetType === 'reflection' ? targetId : undefined,
        emoji,
      });
    } catch (err: any) {
      toast.error('Could not update reaction');
    }
  };

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-card/30">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          No team activity recorded yet. Finish a session to share with your partner!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {feedItems.map((item) => {
        const isSession = item.type === 'session';
        const focus = item.focusType ? FOCUS_TYPE_CONFIG[item.focusType] : null;

        return (
          <Card
            key={item.id}
            className="border-border/70 bg-card/60 transition-all hover:bg-card/90"
          >
            <CardContent className="p-4 space-y-3">
              {/* Header: User avatar + action summary */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.userAvatar || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {item.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {item.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isSession ? 'completed' : 'posted Friday reflection'}
                      </span>
                      {isSession && item.durationSeconds && (
                        <span className="text-xs font-semibold font-timer text-emerald-500">
                          {formatDurationHuman(item.durationSeconds)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(item.timestamp, 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>

                {focus && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${focus.badgeBg} ${focus.badgeText} ${focus.borderColor}`}
                  >
                    {focus.label}
                  </Badge>
                )}
              </div>

              {/* Body */}
              {isSession ? (
                <div className="pl-10 space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    &ldquo;{item.intent}&rdquo;
                  </p>
                  {item.outcome && (
                    <div className="text-xs text-muted-foreground flex items-start gap-1.5 bg-muted/30 p-2 rounded-lg border border-border/40">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item.outcome}</span>
                    </div>
                  )}
                  {item.projectTag && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      <Tag className="h-2.5 w-2.5" />
                      {item.projectTag}
                    </span>
                  )}
                </div>
              ) : (
                /* Friday Reflection Card body */
                <div className="pl-10 space-y-2 text-xs">
                  {item.wins && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-2 rounded-lg">
                      <span className="font-semibold text-emerald-500 block mb-0.5">
                        🎉 Wins:
                      </span>
                      <p className="text-foreground/90">{item.wins}</p>
                    </div>
                  )}
                  {item.blockers && (
                    <div className="bg-rose-500/5 border border-rose-500/20 p-2 rounded-lg">
                      <span className="font-semibold text-rose-500 block mb-0.5">
                        🚧 Blockers:
                      </span>
                      <p className="text-foreground/90">{item.blockers}</p>
                    </div>
                  )}
                  {item.nextWeek && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-2 rounded-lg">
                      <span className="font-semibold text-blue-500 block mb-0.5">
                        🎯 Next Week:
                      </span>
                      <p className="text-foreground/90">{item.nextWeek}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reactions Bar */}
              <div className="pl-10 pt-1 flex items-center gap-1.5 flex-wrap">
                {item.reactions.map((r) => (
                  <button
                    key={r.emoji}
                    onClick={() => handleToggleReaction(item.id, item.type, r.emoji)}
                    aria-label={`React with ${r.emoji}`}
                    aria-pressed={r.hasReacted}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all cursor-pointer ${
                      r.hasReacted
                        ? 'bg-primary/10 border-primary/40 text-primary font-medium hover:bg-primary/20'
                        : 'border-border/60 hover:bg-muted/80 hover:border-border hover:scale-105 text-muted-foreground'
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="text-[11px]">{r.count}</span>
                  </button>
                ))}

                {/* Emoji Picker Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      aria-label="Add reaction"
                      className="h-6 w-6 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border text-xs cursor-pointer transition-all hover:scale-110"
                    >
                      <SmilePlus className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-1.5 flex gap-1" side="top">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(item.id, item.type, emoji)}
                        aria-label={`Add ${emoji} reaction`}
                        className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted text-sm transition-all hover:scale-125 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {isSession && (
                  <Link
                    href={`/session/${item.id}`}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground hover:underline cursor-pointer transition-colors"
                  >
                    View details
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

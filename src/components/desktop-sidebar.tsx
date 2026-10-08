'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Users,
  Target,
  BarChart3,
  Settings,
  LogOut,
  Copy,
  Check,
  Command,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from '@/actions/auth';
import { toast } from 'sonner';

interface DesktopSidebarProps {
  workspaceName?: string;
  inviteCode?: string;
  userName?: string;
  userAvatar?: string | null;
}

const NAV_ITEMS = [
  { href: '/today', label: 'Today', icon: Clock },
  { href: '/team', label: 'Team & Feed', icon: Users },
  { href: '/goals', label: 'Weekly Goals', icon: Target },
  { href: '/insights', label: 'Insights & Heatmap', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DesktopSidebar({
  workspaceName = 'Accountability Space',
  inviteCode,
  userName = 'User',
  userAvatar,
}: DesktopSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const copyInvite = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/40 backdrop-blur-md h-dvh sticky top-0 shrink-0">
      {/* Workspace Brand / Header */}
      <div className="p-4 border-b border-border/70 space-y-2">
        <div className="flex items-center justify-between">
          <Link href="/today" className="flex items-center gap-2 cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-base">
              S
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Sproj
            </span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark or light theme"
            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Workspace pill */}
        <div className="flex items-center justify-between bg-muted/40 p-2 rounded-lg border border-border/50 text-xs">
          <div className="min-w-0 pr-1">
            <p className="font-semibold text-foreground truncate">{workspaceName}</p>
            {inviteCode && (
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                Code: {inviteCode}
              </p>
            )}
          </div>
          {inviteCode && (
            <button
              onClick={copyInvite}
              title="Copy invite code"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/80 p-1 rounded transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Nav List */}
      <nav aria-label="Sidebar Navigation" className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Quick Action */}
      <div className="p-3 border-t border-border/70 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-7 w-7">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
            </div>
          </div>

          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}

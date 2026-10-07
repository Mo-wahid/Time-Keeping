'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Clock,
  Users,
  Target,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Copy,
  Plus,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

interface CommandPaletteProps {
  inviteCode?: string;
}

export function CommandPalette({ inviteCode }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/today'))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Today & Timer</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/team'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Team & Activity Feed</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/goals'))}>
            <Target className="mr-2 h-4 w-4" />
            <span>Weekly Goals & Reflections</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/insights'))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Insights & Heatmap</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings & Workspace</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {inviteCode && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  navigator.clipboard.writeText(inviteCode);
                  toast.success('Invite code copied!');
                })
              }
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy Workspace Invite Code</span>
            </CommandItem>
          )}
          <CommandItem
            onSelect={() =>
              runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))
            }
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle Theme ({theme === 'dark' ? 'Light' : 'Dark'})</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

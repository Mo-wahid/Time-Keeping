import { FocusType } from './types';
export { FOCUS_TYPES } from './schemas';

export const FOCUS_TYPE_CONFIG: Record<
  FocusType,
  {
    label: string;
    description: string;
    color: string;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
  }
> = {
  explore: {
    label: 'Explore',
    description: 'Researching, reading papers, spiking experiments',
    color: '#8b5cf6', // violet-500
    badgeBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    badgeText: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-500/30',
  },
  learn: {
    label: 'Learn',
    description: 'Courses, tutorials, documentation deep-dives',
    color: '#3b82f6', // blue-500
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    badgeText: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  build: {
    label: 'Build',
    description: 'Hands-on code, implementing features, fixing bugs',
    color: '#10b981', // emerald-500
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  review: {
    label: 'Review',
    description: 'Code review, refactoring, audit, performance check',
    color: '#f59e0b', // amber-500
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeText: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  plan: {
    label: 'Plan',
    description: 'System architecture, roadmap, breaking down epics',
    color: '#f43f5e', // rose-500
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    badgeText: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500/30',
  },
};

export const REACTION_EMOJIS = ['🔥', '💪', '👀', '🎯', '🧠', '🚀'] as const;

export const NAV_ITEMS = [
  { href: '/today', label: 'Today', icon: 'Clock' },
  { href: '/team', label: 'Team', icon: 'Users' },
  { href: '/goals', label: 'Goals', icon: 'Target' },
  { href: '/insights', label: 'Insights', icon: 'BarChart3' },
] as const;

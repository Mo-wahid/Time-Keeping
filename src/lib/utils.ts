import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats total seconds into HH:MM:SS or MM:SS */
export function formatDuration(totalSeconds: number, includeHours = true): string {
  if (totalSeconds < 0 || isNaN(totalSeconds)) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (includeHours || hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** Formats seconds into human friendly short form e.g. "1h 42m" or "35m" */
export function formatDurationHuman(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/** Returns the Monday (or configured week start) of a given date formatted as YYYY-MM-DD */
export function getWeekStartDateString(d: Date = new Date(), weekStartsOn: 0 | 1 = 1): string {
  const start = startOfWeek(d, { weekStartsOn });
  return format(start, 'yyyy-MM-dd');
}

/** Formats a date string or Date object to a readable string */
export function formatDate(date: string | Date, fmt: string = 'MMM d, yyyy'): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return format(parsed, fmt);
}

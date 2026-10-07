import { describe, it, expect } from 'vitest';
import { formatDuration, formatDurationHuman, getWeekStartDateString } from '../utils';

describe('Format Duration Utilities', () => {
  it('formats seconds into HH:MM:SS properly', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(42)).toBe('00:00:42');
    expect(formatDuration(65)).toBe('00:01:05');
    expect(formatDuration(3665)).toBe('01:01:05');
  });

  it('formats duration in human readable form', () => {
    expect(formatDurationHuman(0)).toBe('0m');
    expect(formatDurationHuman(45 * 60)).toBe('45m');
    expect(formatDurationHuman(3600)).toBe('1h');
    expect(formatDurationHuman(3600 + 42 * 60)).toBe('1h 42m');
  });

  it('returns valid YYYY-MM-DD for week start', () => {
    const mondayStr = getWeekStartDateString(new Date('2026-10-07'), 1);
    expect(mondayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

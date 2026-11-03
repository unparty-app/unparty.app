'use client';

import { useEffect, useState } from 'react';
import { useLocalStorageValue, writeLocalStorage } from '@/hooks/useLocalStorage';

/**
 * The hours someone tracks in Expensd, kept in their browser so they survive
 * a reload and any part of the site can read them: Goal Budget prices a build
 * from them ("tracked as you go"). A running entry has no end yet, so it
 * counts up to now, and readers see the hours climb.
 */

export const TRACKED_KEY = 'expensd_entries';

export interface TrackedEntry {
  start: string; // ISO
  end?: string; // ISO; missing while it's running
  hours?: number; // set once it ends, or for an entry typed in
  manual?: boolean;
}

export function parseTracked(raw: string | null): TrackedEntry[] {
  try {
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((e) => e && typeof e.start === 'string') : [];
  } catch {
    return [];
  }
}

export function writeTracked(entries: TrackedEntry[]) {
  writeLocalStorage(TRACKED_KEY, JSON.stringify(entries));
}

/** Every entry's hours, a running one up to `now` */
export function trackedHours(entries: TrackedEntry[], now = Date.now()): number {
  return entries.reduce((sum, e) => {
    if (typeof e.hours === 'number' && e.end) return sum + e.hours;
    if (typeof e.hours === 'number' && e.manual) return sum + e.hours;
    return sum + Math.max(0, (now - new Date(e.start).getTime()) / 3_600_000);
  }, 0);
}

/** The tracked hours, live: they tick every second while an entry runs */
export function useTrackedHours(): number {
  const entries = parseTracked(useLocalStorageValue(TRACKED_KEY));
  const running = entries.some((e) => !e.end && !e.manual);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [running]);
  return trackedHours(entries, now);
}

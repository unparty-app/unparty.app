import { stampText } from './stamp-dates-core';
import { readFileText } from './github';

/**
 * Date stamping for the in-app save APIs (#1030). An edit saved from unseen
 * never passes through the pre-commit hook, so the save stamps it the same
 * way, with the same rules (src/lib/stamp-dates-core.js): the updated date
 * becomes today only when the title or body changed against main's copy.
 */

const DAY = 24 * 60 * 60 * 1000;

/**
 * The date to stamp. The server runs on UTC, so a 9pm save in New York would
 * land on tomorrow; a client can send its own local date (YYYY-MM-DD), which
 * is used when it's within a day of the server's. Otherwise UTC.
 */
export function saveDate(clientDate?: unknown): string {
  const utc = new Date().toISOString().slice(0, 10);
  if (typeof clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
    const gap = Math.abs(Date.parse(clientDate) - Date.parse(utc));
    if (!Number.isNaN(gap) && gap <= DAY) return clientDate;
  }
  return utc;
}

/**
 * `[skip stamp]` in a commit message's first line leaves the dates alone on
 * purpose. Only the first line, so a message that just mentions the marker
 * doesn't switch stamping off (the same rule as stamp-dates.yml).
 */
export const skipsStamp = (message: string) => message.split('\n')[0].includes('[skip stamp]');

/**
 * `text` with its dates set, compared against `path` on main, or against
 * `fallbackBase` when main has no such file yet (a TS or MD article saved from
 * unseen for the first time becomes a new JSON override, but it's still an
 * edit). A file new to main, or one missing its created date, gets `today` as
 * the created date.
 */
export async function stampForSave(
  path: string,
  text: string,
  today: string,
  fallbackBase: string | null = null
): Promise<string> {
  const base = (await readFileText(path, 'main')) ?? fallbackBase;
  const stamped = stampText(path, text, base, { today, created: () => today });
  return stamped ? stamped.text : text;
}

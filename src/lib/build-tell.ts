import 'server-only';
import { randomBytes, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAppSetting, setAppSetting } from '@/lib/appSettings';
import { SITE_URL } from '@/app/constants/organization';
import { UPSTREAM } from '@/lib/builds';

/**
 * A copy telling unparty.app it was built (#589), from the copy's side. Its
 * token lives in the copy's own database (AppSetting `build`), never in the
 * repo: a snapshot repo can be public, and the token is what takes the
 * listing off. unparty.app fetches the card back with it (GET /api/build).
 */

const KEY = 'build';

export interface Told {
  token: string;
  number?: number;
  status?: string;
  sentAt?: string;
}

export async function getTold(): Promise<Told | null> {
  try {
    const raw = await getAppSetting(KEY);
    return raw ? (JSON.parse(raw) as Told) : null;
  } catch {
    return null;
  }
}

/** Whether a token is this copy's own (constant time) */
export async function isOwnToken(token: string | null): Promise<boolean> {
  const told = await getTold();
  if (!told?.token || !token) return false;
  const a = Buffer.from(told.token);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Tell unparty.app: a new token (or the one already sent), then the upstream's answer */
export async function tellUnparty(email?: string): Promise<Told> {
  const token = (await getTold())?.token ?? randomBytes(24).toString('base64url');
  // Saved first: unparty.app fetches the card back with it before answering
  await setAppSetting(KEY, JSON.stringify({ token }));
  const res = await fetch(`${UPSTREAM}/api/builds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: SITE_URL, token, ...(email ? { email } : {}) }),
    signal: AbortSignal.timeout(20000),
  });
  const data = (await res.json().catch(() => ({}))) as { number?: number; status?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? `unparty.app answered ${res.status}`);
  const told: Told = { token, number: data.number, status: data.status, sentAt: new Date().toISOString() };
  await setAppSetting(KEY, JSON.stringify(told));
  return told;
}

/** Take this copy off unparty.app's builds, then forget the token */
export async function takeOff(): Promise<void> {
  const told = await getTold();
  if (told?.token) {
    const res = await fetch(`${UPSTREAM}/api/builds`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: SITE_URL, token: told.token }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok && res.status !== 404) throw new Error(`unparty.app answered ${res.status}`);
  }
  await prisma.appSetting.deleteMany({ where: { key: KEY } });
}

import 'server-only';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { prisma } from '@/lib/prisma';
import { readCard, type BuildCard } from '@/lib/builds';

/**
 * unparty.app receiving a build (#589): a copy's owner told it about their
 * site, so it fetches the copy's card back (GET <copy>/api/build?token=…)
 * before counting it. The address is a stranger's, so the fetch is fenced:
 * https on the default port, a host that resolves only to public addresses,
 * no redirects, a timeout, and a size cap.
 */

const MAX_BYTES = 64 * 1024;

// Private, loopback, link-local, CGNAT and unique-local ranges
function isPrivate(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return isPrivate(v.slice(7));
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

/** The copy's origin when it's one unparty.app may fetch, else why not */
export async function fetchableOrigin(url: unknown): Promise<{ origin: string } | { error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(String(url));
  } catch {
    return { error: 'That isn’t an address' };
  }
  if (parsed.protocol !== 'https:' || parsed.port || parsed.username || parsed.password) return { error: 'Builds are told from an https address' };
  const host = parsed.hostname;
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return { error: 'That address isn’t public' };
  try {
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (!addresses.length || addresses.some((a) => isPrivate(a.address))) return { error: 'That address isn’t public' };
  } catch {
    return { error: 'That address doesn’t resolve' };
  }
  return { origin: parsed.origin };
}

/** The copy's card, fetched back with its token, or why it couldn't be */
export async function fetchCard(origin: string, token: string): Promise<{ card: BuildCard } | { error: string }> {
  try {
    const res = await fetch(`${origin}/api/build?token=${encodeURIComponent(token)}`, { redirect: 'error', signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!res.ok) return { error: `The site answered ${res.status} for its card (is it the copy, deployed, with this token?)` };
    const text = await res.text();
    if (text.length > MAX_BYTES) return { error: 'The card is too big' };
    const card = readCard((JSON.parse(text) as { card?: unknown }).card, origin);
    return card ? { card } : { error: 'That isn’t a build card' };
  } catch {
    return { error: 'Couldn’t reach the site for its card' };
  }
}

/** Stores a verified build: a new one gets the next number; a resent one keeps its number */
export async function storeBuild(origin: string, token: string, card: BuildCard, email?: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.build.findUnique({ where: { url: origin } });
    const data = { card: card as object, token, email: email ?? existing?.email ?? null, version: card.version || null };
    if (existing) {
      return tx.build.update({ where: { url: origin }, data: { ...data, ...(existing.status === 'REJECTED' ? { status: 'PENDING' } : {}) } });
    }
    const last = await tx.build.aggregate({ _max: { number: true } });
    return tx.build.create({ data: { url: origin, number: (last._max.number ?? 0) + 1, ...data } });
  });
}

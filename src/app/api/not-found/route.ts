import { after } from 'next/server';
import { classifyPath, recordNotFound } from '@/lib/not-found';

/**
 * POST /api/not-found - counts one 404 the visitor actually saw.
 *
 * Sent by NotFoundView when it mounts, not by the server page: Next renders
 * the root not-found.tsx on every request (it ships as the fallback of every
 * page), so counting there counted every page view. Prefetches never mount it.
 *
 * Body: { path, referrer } (location.pathname, document.referrer). The same
 * rules as before apply in recordNotFound(): no query string, nothing with an
 * '@' or over 200 chars, and a referrer only when it's this site.
 */
export async function POST(request: Request) {
  let body: { path?: unknown; referrer?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const path = typeof body.path === 'string' && body.path.startsWith('/') ? body.path : '';
  if (!path) return new Response(null, { status: 400 });
  const referrer = typeof body.referrer === 'string' && body.referrer ? body.referrer : null;
  const host = request.headers.get('host');

  after(() => recordNotFound(path, classifyPath(path), referrer, host));
  return new Response(null, { status: 204 });
}

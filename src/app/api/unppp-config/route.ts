import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import UnpppsConfig from '@/data/UnpppsConfig.json';

export const revalidate = 3600;

// Generous single window — the edge cache (Cache-Control/ETag below) does the
// real work of keeping this off compute; this is just a backstop against a
// client stuck in a fetch loop.
const RATE_LIMIT_PER_MINUTE = 60;

const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400';

export async function GET(req: NextRequest) {
  const limit = checkRateLimit(`unppp-config:1m:${getClientIp(req)}`, RATE_LIMIT_PER_MINUTE, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  // The config's own incrementing `version` field doubles as a cheap ETag,
  // so clients (e.g. theunpartyunppp's conditional-GET fetch client) can
  // send If-None-Match and get a 304 without us re-serializing the payload.
  const etag = `"config-v${UnpppsConfig.version}"`;
  if (req.headers.get('if-none-match') === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, 'Cache-Control': CACHE_CONTROL },
    });
  }

  return NextResponse.json(
    { version: UnpppsConfig.version, unppps: UnpppsConfig.unppps },
    { headers: { ETag: etag, 'Cache-Control': CACHE_CONTROL } }
  );
}

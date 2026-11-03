/**
 * Minimal in-memory sliding-window rate limiter for public API routes.
 *
 * State lives in module scope, so on serverless (Vercel) each warm lambda
 * instance keeps its own counters — enough to stop burst spam on low-traffic
 * endpoints like /api/chat/send without adding external storage. If sustained
 * abuse ever outgrows this, swap the Map for a durable store (DB/Upstash)
 * behind the same `checkRateLimit` signature.
 */

interface Bucket {
  timestamps: number[];
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the oldest counted hit falls out of the window. */
  retryAfterSeconds: number;
}

const buckets = new Map<string, Bucket>();

// Safety valve so a scraper cycling IPs can't grow the Map unbounded.
const MAX_TRACKED_KEYS = 5000;

function sweepExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    const newest = bucket.timestamps[bucket.timestamps.length - 1];
    if (newest === undefined || newest + bucket.windowMs <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Count a hit for `key` and report whether it stays within `max` hits per
 * `windowMs`. Disallowed hits are not counted, so a blocked client only has
 * to wait for its earlier (allowed) hits to age out.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size > MAX_TRACKED_KEYS) sweepExpired(now);

  const timestamps = (buckets.get(key)?.timestamps ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= max) {
    buckets.set(key, { timestamps, windowMs });
    const oldest = timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  timestamps.push(now);
  buckets.set(key, { timestamps, windowMs });
  return { allowed: true, remaining: max - timestamps.length, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP for rate-limit keys. On Vercel the left-most
 * x-forwarded-for entry is the connecting client.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

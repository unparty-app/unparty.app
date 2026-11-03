import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ANALYTICS_RETENTION_DAYS = 30;

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// Set CRON_SECRET in Vercel environment variables (any random string).
// In local dev, either set CRON_SECRET= (empty, skips check) or pass the header manually.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

// Traces and trace spans are no longer pruned here: the trace drain has been
// off since 2026-05-11 and its tables are being removed (#1360). Deleting the
// ~340M leftover spans in one request would hammer the database and time out
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ANALYTICS_RETENTION_DAYS);

  const [pageviews, events] = await Promise.all([
    prisma.vercelPageview.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.vercelEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);

  // 404 counts (not-found.tsx), kept as long as the analytics. On its own so a
  // deploy that lands before the not_found_hits migration can't fail the rest
  const notFoundHits = await prisma.notFoundHit
    .deleteMany({ where: { day: { lt: cutoff } } })
    .catch((error: unknown) => {
      console.warn('[db-cleanup] not_found_hits:', error instanceof Error ? error.message : error);
      return { count: 0 };
    });

  const result = {
    deleted: {
      pageviews: pageviews.count,
      events: events.count,
      notFoundHits: notFoundHits.count,
    },
    retentionDays: ANALYTICS_RETENTION_DAYS,
    cutoff: cutoff.toISOString(),
    ranAt: new Date().toISOString(),
  };

  console.log('[db-cleanup] completed:', result);
  return NextResponse.json(result);
}

import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { isRange, RANGES, shownPages, type ShownPage } from '@/lib/observability';
import { GA4Queries } from '@/lib/ga-queries';

/**
 * Google's side of search for /admin/observability (#664): the articles and
 * stories people landed on from organic search in the window, from GA4 when
 * it's connected. The drain rarely knows a visit came from search (most
 * arrive with no referrer), so this is the truer count.
 */

export interface SearchData {
  connected: boolean;
  sessions: number;
  top: ShownPage[];
}

const CONNECTED = Boolean(process.env.GA4_PROPERTY_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!CONNECTED) return NextResponse.json({ connected: false, sessions: 0, top: [] } satisfies SearchData);

  const param = new URL(request.url).searchParams.get('range');
  const range = isRange(param) ? param : '7d';
  const end = new Date();
  // GA counts whole days
  const start = new Date(end.getTime() - Math.max(1, RANGES[range].unit === 'day' ? RANGES[range].buckets : 1) * DAY_MS);

  try {
    const [articles, stories] = await Promise.all(['/article/', '/story/'].map((prefix) => GA4Queries.getOrganicLandingPages(start, end, prefix, 10)));
    const rows = [...articles, ...stories].sort((a, b) => b.sessions - a.sessions);
    const top = await shownPages(rows.slice(0, 5).map((r) => ({ path: r.path, views: r.sessions })));
    return NextResponse.json({ connected: true, sessions: rows.reduce((n, r) => n + r.sessions, 0), top } satisfies SearchData, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    console.error('[admin/observability/search] GA failed:', error);
    return NextResponse.json({ error: "Google Analytics didn't answer" }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';
import { computeUnpppPageviewSnapshot, type UnpppPageviewSnapshot } from '@/lib/unppp-pageview-snapshot';
import { runSnapshotPr } from '@/lib/snapshot-pr';

/**
 * Refreshes public/data/unppp-pageviews.json (the file src/utils/unpppPriority.ts
 * already statically imports — path unchanged, do not rename) and seeds
 * public/data/unppp-pageviews-baseline.json on first run, via a real PR +
 * auto-merge. See src/lib/snapshot-pr.ts for the shared current/baseline
 * mechanics, and this route's git history for why it's a Vercel Cron route
 * rather than a GitHub Actions workflow.
 */

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

function pageviewsEqual(a: UnpppPageviewSnapshot, b: UnpppPageviewSnapshot): boolean {
  return JSON.stringify(a.pageviews) === JSON.stringify(b.pageviews);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await computeUnpppPageviewSnapshot();

    const result = await runSnapshotPr(
      {
        pillar: 'unppp-pageviews',
        currentPath: 'public/data/unppp-pageviews.json',
        baselinePath: 'public/data/unppp-pageviews-baseline.json',
        isEqual: pageviewsEqual,
        prBodySummary: (s) => `Matched ${s.pageviews.length} unppps, ${s.total_pageviews} pageviews (${s.window_days}d window).`,
      },
      snapshot
    );

    console.log('[snapshot-unppp-pageviews]', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[snapshot-unppp-pageviews] Failed:', error);
    return NextResponse.json({ error: 'Failed to snapshot unppp pageviews' }, { status: 500 });
  }
}

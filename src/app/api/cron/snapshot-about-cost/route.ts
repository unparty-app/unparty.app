import { NextResponse } from 'next/server';
import { computeAboutSnapshot, type AboutSnapshot } from '@/lib/about-snapshot';
import { runSnapshotPr } from '@/lib/snapshot-pr';

/**
 * Refreshes public/data/about-cost-current.json (+ seeds -baseline.json on
 * first run) via a real PR + auto-merge. See src/lib/snapshot-pr.ts.
 */

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

function entriesEqual(a: AboutSnapshot, b: AboutSnapshot): boolean {
  return JSON.stringify(a.entries) === JSON.stringify(b.entries);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await computeAboutSnapshot();

    const result = await runSnapshotPr(
      {
        pillar: 'about-cost',
        currentPath: 'public/data/about-cost-current.json',
        baselinePath: 'public/data/about-cost-baseline.json',
        isEqual: entriesEqual,
        prBodySummary: (s) => `${s.entries.length} unppps priced.`,
      },
      snapshot
    );

    console.log('[snapshot-about-cost]', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[snapshot-about-cost] Failed:', error);
    return NextResponse.json({ error: 'Failed to snapshot about cost' }, { status: 500 });
  }
}

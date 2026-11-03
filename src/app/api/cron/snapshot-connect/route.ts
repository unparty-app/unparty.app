import { NextResponse } from 'next/server';
import { computeConnectSnapshot, type ConnectSnapshot } from '@/lib/connect-snapshot';
import { runSnapshotPr } from '@/lib/snapshot-pr';
import { readJsonFile } from '@/lib/github';

/**
 * Refreshes public/data/connect-current.json (+ seeds -baseline.json on
 * first run) via a real PR + auto-merge. See src/lib/snapshot-pr.ts.
 */

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

const CURRENT = 'public/data/connect-current.json';

function statsEqual(a: ConnectSnapshot, b: ConnectSnapshot): boolean {
  return JSON.stringify([a.stats, a.months]) === JSON.stringify([b.stats, b.months]);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Last run's months carry over: the drain only reaches back 30 days
    const previous = await readJsonFile<ConnectSnapshot>(CURRENT, 'main').catch(() => null);
    const snapshot = await computeConnectSnapshot(previous);

    const result = await runSnapshotPr(
      {
        pillar: 'connect',
        currentPath: CURRENT,
        baselinePath: 'public/data/connect-baseline.json',
        isEqual: statsEqual,
        prBodySummary: (s) =>
          `story: ${s.stats.story.vercel} vercel / ${s.stats.story.ga} ga sessions · ` +
          `article: ${s.stats.article.vercel} vercel / ${s.stats.article.ga} ga sessions (${s.window_days}d window).`,
      },
      snapshot
    );

    console.log('[snapshot-connect]', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[snapshot-connect] Failed:', error);
    return NextResponse.json({ error: 'Failed to snapshot connect stats' }, { status: 500 });
  }
}

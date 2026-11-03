import { NextResponse } from 'next/server';
import { computeBuildPrioritySnapshot, type BuildPrioritySnapshot } from '@/lib/build-priority-snapshot';
import { runSnapshotPr } from '@/lib/snapshot-pr';

/**
 * Refreshes public/data/build-priority-current.json (+ seeds -baseline.json
 * on first run) via a real PR + auto-merge. See src/lib/snapshot-pr.ts.
 */

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

function entriesEqual(a: BuildPrioritySnapshot, b: BuildPrioritySnapshot): boolean {
  return JSON.stringify(a.entries) === JSON.stringify(b.entries);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await computeBuildPrioritySnapshot();

    const result = await runSnapshotPr(
      {
        pillar: 'build-priority',
        currentPath: 'public/data/build-priority-current.json',
        baselinePath: 'public/data/build-priority-baseline.json',
        isEqual: entriesEqual,
        prBodySummary: (s) => `${s.entries.length} unppps scored.`,
      },
      snapshot
    );

    console.log('[snapshot-build-priority]', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[snapshot-build-priority] Failed:', error);
    return NextResponse.json({ error: 'Failed to snapshot build priority' }, { status: 500 });
  }
}

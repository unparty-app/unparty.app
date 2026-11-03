import { computeUnpppPriorityScores } from '@/lib/unppp-priority-scores';
import type { RouteInfo } from '@/types/BuildStatus';

/**
 * Snapshot wrapper around computeUnpppPriorityScores() (the same source
 * /status and /priority already use) for the Build baseline/current files —
 * see src/lib/snapshot-pr.ts and src/app/api/cron/snapshot-build-priority/route.ts.
 */

export interface BuildPrioritySnapshot {
  generated_at: string;
  entries: RouteInfo[];
}

export async function computeBuildPrioritySnapshot(): Promise<BuildPrioritySnapshot> {
  const rows = await computeUnpppPriorityScores();

  const entries: RouteInfo[] = rows.map((r) => ({
    route: r.id,
    name: r.name,
    tier: r.moodClassification,
    combined: r.combined,
    repoTotal: r.repoTotal,
    unpppTotal: r.unpppTotal,
  }));

  return { generated_at: new Date().toISOString(), entries };
}

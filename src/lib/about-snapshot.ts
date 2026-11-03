import { getUnpppPriorityData } from '@/utils/unpppPriority';
import type { AboutInfo } from '@/types/BuildStatus';

/**
 * Snapshot wrapper around getUnpppPriorityData() (already joins
 * scripts/polar-pricing.ts's output per-id) for the About baseline/current
 * files — see src/lib/snapshot-pr.ts and
 * src/app/api/cron/snapshot-about-cost/route.ts.
 */

export interface AboutSnapshot {
  generated_at: string;
  entries: AboutInfo[];
}

export async function computeAboutSnapshot(): Promise<AboutSnapshot> {
  const entries: AboutInfo[] = getUnpppPriorityData().map((e) => ({
    route: e.id,
    devHours: e.devHours,
    polarPrice: e.polarPrice,
    confidence: e.confidence,
  }));

  return { generated_at: new Date().toISOString(), entries };
}

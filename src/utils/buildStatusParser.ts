/**
 * Build Status Generator
 *
 * Generates BuildStatusData from the UNPPP priority-score system
 * (src/lib/unppp-priority-scores.ts), scoped to the 49 UnpppsConfig.json
 * entries — each entry's id is also its real app route (src/app/<id>/).
 *
 * Formerly round-tripped a markdown file (unparty-status.md) written by
 * scripts/generate-build-status.js / scripts/unparty-status.js, both of
 * which scraped .next/ build artifacts (app-path-routes-manifest.json,
 * build-manifest.json, next build stdout). That pipeline never actually
 * fired in production — unparty-status.md was gitignored and never
 * deployed — so every real request already fell through to a fallback.
 * This file now generates that fallback data directly, with no file
 * round-trip and no .next/ dependency.
 */

import type { BuildStatusData, RouteInfo, PriorityTier } from '../types/BuildStatus';
import { computeUnpppPriorityScores } from '@/lib/unppp-priority-scores';

// /status and /theunpartylogger prerender with this at build time. A build
// with no reachable database (CI, a fresh copy) renders them empty instead of
// failing; their ISR revalidate refills them once the database answers.
// computeUnpppPriorityScores itself still throws, so snapshot crons never
// commit empty data (#761)
async function priorityRowsOrEmpty() {
  try {
    return await computeUnpppPriorityScores();
  } catch (error) {
    console.warn('Build status unavailable (database unreachable?); rendering empty:', error instanceof Error ? error.message.split('\n').find(Boolean) : error);
    return [];
  }
}

export async function generateStatusFromPriorityScores(): Promise<BuildStatusData> {
  const rows = await priorityRowsOrEmpty();

  const routes: RouteInfo[] = rows.map(r => ({
    route: r.id,
    name: r.name,
    tier: r.moodClassification,
    combined: r.combined,
    repoTotal: r.repoTotal,
    unpppTotal: r.unpppTotal,
  }));

  const countByTier = (tier: PriorityTier) => routes.filter(r => r.tier === tier).length;
  const avgCombined = routes.length > 0
    ? routes.reduce((acc, r) => acc + r.combined, 0) / routes.length
    : 0;

  return {
    routes,
    stats: {
      total: routes.length,
      'YAH.': countByTier('YAH.'),
      'MEH.': countByTier('MEH.'),
      'NAH.': countByTier('NAH.'),
      avgCombined,
      matchedCount: rows.filter(r => r.matched).length,
    },
    timestamp: new Date().toISOString(),
  };
}

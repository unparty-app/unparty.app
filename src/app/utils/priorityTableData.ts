// Data merger utility for PriorityTable component
// Combines UnpppsConfig (config-completeness signal) with raw-repo-metadata
// (real, recent commit-activity signal) into one effort-driven priority score.
// See scripts/priority-count-debug.ts for the CLI/console equivalent of this merge.
//
// stepLinkPoints/storyMentionPoints can't be computed client-side (the
// former needs a Prisma query) — they're passed in from /api/unppp/priority-score
// (src/lib/unppp-priority-scores.ts), the same source /status and
// StatsLayoutWrapper use, so `combined` can't drift from those again.

import UnpppsConfig from '../../data/UnpppsConfig.json';
import { calculatePriorityCount } from '../../utils/unppp-priority-count';
import { calculateRepoPriorityCount } from '../../utils/repo-priority-count';
import type { RepositoryMetadata } from '@/types/repository-metadata';

export interface EnrichedPriority {
  id: string;
  name: string;
  matched: boolean;

  // unppp-priority-count.ts breakdown (config completeness + shipped-ness)
  unpppTotal: number;
  urlPoints: number;
  corePoints: number;
  productPoints: number;
  completedKeys: number;
  expectedKeys: number;

  // repo-priority-count.ts breakdown (real, recency-weighted commit activity)
  repoTotal: number;
  activePeriodPoints: number;
  timeBoundedPoints: number;

  // From /api/unppp/priority-score — step-priority-count.ts / story-mention-count.ts
  stepLinkPoints: number;
  storyMentionPoints: number;

  combined: number;
}

export type SortColumn = 'name' | 'unpppTotal' | 'repoTotal' | 'active' | 'bounded' | 'combined';
export type SortDirection = 'asc' | 'desc';

export interface SupplementalPriorityPoints {
  stepLinkPoints: number;
  storyMentionPoints: number;
}

/**
 * Merge UnpppsConfig with raw-repo-metadata into one priority breakdown per
 * unppp. Matching prefers the authoritative `unppp_id` field written by
 * repo-metadata-analyzer (correct even when the GitHub repo name diverges
 * from the unppp id, e.g. theunpartycharette's repo is "uncolor-ios"), and
 * falls back to matching by repo name for older snapshots.
 *
 * `supplementalPoints` is keyed by unppp id, sourced from
 * /api/unppp/priority-score — pass an empty Map if that fetch hasn't
 * resolved yet (stepLinkPoints/storyMentionPoints just read as 0 until it
 * has, rather than blocking the rest of the table).
 */
export function mergePriorityData(
  repoMetadata: RepositoryMetadata[],
  supplementalPoints: Map<string, SupplementalPriorityPoints> = new Map()
): EnrichedPriority[] {
  const repoByUnpppId = new Map(
    repoMetadata
      .filter((r): r is RepositoryMetadata & { unppp_id: string } => typeof r.unppp_id === 'string' && !!r.unppp_id)
      .map(r => [r.unppp_id, r])
  );
  const repoByName = new Map(repoMetadata.map(r => [r.name, r]));

  return UnpppsConfig.unppps.map(entry => {
    const unpppScore = calculatePriorityCount(entry as unknown as Record<string, unknown>);
    const repoName = (entry as { repoName?: string }).repoName;
    const repoRow = repoByUnpppId.get(entry.id) ?? repoByName.get(repoName || entry.id);
    const repoScore = calculateRepoPriorityCount(repoRow as unknown as Record<string, unknown> | undefined);
    const { stepLinkPoints = 0, storyMentionPoints = 0 } = supplementalPoints.get(entry.id) ?? {};

    return {
      id: entry.id,
      name: entry.name || entry.id,
      matched: !!repoRow,
      unpppTotal: unpppScore.total,
      urlPoints: unpppScore.urlPoints,
      corePoints: unpppScore.corePoints,
      productPoints: unpppScore.productPoints,
      completedKeys: unpppScore.completedKeys,
      expectedKeys: unpppScore.expectedKeys,
      repoTotal: repoScore.total,
      activePeriodPoints: repoScore.activePeriodPoints,
      timeBoundedPoints: repoScore.timeBoundedPoints,
      stepLinkPoints,
      storyMentionPoints,
      combined: unpppScore.total + repoScore.total + stepLinkPoints + storyMentionPoints,
    };
  });
}

export function sortPriority(rows: EnrichedPriority[], column: SortColumn, direction: SortDirection): EnrichedPriority[] {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (column) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'unpppTotal':
        aVal = a.unpppTotal;
        bVal = b.unpppTotal;
        break;
      case 'repoTotal':
        aVal = a.repoTotal;
        bVal = b.repoTotal;
        break;
      case 'active':
        aVal = a.activePeriodPoints;
        bVal = b.activePeriodPoints;
        break;
      case 'bounded':
        aVal = a.timeBoundedPoints;
        bVal = b.timeBoundedPoints;
        break;
      case 'combined':
      default:
        aVal = a.combined;
        bVal = b.combined;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    const aNum = typeof aVal === 'number' ? aVal : 0;
    const bNum = typeof bVal === 'number' ? bVal : 0;
    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  });

  return sorted;
}

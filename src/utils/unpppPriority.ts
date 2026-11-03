/**
 * UNPPP priority calculation — client-safe (no server-only imports).
 * Import this directly from client components instead of buildStatusParser.ts.
 */

import unpppTimeData from '../../unppp-repo-time.json';
import costData from '../../unparty-polar-unppp-cost-estimate.json';
import repoMetadata from '../../public/raw-repo-metadata.json';
import UnpppsConfig from '../data/UnpppsConfig.json';
// Static snapshot refreshed by .github/workflows/snapshot-unppp-pageviews.yml
// (scripts/generate-unppp-pageviews.ts) — real pageview data lives in Postgres,
// which this file can't query directly since it must stay client-safe.
import pageviewData from '../../public/data/unppp-pageviews.json';

export interface UnpppTimeEntry {
  repo_id: string;
  total_hours: number;
  commit_count: number;
  utilization_rate: number;
}

export interface UnpppCostEntry {
  id: string;
  name: string;
  confidence: 'high' | 'low';
  total_hours: number;
  price_breakdown: { polar_price: number };
}

export interface UnpppMetaEntry {
  name: string;
  activity_score: number;
  enhanced_metrics: {
    commits_analysis: { commit_velocity_per_week: number };
  };
}

export interface UnpppPriorityEntry {
  id: string;
  displayName: string;
  priorityScore: number;
  /** Effort-independent priority (price/activity/velocity only) — the axis effort is measured against. */
  demandScore: number;
  confidence: 'high' | 'low';
  devHours: number;
  polarPrice: number;
  activityScore: number;
  commitVelocity: number;
  utilizationRate: number;
  /** Trailing-window pageviews on this unppp's own route (/<id>) — see pageviewData import. */
  pageviews: number;
}

interface _JoinedRaw {
  id: string;
  displayName: string;
  confidence: 'high' | 'low';
  devHours: number;
  polarPrice: number;
  activityScore: number;
  commitVelocity: number;
  utilizationRate: number;
  pageviews: number;
}

interface _MaxValues {
  devHours: number;
  polarPrice: number;
  activityScore: number;
  commitVelocity: number;
  pageviews: number;
}

export function joinUnpppData(): _JoinedRaw[] {
  const timeByRepoId = new Map<string, UnpppTimeEntry>(
    (unpppTimeData.repositories as UnpppTimeEntry[]).map(r => [r.repo_id, r])
  );
  const metaByName = new Map<string, UnpppMetaEntry>(
    (repoMetadata as unknown as UnpppMetaEntry[]).map(r => [r.name, r])
  );
  const pageviewsById = new Map<string, number>(
    // Cast needed because the checked-in snapshot is currently empty (drain
    // has no recent rows — see generated_at), which infers as `never[]`.
    (pageviewData.pageviews as { id: string; views: number }[]).map(p => [p.id, p.views])
  );

  return (costData.unppps as UnpppCostEntry[]).map(cost => {
    const time = timeByRepoId.get(cost.id);
    const meta = metaByName.get(cost.id);
    return {
      id: cost.id,
      displayName: cost.name,
      confidence: cost.confidence,
      devHours: time?.total_hours ?? 0,
      polarPrice: cost.price_breakdown.polar_price,
      activityScore: meta?.activity_score ?? 0,
      commitVelocity: meta?.enhanced_metrics?.commits_analysis?.commit_velocity_per_week ?? 0,
      utilizationRate: time?.utilization_rate ?? 0,
      pageviews: pageviewsById.get(cost.id) ?? 0,
    };
  });
}

function _calculatePriorityScore(entry: _JoinedRaw, max: _MaxValues): number {
  const norm = (val: number, maxVal: number) => maxVal > 0 ? val / maxVal : 0;
  const score =
    0.30 * norm(entry.devHours,       max.devHours)       * 100 +
    0.25 * norm(entry.polarPrice,     max.polarPrice)     * 100 +
    0.25 * norm(entry.activityScore,  max.activityScore)  * 100 +
    0.15 * norm(entry.commitVelocity, max.commitVelocity) * 100 +
    (entry.confidence === 'high' ? 5 : 0);
  return Math.round(score * 100) / 100;
}

// Effort-independent demand: what audiences/buyers actually want, as distinct
// from how much has been built/priced/committed to. Previously this was
// polarPrice/activityScore/commitVelocity only (5/13, 5/13, 3/13) — entirely
// supply-side signal wearing a "demand" label, since activityScore and
// commitVelocity are both dev-activity proxies, not audience signal.
//
// pageviews (real /<unppp-id> traffic, from public/data/unppp-pageviews.json)
// is now the largest weight as the only genuine external demand signal.
// polarPrice stays second — price is a legitimate demand signal (willingness
// to pay), just not the only one. activityScore/commitVelocity are shrunk,
// not zeroed — recent commit activity has some correlation with "someone
// asked for this," but it's the weakest proxy of the four.
//
// OPEN QUESTION FOR REPO OWNER: this split is a starting point, not validated
// against real traffic yet (the pageview snapshot is freshly wired up — see
// public/data/unppp-pageviews.json's generated_at). Revisit after a few
// weeks of real snapshots. devHours is still excluded — comparing effort to
// itself.
const DEMAND_WEIGHTS = { pageviews: 5 / 13, polarPrice: 4 / 13, activityScore: 3 / 13, commitVelocity: 1 / 13 };

function _calculateDemandScore(entry: _JoinedRaw, max: _MaxValues): number {
  const norm = (val: number, maxVal: number) => maxVal > 0 ? val / maxVal : 0;
  const score =
    DEMAND_WEIGHTS.pageviews      * norm(entry.pageviews,      max.pageviews)      * 100 +
    DEMAND_WEIGHTS.polarPrice     * norm(entry.polarPrice,     max.polarPrice)     * 100 +
    DEMAND_WEIGHTS.activityScore  * norm(entry.activityScore,  max.activityScore)  * 100 +
    DEMAND_WEIGHTS.commitVelocity * norm(entry.commitVelocity, max.commitVelocity) * 100;
  return Math.round(score * 100) / 100;
}

export function getUnpppPriorityData(): UnpppPriorityEntry[] {
  const joined = joinUnpppData();
  const max: _MaxValues = {
    devHours:       Math.max(...joined.map(e => e.devHours)),
    polarPrice:     Math.max(...joined.map(e => e.polarPrice)),
    activityScore:  Math.max(...joined.map(e => e.activityScore)),
    commitVelocity: Math.max(...joined.map(e => e.commitVelocity)),
    pageviews:      Math.max(...joined.map(e => e.pageviews)),
  };
  return joined
    .map(entry => ({
      id:              entry.id,
      displayName:     entry.displayName,
      priorityScore:   _calculatePriorityScore(entry, max),
      demandScore:     _calculateDemandScore(entry, max),
      confidence:      entry.confidence,
      devHours:        entry.devHours,
      polarPrice:      entry.polarPrice,
      activityScore:   entry.activityScore,
      commitVelocity:  entry.commitVelocity,
      utilizationRate: entry.utilizationRate,
      pageviews:       entry.pageviews,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

type _UnpppConfigEntry = typeof UnpppsConfig.unppps[number];

export type EnrichedUnppp = _UnpppConfigEntry & {
  dynamicPriorityScore: number;
  dynamicPriorityRank: number;
};

export function getEnrichedUnpppConfig(): EnrichedUnppp[] {
  const scoreMap = new Map(getUnpppPriorityData().map(e => [e.id, e.priorityScore]));

  const withScores = UnpppsConfig.unppps.map(u => ({
    ...u,
    dynamicPriorityScore: scoreMap.get(u.id) ?? 0,
    dynamicPriorityRank: 0,
  }));

  withScores.sort((a, b) => {
    const aScored = scoreMap.has(a.id);
    const bScored = scoreMap.has(b.id);
    if (aScored && bScored) return b.dynamicPriorityScore - a.dynamicPriorityScore;
    if (aScored) return -1;
    if (bScored) return 1;
    return a.priority - b.priority;
  });

  withScores.forEach((u, i) => { u.dynamicPriorityRank = i + 1; });

  return withScores;
}

export { costData as unpppCostSummaryData };

/**
 * /valuation data assembly (#1000) — joins every measured dataset behind the
 * valuation page into compact, serializable rows so the page frames itself
 * from data instead of hand-written copy:
 *
 *  - unparty-polar-unppp-cost-estimate.json — the homegrown build-cost
 *    estimate (scripts/polar-pricing.ts): measured git hours × market labor
 *    rate + measured LLM baseline + disclosed premiums. No Polar API calls.
 *  - unppp-repo-time.json — git-derived hours, sessions, commit counts and
 *    first/last commit dates per repo.
 *  - public/raw-repo-metadata.json — repo size / health / language / recency
 *    inputs that feed the estimate's premiums.
 *  - src/data/UnpppsConfig.json — identity (tagline, color, cover) and the
 *    `polarProductId` used for live pricing + embedded checkout.
 *
 * How the estimate and the live Polar price coexist:
 *  - The estimate is the WHY — what it measurably cost to build, frozen in a
 *    dated snapshot (`generatedAt`) and fully decomposable (see breakdown).
 *  - The live Polar price is the WHAT-YOU'D-PAY — the current list price on
 *    the store, fetched client-side per `polarProductId` from
 *    GET /api/unppp/price (the same path Stats.tsx uses) and never checked
 *    in. The page derives the list:build ratio per unppp and in aggregate
 *    rather than asserting a relationship in prose.
 *
 * Even the methodology "constants" ($/hr rates, infra pool) are re-derived
 * here from the shipped dataset instead of being repeated as copy — if the
 * pricing script's assumptions change, this page follows automatically.
 */

import costData from '../../unparty-polar-unppp-cost-estimate.json';
import unpppTimeData from '../../unppp-repo-time.json';
import repoMetadata from '../../public/raw-repo-metadata.json';
import UnpppsConfig from '../data/UnpppsConfig.json';
import { resolveCoverSrc } from '../app/utils/coverPath';
import type { UnpppCostEntry, UnpppTimeEntry } from './unpppPriority';

interface _TimeEntryFull extends UnpppTimeEntry {
  status: string;
  session_count: number;
  date_range?: { first_commit: string; last_commit: string };
}

interface _MetaEntry {
  name: string;
  unppp_id?: string;
  size_kb: number;
  days_since_push: number;
  enhanced_metrics: {
    community_health_score: number;
    languages_count: number;
  };
}

interface _CostEntryFull extends UnpppCostEntry {
  price_breakdown: {
    raw_dev_cost: number;
    infra_share: number;
    size_premium: number;
    health_premium: number;
    lang_premium: number;
    llm_cost: number;
    polar_price: number;
  };
}

export interface ValuationBreakdown {
  labor: number;
  llm: number;
  infra: number;
  size: number;
  health: number;
  lang: number;
}

export interface ValuationRow {
  id: string;
  tagline: string | null;
  color: string | null;
  coverSrc: string | null;
  polarProductId: string | null;
  confidence: 'high' | 'low';
  /** 1-based rank by build estimate, descending. */
  buildRank: number;
  devHours: number;
  commitCount: number;
  sessionCount: number;
  firstCommit: string | null;
  lastCommit: string | null;
  daysSincePush: number | null;
  sizeKb: number | null;
  healthScore: number | null;
  languagesCount: number | null;
  breakdown: ValuationBreakdown;
  buildEstimate: number;
}

export interface ValuationComponent {
  key: keyof ValuationBreakdown;
  label: string;
  amount: number;
  /** Share of the total build estimate, 0..1. */
  share: number;
}

export interface ValuationPortfolio {
  generatedAt: string;
  unpppCount: number;
  measuredCount: number;
  totalDevHours: number;
  totalBuildEstimate: number;
  totalCommits: number;
  totalSessions: number;
  firstCommit: string | null;
  lastCommit: string | null;
  /** Derived: Σ labor ÷ Σ measured hours — not restated from the script. */
  laborRatePerHour: number;
  /** Derived: Σ llm cost ÷ Σ measured hours. */
  llmRatePerHour: number;
  /** Derived: Σ infra shares — the annual infra pool split across unppps. */
  infraPoolTotal: number;
  llmBaselineCost: number;
  llmBaselineRange: string;
  /** Sorted by amount descending. */
  components: ValuationComponent[];
}

export interface ValuationData {
  portfolio: ValuationPortfolio;
  rows: ValuationRow[];
}

const COMPONENT_LABELS: Record<keyof ValuationBreakdown, string> = {
  labor: 'measured labor',
  llm: 'llm baseline',
  infra: 'infra share',
  size: 'repo size',
  health: 'repo health',
  lang: 'languages',
};

export function getValuationData(): ValuationData {
  const configById = new Map(
    UnpppsConfig.unppps.map(u => [u.id, u as typeof u & { polarProductId?: string | null }])
  );
  const timeByRepoId = new Map<string, _TimeEntryFull>(
    (unpppTimeData.repositories as _TimeEntryFull[])
      .filter(r => r.status === 'analyzed')
      .map(r => [r.repo_id, r])
  );
  // raw-repo-metadata.json is keyed by the actual GitHub repo name, which can
  // differ from the unppp id — prefer the explicit unppp_id bridge, falling
  // back to a name match (same join scripts/polar-pricing.ts performs).
  const metaEntries = repoMetadata as unknown as _MetaEntry[];
  const metaFor = (id: string): _MetaEntry | undefined =>
    metaEntries.find(m => m.unppp_id === id) ?? metaEntries.find(m => m.name === id);

  const rows: ValuationRow[] = (costData.unppps as _CostEntryFull[])
    .map(cost => {
      const config = configById.get(cost.id);
      const time = timeByRepoId.get(cost.id);
      const meta = metaFor(cost.id);
      return {
        id: cost.id,
        tagline: config?.tagline ?? null,
        color: config?.color ?? null,
        coverSrc: config?.cover ? resolveCoverSrc(config.cover) : null,
        polarProductId: config?.polarProductId ?? null,
        confidence: cost.confidence,
        buildRank: 0,
        devHours: cost.total_hours,
        commitCount: time?.commit_count ?? 0,
        sessionCount: time?.session_count ?? 0,
        firstCommit: time?.date_range?.first_commit ?? null,
        lastCommit: time?.date_range?.last_commit ?? null,
        daysSincePush: meta?.days_since_push ?? null,
        sizeKb: meta?.size_kb ?? null,
        healthScore: meta?.enhanced_metrics?.community_health_score ?? null,
        languagesCount: meta?.enhanced_metrics?.languages_count ?? null,
        breakdown: {
          labor: cost.price_breakdown.raw_dev_cost,
          llm: cost.price_breakdown.llm_cost,
          infra: cost.price_breakdown.infra_share,
          size: cost.price_breakdown.size_premium,
          health: cost.price_breakdown.health_premium,
          lang: cost.price_breakdown.lang_premium,
        },
        buildEstimate: cost.price_breakdown.polar_price,
      };
    })
    .sort((a, b) => b.buildEstimate - a.buildEstimate);
  rows.forEach((row, i) => { row.buildRank = i + 1; });

  const totals: ValuationBreakdown = { labor: 0, llm: 0, infra: 0, size: 0, health: 0, lang: 0 };
  let totalBuildEstimate = 0;
  let totalCommits = 0;
  let totalSessions = 0;
  let firstCommit: string | null = null;
  let lastCommit: string | null = null;
  for (const row of rows) {
    for (const key of Object.keys(totals) as (keyof ValuationBreakdown)[]) {
      totals[key] += row.breakdown[key];
    }
    totalBuildEstimate += row.buildEstimate;
    totalCommits += row.commitCount;
    totalSessions += row.sessionCount;
    if (row.firstCommit && (!firstCommit || row.firstCommit < firstCommit)) firstCommit = row.firstCommit;
    if (row.lastCommit && (!lastCommit || row.lastCommit > lastCommit)) lastCommit = row.lastCommit;
  }

  const summary = costData.summary;
  const totalDevHours = summary.total_dev_hours;

  const components: ValuationComponent[] = (Object.keys(totals) as (keyof ValuationBreakdown)[])
    .map(key => ({
      key,
      label: COMPONENT_LABELS[key],
      amount: totals[key],
      share: totalBuildEstimate > 0 ? totals[key] / totalBuildEstimate : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    portfolio: {
      generatedAt: costData.generated_at,
      unpppCount: summary.unppp_count,
      measuredCount: summary.high_confidence_count,
      totalDevHours,
      totalBuildEstimate,
      totalCommits,
      totalSessions,
      firstCommit,
      lastCommit,
      laborRatePerHour: totalDevHours > 0 ? totals.labor / totalDevHours : 0,
      llmRatePerHour: totalDevHours > 0 ? totals.llm / totalDevHours : 0,
      infraPoolTotal: totals.infra,
      llmBaselineCost: costData.llm_baseline.total_cost,
      llmBaselineRange: costData.llm_baseline.date_range,
      components,
    },
    rows,
  };
}

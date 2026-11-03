// Polar product pricing calculator for unparty repos.
// Methodology documented in: theunpartyapp/how-much-unparty-app-cost-v1.md
//
// Usage:
//   npx tsx scripts/polar-pricing.ts [repo_id]
//   npx tsx scripts/polar-pricing.ts theunpartysomewhere
//   npx tsx scripts/polar-pricing.ts            ← prints summary table + writes JSON

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { hourlyRate, type Baseline } from "../src/lib/baseline";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface UnpppEntry {
  id: string;
  name: string;
}

interface UnpppsConfig {
  unppps: UnpppEntry[];
}

interface RepoTimeEntry {
  repo_id: string;
  name: string;
  description: string;
  total_hours: number;
  commit_count: number;
  session_count: number;
  status: string;
}

interface RepoTimeData {
  repositories: RepoTimeEntry[];
}

interface CommitsAnalysis {
  total_recent_commits: number;
  ai_coauthor_commits: number;
  claude_commits: number;
  unique_authors: number;
  avg_commit_message_length: number;
  conventional_commits_ratio: number;
  commit_velocity_per_week: number;
  unique_authors_3mo: number;
}

interface ActivePeriodMetrics {
  weeks_with_commits: number;
  max_commits_in_week: number;
  burst_weeks_count: number;
  total_weeks_tracked: number;
  active_period_ratio: number;
  active_velocity: number;
}

interface TimeBoundedCommits {
  commits_last_5_days: number;
  commits_last_7_days: number;
  commits_last_30_days: number;
  weighted_activity_score: number;
  unique_authors_5d: number;
  unique_authors_7d: number;
  unique_authors_30d: number;
  sprint_velocity_daily: number;
  sprint_velocity_weekly: number;
  sprint_velocity_monthly: number;
}

interface EnhancedMetrics {
  languages_count: number;
  languages_detail: Record<string, number>;
  contributors_count: number;
  releases_count: number;
  latest_release_date: string;
  community_health_score: number;
  has_readme: boolean;
  has_contributing_guide: boolean;
  has_code_of_conduct: boolean;
  commits_analysis: CommitsAnalysis;
  active_period_metrics: ActivePeriodMetrics;
  time_bounded_commits: TimeBoundedCommits;
}

interface RepoMetadata {
  name: string;
  unppp_id?: string;
  full_name: string;
  description: string;
  owner_type: string;
  language: string;
  stars: number;
  forks: number;
  issues: number;
  size_kb: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  days_since_push: number;
  default_branch: string;
  visibility: string;
  url: string;
  topics: string[];
  license: string;
  archived: boolean;
  disabled: boolean;
  is_fork: boolean;
  watchers_count: number;
  network_count: number;
  subscribers_count: number;
  has_wiki: boolean;
  has_pages: boolean;
  has_projects: boolean;
  has_discussions: boolean;
  activity_score: number;
  analysis_date: string;
  enhanced_metrics: EnhancedMetrics;
}

interface LLMSummary {
  total_cost: number;
  total_requests: number;
  total_users: number;
  date_range: string;
}

interface LLMDashboard {
  summary: LLMSummary;
  efficiency: unknown;
  trends: unknown;
  top_users: unknown;
  models: unknown;
  optimization: unknown;
}

interface PriceBreakdown {
  raw_dev_cost: number;
  infra_share: number;
  size_premium: number;
  health_premium: number;
  lang_premium: number;
  llm_cost: number;
  polar_price: number;
}

interface UnpppEstimate {
  id: string;
  name: string;
  confidence: "high" | "low";
  total_hours: number;
  hours_share: number;
  price_breakdown: PriceBreakdown;
  llm_cost: number;
}

interface EstimateOutput {
  generated_at: string;
  llm_baseline: {
    source: string;
    total_cost: number;
    date_range: string;
  };
  summary: {
    unppp_count: number;
    high_confidence_count: number;
    low_confidence_count: number;
    total_dev_hours: number;
    total_polar_price: number;
    total_llm_cost: number;
  };
  unppps: UnpppEstimate[];
}

// ─── Data sources ─────────────────────────────────────────────────────────────

const unpppsConfig: UnpppsConfig = JSON.parse(
  readFileSync(join(__dirname, "..", "src", "data", "UnpppsConfig.json"), "utf-8")
);

const repoTimeData: RepoTimeData = JSON.parse(
  readFileSync(join(__dirname, "..", "unppp-repo-time.json"), "utf-8")
);

const rawRepoMetadata: RepoMetadata[] = JSON.parse(
  readFileSync(join(__dirname, "..", "public", "raw-repo-metadata.json"), "utf-8")
);

const llmDashboard: LLMDashboard = JSON.parse(
  readFileSync(join(__dirname, "..", "llm-baseline.json"), "utf-8")
);

// ─── Pricing constants (how-much-unparty-app-cost-v1.md) ─────────────────────

// Labor rate and LLM rate come from FoundersConfig `baseline`, the same numbers
// GoalBudget prices a goal with (src/lib/baseline.ts): the median of its market
// pay benchmarks (a machine-learning engineer's $155,000 and a seed-stage
// founder's $147,000 a year) over 2,080 full-time hours, and the measured LLM
// cost an hour (how-unparty-created-llm-baseline.md). An earlier draft of this
// methodology also folded in a demographic-specific BLS wage statistic as a
// third input to the median; that input has been removed as indefensible (no
// stated rationale for that specific cut, and no place in a labor-rate
// justification) — this is a market-rate-only calculation now. See /valuation
// for the full writeup.
const foundersConfig: { baseline?: Baseline } = JSON.parse(
  readFileSync(join(__dirname, "..", "src", "data", "FoundersConfig.json"), "utf-8")
);
if (!foundersConfig.baseline) {
  console.error("FoundersConfig.json has no baseline to price with");
  process.exit(1);
}
const BASELINE = foundersConfig.baseline;
const LABOR_CHARGE_PER_HOUR = hourlyRate(BASELINE);
const BASELINE_LLM_PER_HOUR = BASELINE.llmPerHour;
const INFRA_ANNUAL_TOTAL = 4045;
const INFRA_REPO_COUNT = unpppsConfig.unppps.length;
const INFRA_SHARE_PER_REPO = INFRA_ANNUAL_TOTAL / INFRA_REPO_COUNT;

// Tune multipliers here; set to 0 to disable a factor.
const SIZE_PREMIUM_PER_KB = 1 / 1000;      // $1 per 1,000 KB
const HEALTH_PREMIUM_MAX = 200;             // up to $200 at score 100
const LANG_PREMIUM_PER_EXTRA = 25;          // $25 per language beyond the first

// ─── Core calculation ─────────────────────────────────────────────────────────

function calcPolarPrice(hours: number, meta: RepoMetadata | undefined): PriceBreakdown {
  const raw_dev_cost = hours * LABOR_CHARGE_PER_HOUR;
  const infra_share = INFRA_SHARE_PER_REPO;
  const size_premium = meta ? meta.size_kb * SIZE_PREMIUM_PER_KB : 0;
  const health_premium = meta
    ? (meta.enhanced_metrics.community_health_score / 100) * HEALTH_PREMIUM_MAX
    : 0;
  const lang_premium = meta
    ? Math.max(0, meta.enhanced_metrics.languages_count - 1) * LANG_PREMIUM_PER_EXTRA
    : 0;
  const llm_cost = hours * BASELINE_LLM_PER_HOUR;
  const polar_price = raw_dev_cost + infra_share + size_premium + health_premium + lang_premium + llm_cost;
  return { raw_dev_cost, infra_share, size_premium, health_premium, lang_premium, llm_cost, polar_price };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Build full estimate list (master: UnpppsConfig) ─────────────────────────

const totalHours = repoTimeData.repositories
  .filter((r) => r.status === "analyzed")
  .reduce((sum, r) => sum + r.total_hours, 0);

const llmTotalCost = llmDashboard.summary.total_cost;

const estimates: UnpppEstimate[] = unpppsConfig.unppps.map((unppp) => {
  const timeEntry = repoTimeData.repositories.find(
    (r) => r.repo_id === unppp.id && r.status === "analyzed"
  );
  // raw-repo-metadata.json is keyed by the actual GitHub repo name (m.name),
  // which can differ from the unppp id (e.g. theunpartycharette's repo is
  // "uncolor-ios"). m.unppp_id is written by theunpartyrunway specifically
  // to bridge that gap — prefer it, falling back to a name match for any
  // older entries that predate the field.
  const meta =
    rawRepoMetadata.find((m) => m.unppp_id === unppp.id) ??
    rawRepoMetadata.find((m) => m.name === unppp.id);

  const hours = timeEntry?.total_hours ?? 0;
  const confidence: "high" | "low" = timeEntry ? "high" : "low";
  const hours_share = totalHours > 0 ? hours / totalHours : 0;
  const breakdown = calcPolarPrice(hours, meta);

  return {
    id: unppp.id,
    name: unppp.name,
    confidence,
    total_hours: round2(hours),
    hours_share: round2(hours_share * 100) / 100,
    price_breakdown: {
      raw_dev_cost: round2(breakdown.raw_dev_cost),
      infra_share: round2(breakdown.infra_share),
      size_premium: round2(breakdown.size_premium),
      health_premium: round2(breakdown.health_premium),
      lang_premium: round2(breakdown.lang_premium),
      llm_cost: round2(breakdown.llm_cost),
      polar_price: round2(breakdown.polar_price),
    },
    llm_cost: round2(breakdown.llm_cost),
  };
});

estimates.sort((a, b) => b.total_hours - a.total_hours);

// ─── Console output helpers ───────────────────────────────────────────────────

function printSingleRepo(estimate: UnpppEstimate): void {
  const { price_breakdown: bd, total_hours, confidence } = estimate;
  const meta =
    rawRepoMetadata.find((m) => m.unppp_id === estimate.id) ??
    rawRepoMetadata.find((m) => m.name === estimate.id);

  console.log(`\n${"─".repeat(52)}`);
  console.log(`  ${estimate.name} (${estimate.id})`);
  if (confidence === "low") console.log(`  ⚠  confidence: low — no measured hours`);
  console.log(`${"─".repeat(52)}`);
  console.log(`  Actual Hours          ${total_hours.toFixed(2)}h`);
  console.log(`  Labor Charge          ${fmt(LABOR_CHARGE_PER_HOUR)}/hr`);
  console.log(`  LLM Rate              $${BASELINE_LLM_PER_HOUR}/hr`);
  console.log(`  Raw Dev Cost          ${fmt(bd.raw_dev_cost)}`);
  console.log(`  LLM Cost              ${fmt(bd.llm_cost)}  (${total_hours.toFixed(1)}h × $${BASELINE_LLM_PER_HOUR}/hr)`);
  console.log(`  Infrastructure Share  ${fmt(bd.infra_share)}`);
  console.log(`  Size Premium          ${fmt(bd.size_premium)}  (${meta?.size_kb ?? 0} KB)`);
  console.log(`  Health Premium        ${fmt(bd.health_premium)}  (score ${meta?.enhanced_metrics.community_health_score ?? 0}/100)`);
  console.log(`  Language Premium      ${fmt(bd.lang_premium)}  (${meta?.enhanced_metrics.languages_count ?? 0} languages)`);
  console.log(`${"─".repeat(52)}`);
  console.log(`  Polar Price           ${fmt(bd.polar_price)}`);
  console.log(`${"─".repeat(52)}`);
}

function printSummaryTable(ests: UnpppEstimate[]): void {
  const col = (s: string, w: number) => s.slice(0, w).padEnd(w);
  const header = `${"─".repeat(74)}\n  ${col("ID", 30)} ${col("HRS", 6)} ${"CONF".padEnd(5)} ${"PRICE".padStart(8)} ${"LLM $".padStart(7)}\n${"─".repeat(74)}`;
  console.log(header);
  for (const e of ests) {
    const conf = e.confidence === "high" ? "high " : "low ⚠";
    console.log(
      `  ${col(e.id, 30)} ${e.total_hours.toFixed(1).padStart(6)} ${conf} ${fmt(e.price_breakdown.polar_price).padStart(8)} ${fmt(e.llm_cost).padStart(7)}`
    );
  }
  console.log(`${"─".repeat(74)}`);
  const totalPrice = ests.reduce((s, e) => s + e.price_breakdown.polar_price, 0);
  const totalLlmCost = ests.reduce((s, e) => s + e.llm_cost, 0);
  console.log(`  ${"TOTAL".padEnd(30)} ${totalHours.toFixed(1).padStart(6)}       ${fmt(totalPrice).padStart(8)} ${fmt(totalLlmCost).padStart(7)}`);
  console.log(`${"─".repeat(74)}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const targetId = process.argv[2];

if (targetId) {
  const estimate = estimates.find((e) => e.id === targetId);
  if (!estimate) {
    console.error(`"${targetId}" not found in UnpppsConfig.json`);
    process.exit(1);
  }
  printSingleRepo(estimate);
} else {
  const highCount = estimates.filter((e) => e.confidence === "high").length;
  const lowCount = estimates.filter((e) => e.confidence === "low").length;
  const totalPolarPrice = round2(estimates.reduce((s, e) => s + e.price_breakdown.polar_price, 0));

  console.log(`\nPolar Pricing — ${estimates.length} unppps (${highCount} high confidence, ${lowCount} low)`);
  printSummaryTable(estimates);

  const output: EstimateOutput = {
    generated_at: new Date().toISOString(),
    llm_baseline: {
      source: "llm-baseline.json",
      total_cost: llmTotalCost,
      date_range: llmDashboard.summary.date_range,
    },
    summary: {
      unppp_count: estimates.length,
      high_confidence_count: highCount,
      low_confidence_count: lowCount,
      total_dev_hours: round2(totalHours),
      total_polar_price: totalPolarPrice,
      total_llm_cost: round2(estimates.reduce((s, e) => s + e.llm_cost, 0)),
    },
    unppps: estimates,
  };

  const outputPath = join(__dirname, "..", "unparty-polar-unppp-cost-estimate.json");
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote → ${outputPath}`);
}

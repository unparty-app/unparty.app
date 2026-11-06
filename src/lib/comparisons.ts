/**
 * The owner's repo next to public repos of a similar scale (#561), from
 * src/data/comparisons.json (npm run measure:comparisons, on the owner's
 * machine): pull requests merged month by month over a year, issues opened,
 * and how many people did the merging. /founders draws it as InkTimeline's
 * lines, one running total per repo, so someone outside the field can see
 * what one person's year of work compares to.
 *
 * The chart compares like with like: it starts the month the owner's pull
 * requests reach a steady flow (STEADY: a fifth of their busiest month, and
 * at least 10), since work committed straight to main before then never
 * shows up as pull requests, and every repo is cut to the same months. A repo
 * with no merged pull requests in them is left out: dormant isn't a comparison.
 *
 * Measurements only. The sentences say how each number was counted, and that
 * a pull request's size differs from repo to repo. A copy ships with no
 * comparisons until its owner measures their own.
 */
import 'server-only';
import data from '@/data/comparisons.json';
import type { TimelineSeries } from '@/app/components/resume/types';

interface Month {
  month: string;
  prs: number;
  issues: number;
}
interface Repo {
  repo: string;
  name: string;
  mine?: boolean;
  people: number;
  months: Month[];
}
interface Comparisons {
  measured?: string;
  since?: string;
  regular?: number;
  // The owner's whole account over the same months
  account?: { owner: string; repos: number; prs: number; issues: number };
  repos?: Repo[];
}

const COMPARISONS = data as Comparisons;
const sum = (months: Month[], key: 'prs' | 'issues') => months.reduce((total, m) => total + m[key], 0);

export interface RepoTotals {
  prs: number;
  issues: number;
  people: number;
  since: string;
}

/** The owner's whole account (every repo the site's repo sits beside) over the measured year */
export function accountActivity(): { repos: number; prs: number; issues: number } | null {
  return COMPARISONS.account ?? null;
}

/** The owner's own repo, totalled over the measured year */
export function ownActivity(): RepoTotals | null {
  const mine = COMPARISONS.repos?.find((r) => r.mine);
  if (!mine || !COMPARISONS.since) return null;
  return { prs: sum(mine.months, 'prs'), issues: sum(mine.months, 'issues'), people: mine.people, since: COMPARISONS.since };
}

// Where the owner's pull requests count as steady: this share of their busiest month, and at least FLOOR
const STEADY = 0.2;
const FLOOR = 10;

export interface ComparisonChart {
  series: TimelineSeries[];
  label: string;
  // The first month compared (YYYY-MM), and the owner's totals from it
  since: string;
  mine: { prs: number; people: number };
  comps: Array<{ name: string; repo: string; prs: number; issues: number; people: number }>;
  regular: number;
}

/** The lines to draw, the owner's first (`ownName` names it), or null with nothing to compare */
export function comparisonChart(ownName: string): ComparisonChart | null {
  const repos = COMPARISONS.repos ?? [];
  const mine = repos.find((r) => r.mine);
  const others = repos.filter((r) => !r.mine);
  if (!mine || !others.length) return null;
  // From the month the owner's pull requests are steady, every repo cut to the same months
  const busiest = Math.max(...mine.months.map((m) => m.prs));
  const start = mine.months.findIndex((m) => m.prs >= Math.max(FLOOR, busiest * STEADY));
  if (start < 0) return null;
  const since = mine.months[start].month;
  const cut = (r: Repo): Repo => ({ ...r, months: r.months.filter((m) => m.month >= since) });
  const compared = others.map(cut).filter((r) => sum(r.months, 'prs') > 0);
  if (!compared.length) return null;
  const own = cut(mine);
  const ordered = [own, ...compared.sort((a, b) => sum(a.months, 'prs') - sum(b.months, 'prs'))];
  const series: TimelineSeries[] = ordered.map((r) => {
    let total = 0;
    return {
      name: `${r.mine ? ownName : r.name} · ${r.people}`,
      months: r.months.map((m) => ({ month: m.month, count: m.prs, total: (total += m.prs) })),
    };
  });
  return {
    series,
    label: `Pull requests merged each month since ${since}, as running totals: ${ordered.map((r) => `${r.mine ? ownName : r.name} ${sum(r.months, 'prs')} with ${r.people} ${r.people === 1 ? 'person' : 'people'}`).join(', ')}`,
    since,
    mine: { prs: sum(own.months, 'prs'), people: own.people },
    comps: compared.map((r) => ({ name: r.name, repo: r.repo, prs: sum(r.months, 'prs'), issues: sum(r.months, 'issues'), people: r.people })),
    regular: COMPARISONS.regular ?? 5,
  };
}

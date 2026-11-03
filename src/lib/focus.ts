/**
 * Where the site owner's hours went, week by week (#453): RepoFocus's data.
 *
 * scripts/generate-focus.mjs measures each repo's hours from its commits on
 * every build (work sessions, the baseline's way) and next.config hands the
 * file over as FOCUS_JSON. This shapes it for the chart: the repos with the
 * most hours, the rest folded into one row, what each released and when (the
 * owner's releases, src/lib/releases.ts), the baseline's hourly rate, and one
 * sentence saying how the focus moved. Nothing measured is kept in the repo.
 *
 * Without the file, or with no hours in it, there's no focus (null).
 */
import 'server-only';
import { BASELINE, PRIVATE_REPOS_ON } from '@/app/constants/organization';
import { buildCost, hourlyRate } from '@/lib/baseline';
import { allReleases } from '@/lib/releases';
import { repoReleaseBelts } from '@/lib/project-belt';
import type { FocusData, FocusRow } from '@/app/components/resume/types';

interface FocusFile {
  generatedAt?: string | null;
  weeks: string[];
  repos: Array<{ repo: string; private?: boolean; hours: number[] }>;
}

// Rows before the rest fold into "everything else"
const SHOWN = 5;
// The last weeks that count as now; the ones before are where the focus was
const RECENT = 4;
// A repo that had at least this many hours before and none since went quiet
const QUIET_HOURS = 2;
// Now against before, a week on average: past these it's rising or easing
const RISING = 1.25;
const EASING = 0.75;

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const round = (hours: number) => Math.round(hours * 10) / 10;

function readFile(): FocusFile | null {
  try {
    const file = JSON.parse(process.env.FOCUS_JSON || '{}') as Partial<FocusFile>;
    return file.weeks?.length && file.repos?.length ? (file as FocusFile) : null;
  } catch {
    return null;
  }
}

// The repo with the most hours in these weeks, or null when none had any
function most(rows: FocusRow[], from: number, to: number): FocusRow | null {
  let best: FocusRow | null = null;
  let bestHours = 0;
  for (const row of rows) {
    const hours = sum(row.hours.slice(from, to));
    if (hours > bestHours) [best, bestHours] = [row, hours];
  }
  return best;
}

// Now against before, in a word
function trendOf(hours: number[], split: number): FocusRow['trend'] {
  const now = sum(hours.slice(split)) / Math.max(1, hours.length - split);
  const before = sum(hours.slice(0, split)) / Math.max(1, split);
  if (now === 0) return 'quiet';
  if (before === 0) return 'new';
  return now > before * RISING ? 'rising' : now < before * EASING ? 'easing' : 'steady';
}

// How the focus moved, in one plain sentence
function sentenceOf(rows: FocusRow[], weeks: number): string {
  const split = Math.max(0, weeks - RECENT);
  const now = most(rows, split, weeks);
  const before = most(rows, 0, split);
  const lead = !now
    ? `nothing new in the last ${RECENT} weeks.`
    : before && before !== now
      ? `your focus moved from ${before.name} to ${now.name}.`
      : before
        ? `most of your hours went to ${now.name}, and still do.`
        : `most of your hours went to ${now.name}.`;

  const quiet = rows
    .filter(row => !row.folded && sum(row.hours.slice(split)) === 0 && sum(row.hours.slice(0, split)) >= QUIET_HOURS)
    .sort((a, b) => sum(b.hours) - sum(a.hours))[0];
  if (!quiet) return lead;
  const released = quiet.releases[quiet.releases.length - 1];
  return `${lead} ${quiet.name} went quiet${released ? ` after ${released.tag}` : ''}.`;
}

/**
 * Every repo with hours in the weeks, most hours first, private ones only
 * while they're on: what the rows below are made from, and what /build's
 * KINDS. sums by kind of build (src/lib/build-story.ts). Null without any
 */
export function focusRepos(): { generatedAt: string | null; weeks: string[]; repos: Array<{ repo: string; hours: number[]; total: number }> } | null {
  const file = readFile();
  if (!file) return null;
  // The build leaves private repos out unless they're on; a switch turned off
  // since then still hides them
  const repos = file.repos
    .filter(repo => PRIVATE_REPOS_ON || !repo.private)
    .map(repo => ({ repo: repo.repo, hours: repo.hours, total: sum(repo.hours) }))
    .filter(repo => repo.total > 0)
    .sort((a, b) => b.total - a.total);
  return repos.length ? { generatedAt: file.generatedAt ?? null, weeks: file.weeks, repos } : null;
}

export function focusData(): FocusData | null {
  const measured = focusRepos();
  if (!measured) return null;
  const { weeks, repos } = measured;
  const start = Date.parse(`${weeks[0]}T00:00:00Z`);
  const weekOf = (date: string | null) => {
    if (!date) return -1;
    const index = Math.floor((Date.parse(date) - start) / (7 * 24 * 60 * 60 * 1000));
    return index >= 0 && index < weeks.length ? index : -1;
  };

  const releasesOf = (repos: string[]) =>
    allReleases()
      .filter(release => repos.includes(release.repo))
      // Oldest first, so the last is the newest
      .sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''))
      .map(release => ({ week: weekOf(release.publishedAt), tag: release.tag }))
      .filter(release => release.week >= 0);


  // The rest fold in only when there are two or more of them
  const shown = repos.length > SHOWN + 1 ? repos.slice(0, SHOWN) : repos;
  const rest = repos.slice(shown.length);
  const split = Math.max(0, weeks.length - RECENT);
  const belts = repoReleaseBelts();
  const row = (name: string, hours: number[], names: string[], folded?: number): FocusRow => {
    const total = round(sum(hours));
    return {
      name,
      hours,
      total,
      trend: trendOf(hours, split),
      lastWeek: hours.findLastIndex(value => value > 0),
      releases: releasesOf(names),
      price: BASELINE ? Math.round(buildCost(total, BASELINE).total) : null,
      take: folded ? [] : (belts[name.toLowerCase()]?.releases ?? []),
      ...(folded ? { folded } : {}),
    };
  };
  const rows = shown.map(repo => row(repo.repo, repo.hours, [repo.repo]));
  if (rest.length) {
    const hours = weeks.map((_, index) => round(sum(rest.map(repo => repo.hours[index] ?? 0))));
    rows.push(row('everything else', hours, rest.map(repo => repo.repo), rest.length));
  }
  // Where it opens: the repo with the most hours now, else the most overall
  const now = most(rows.filter(r => !r.folded), split, weeks.length);

  return {
    weeks,
    recent: Math.min(RECENT, weeks.length),
    rows,
    focus: now ? rows.indexOf(now) : 0,
    totalHours: round(sum(repos.map(repo => repo.total))),
    rate: BASELINE ? hourlyRate(BASELINE) : null,
    sentence: sentenceOf(rows, weeks.length),
  };
}

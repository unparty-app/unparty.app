#!/usr/bin/env node

/**
 * Org-wide Commit Analysis
 *
 * Rerunnable replacement for the one-off, hand-transcribed analysis behind
 * public/covers/stories/story-027.md ("GROW."). Walks local sibling git repos
 * on disk and recomputes full-year / year-to-date / current-year-monthly
 * commit stats directly from `git log` — no hardcoded year buckets, so the
 * same script produces comparable 2024/2025/2026(+) figures on every run.
 *
 * Usage: node scripts/org-commit-analysis.js [options]
 *
 * Options:
 *   --base-dir <path>     Root to scan for sibling repos.
 *                         Default: parent of this repo, or $UNPARTY_ORG_BASE_DIR
 *   --years <list>        Comma-separated years to analyze (default: "2024,2025,2026")
 *   --ytd-cutoff <MM-DD>  Month-day applied to every year for a fair YTD window
 *                         (default: today's MM-DD)
 *   --max-depth <n>       `find` maxdepth for .git discovery (default: 4)
 *   --top <n>             Top-N repos/contributors retained per period (default: 20)
 *   --out <path>          Output JSON path (default: public/org-commit-analysis.json)
 *   --json                Also print the full result to stdout
 *   --help                Show this help
 *
 * Notes:
 *   - Read-only: only runs `find` and `git log` against sibling repos. Never
 *     writes to any repo other than this one (the JSON output).
 *   - Date/hour/day-of-week bucketing is derived by regexing each commit's
 *     ISO-with-offset date string directly, not via `new Date().getHours()`,
 *     so results reflect each commit's own local time rather than the
 *     analysis machine's timezone.
 */

import { execFileSync } from 'child_process';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================================
// ARGS
// ============================================================================

// The site's GitHub account and the founder's own GitHub login, from
// src/data/FoundersConfig.json
function defaultAllowedOwners() {
  try {
    const { site, founder } = JSON.parse(readFileSync(resolve(ROOT_DIR, 'src/data/FoundersConfig.json'), 'utf8'));
    const founderLogins = (founder.links ?? [])
      .map(link => link.url.match(/^https:\/\/github\.com\/([^/?#]+)\/?$/)?.[1])
      .filter(Boolean);
    return [...new Set([site.github, ...founderLogins].filter(Boolean).map(owner => owner.toLowerCase()))];
  } catch {
    return [];
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    baseDir: process.env.UNPARTY_ORG_BASE_DIR || resolve(ROOT_DIR, '..'),
    years: [2024, 2025, 2026],
    ytdCutoff: null,
    maxDepth: 4,
    top: 20,
    out: resolve(ROOT_DIR, 'public/org-commit-analysis.json'),
    json: false,
    help: false,
    allowedOwners: defaultAllowedOwners(),
    includeExternal: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base-dir':
        options.baseDir = args[++i];
        break;
      case '--years':
        options.years = args[++i].split(',').map((y) => parseInt(y.trim(), 10)).filter(Number.isFinite);
        break;
      case '--ytd-cutoff':
        options.ytdCutoff = args[++i];
        break;
      case '--max-depth':
        options.maxDepth = parseInt(args[++i], 10);
        break;
      case '--top':
        options.top = parseInt(args[++i], 10);
        break;
      case '--out':
        options.out = resolve(process.cwd(), args[++i]);
        break;
      case '--allowed-owners':
        options.allowedOwners = args[++i].split(',').map((o) => o.trim().toLowerCase()).filter(Boolean);
        break;
      case '--include-external':
        options.includeExternal = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
        options.help = true;
        break;
    }
  }

  if (!options.ytdCutoff) {
    const now = new Date();
    options.ytdCutoff = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  return options;
}

function printHelp() {
  console.log(`
Org-wide Commit Analysis

Usage: node scripts/org-commit-analysis.js [options]

  --base-dir <path>     Root to scan for sibling repos (default: parent of this repo)
  --years <list>        Comma-separated years (default: "2024,2025,2026")
  --ytd-cutoff <MM-DD>  YTD cutoff applied to every year (default: today)
  --max-depth <n>       find maxdepth for .git discovery (default: 4)
  --top <n>             Top-N repos/contributors retained per period (default: 20)
  --out <path>          Output JSON path (default: public/org-commit-analysis.json)
  --allowed-owners <l>  Comma-separated GitHub owners to keep when a repo has a
                         remote (default: site.github and the founder's GitHub
                         link in FoundersConfig.json) — repos with no remote
                         are always kept; repos whose remote belongs to a
                         different owner (e.g. a reference SDK clone) are dropped
  --include-external    Disable the owner filter above and keep every repo found
  --json                Also print the full result to stdout
  --help                Show this help
`);
}

// ============================================================================
// REPO DISCOVERY
// ============================================================================

function getRemoteUrl(repoPath) {
  try {
    return execFileSync('git', ['-C', repoPath, 'remote', 'get-url', 'origin'], { encoding: 'utf-8' }).trim() || null;
  } catch {
    return null;
  }
}

function parseGithubOwnerRepo(remoteUrl) {
  if (!remoteUrl) return null;
  // Matches both https://github.com/owner/repo(.git) and git@github.com:owner/repo(.git)
  const match = remoteUrl.match(/github\.com[:/]+([^/]+)\/([^/]+?)(\.git)?\/?$/i);
  if (!match) return null;
  return { owner: match[1].toLowerCase(), repo: match[2].replace(/\.git$/i, '').toLowerCase() };
}

/**
 * Discover local sibling git repos, then filter out anything that isn't
 * actually an org repo: hidden/cache directories (.cache, .pub-cache, etc),
 * clones whose GitHub remote belongs to an unrelated owner (e.g. a full
 * `flutter/flutter` SDK checkout kept on disk for reference), and duplicate
 * local clones of the same GitHub repo (kept once, at its shallowest path,
 * to avoid double-counting commits).
 */
function discoverRepos(baseDir, maxDepth, { allowedOwners, includeExternal }) {
  let output = '';
  try {
    output = execFileSync('find', [baseDir, '-maxdepth', String(maxDepth), '-name', '.git', '-type', 'd'], {
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (err) {
    // find exits non-zero on permission-denied subdirs but still emits partial stdout
    output = err.stdout ? err.stdout.toString() : '';
  }

  const gitDirs = output
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((p) => !p.includes('/node_modules/'))
    .filter((p) => !/\/\.[^/]+\//.test(p.slice(baseDir.length))); // drop hidden dirs like .cache, .pub-cache

  const candidates = gitDirs
    .map((gitDir) => gitDir.replace(/\/\.git$/, ''))
    .sort()
    .map((repoPath) => ({ name: basename(repoPath), path: repoPath }));

  const excluded = { externalRemote: [], duplicateClone: [] };
  const byKey = new Map(); // dedupe key -> repo

  for (const repo of candidates) {
    const remoteUrl = getRemoteUrl(repo.path);
    const ownerRepo = parseGithubOwnerRepo(remoteUrl);

    if (ownerRepo && !includeExternal && !allowedOwners.includes(ownerRepo.owner)) {
      excluded.externalRemote.push({ path: repo.path, remoteUrl });
      continue;
    }

    const key = ownerRepo ? `${ownerRepo.owner}/${ownerRepo.repo}` : `local:${repo.path}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, repo);
    } else if (repo.path.split('/').length < existing.path.split('/').length) {
      // Same GitHub repo cloned in two local places — keep the shallower path
      excluded.duplicateClone.push({ path: existing.path, keptInstead: repo.path });
      byKey.set(key, repo);
    } else {
      excluded.duplicateClone.push({ path: repo.path, keptInstead: existing.path });
    }
  }

  return { repos: [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name)), excluded };
}

// ============================================================================
// PERIODS
// ============================================================================

function buildPeriods(years, ytdCutoff) {
  const [cutoffMonth, cutoffDay] = ytdCutoff.split('-').map((n) => parseInt(n, 10));
  const realNow = new Date();
  const currentYear = realNow.getFullYear();
  const currentMonth = realNow.getMonth() + 1;

  const periods = [];

  for (const year of years) {
    periods.push({
      id: `${year}-full`,
      label: `${year} (Full Year)`,
      since: `${year}-01-01`,
      until: `${year + 1}-01-01`,
      kind: 'full',
    });

    // YTD window: Jan 1 -> cutoff day (inclusive), same MM-DD across every year
    const cutoffDate = new Date(Date.UTC(year, cutoffMonth - 1, cutoffDay));
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() + 1); // exclusive upper bound
    const until = cutoffDate.toISOString().slice(0, 10);
    periods.push({
      id: `${year}-ytd`,
      label: `${year} YTD (Jan 1 – ${String(cutoffMonth).padStart(2, '0')}/${String(cutoffDay).padStart(2, '0')})`,
      since: `${year}-01-01`,
      until,
      kind: 'ytd',
    });

    // Monthly buckets, current year only (through the current, possibly-partial month)
    if (year === currentYear) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      for (let m = 1; m <= currentMonth; m++) {
        const monthSince = `${year}-${String(m).padStart(2, '0')}-01`;
        const nextMonth = m === 12 ? { y: year + 1, m: 1 } : { y: year, m: m + 1 };
        const monthUntil = `${nextMonth.y}-${String(nextMonth.m).padStart(2, '0')}-01`;
        periods.push({
          id: `${year}-${monthNames[m - 1]}`,
          label: `${monthNames[m - 1].toUpperCase()} ${year}`,
          since: monthSince,
          until: monthUntil,
          kind: 'month',
        });
      }
    }
  }

  return periods;
}

// ============================================================================
// GIT LOG EXTRACTION
// ============================================================================

const COMMIT_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;

function getRepoCommits(repoPath, earliestSince) {
  let output = '';
  try {
    output = execFileSync(
      'git',
      ['--no-pager', 'log', `--since=${earliestSince}`, '--format=%H|%an|%ae|%ad|%s', '--date=iso-strict', '--numstat'],
      { cwd: repoPath, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );
  } catch (err) {
    // Unborn HEAD / empty repo / no matching commits — treat as no history
    output = err.stdout ? err.stdout.toString() : '';
  }

  if (!output.trim()) return [];

  const lines = output.split('\n');
  const commits = [];
  let current = null;

  for (const line of lines) {
    if (line.includes('|') && line.split('|').length >= 5) {
      if (current) commits.push(current);
      const [hash, author, email, dateStr, ...messageParts] = line.split('|');
      const match = COMMIT_DATE_RE.exec(dateStr);
      if (!match) {
        current = null;
        continue;
      }
      const [, yearStr, monthStr, dayStr, hourStr] = match;
      current = {
        hash,
        author,
        email: (email || '').toLowerCase(),
        dateStr,
        dateKey: `${yearStr}-${monthStr}-${dayStr}`,
        hour: parseInt(hourStr, 10),
        dayOfWeek: DAY_LABELS[new Date(Date.UTC(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10))).getUTCDay()],
        message: messageParts.join('|'),
        linesAdded: 0,
        linesRemoved: 0,
        filesChanged: 0,
      };
    } else if (line.trim() && current) {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const added = parseInt(parts[0], 10);
        const removed = parseInt(parts[1], 10);
        if (Number.isFinite(added)) current.linesAdded += added;
        if (Number.isFinite(removed)) current.linesRemoved += removed;
        current.filesChanged += 1;
      }
    }
  }
  if (current) commits.push(current);

  return commits;
}

// ============================================================================
// AGGREGATION
// ============================================================================

function inPeriod(commit, period) {
  return commit.dateKey >= period.since && commit.dateKey < period.until;
}

function aggregate(repos, allCommitsByRepo, periods, topN) {
  const periodResults = periods.map((period) => {
    const totals = { commits: 0, activeRepos: 0, linesAdded: 0, linesRemoved: 0, netLines: 0, uniqueContributors: 0 };
    const repoCommitCounts = new Map(); // repo name -> { commits, linesAdded, linesRemoved }
    const contributorMap = new Map(); // email -> { name, commits }
    const hourlyActivity = Object.fromEntries(Array.from({ length: 24 }, (_, h) => [h, 0]));
    const dayOfWeekActivity = Object.fromEntries(DAY_LABELS.map((d) => [d, 0]));

    for (const repo of repos) {
      const commits = allCommitsByRepo.get(repo.name) || [];
      let repoCommits = 0;
      let repoAdded = 0;
      let repoRemoved = 0;

      for (const c of commits) {
        if (!inPeriod(c, period)) continue;
        repoCommits++;
        repoAdded += c.linesAdded;
        repoRemoved += c.linesRemoved;
        totals.commits++;
        totals.linesAdded += c.linesAdded;
        totals.linesRemoved += c.linesRemoved;
        hourlyActivity[c.hour]++;
        dayOfWeekActivity[c.dayOfWeek]++;

        const existing = contributorMap.get(c.email);
        if (existing) {
          existing.commits++;
        } else {
          contributorMap.set(c.email, { name: c.author, commits: 1 });
        }
      }

      if (repoCommits > 0) {
        totals.activeRepos++;
        repoCommitCounts.set(repo.name, { commits: repoCommits, linesAdded: repoAdded, linesRemoved: repoRemoved, netLines: repoAdded - repoRemoved });
      }
    }

    totals.netLines = totals.linesAdded - totals.linesRemoved;
    totals.uniqueContributors = contributorMap.size;

    const topRepos = [...repoCommitCounts.entries()]
      .sort((a, b) => b[1].commits - a[1].commits)
      .slice(0, topN)
      .map(([repo, stats]) => ({ repo, ...stats }));

    const topContributors = [...contributorMap.values()]
      .sort((a, b) => b.commits - a.commits)
      .slice(0, topN)
      .map(({ name, commits }) => ({ name, commits }));

    return {
      id: period.id,
      label: period.label,
      since: period.since,
      until: period.until,
      totals,
      topRepos,
      topContributors,
      hourlyActivity,
      dayOfWeekActivity,
    };
  });

  return periodResults;
}

function buildRepoSummaries(repos, allCommitsByRepo, periods) {
  return repos
    .map((repo) => {
      const commits = allCommitsByRepo.get(repo.name) || [];
      if (commits.length === 0) return null;

      const sorted = [...commits].sort((a, b) => (a.dateStr < b.dateStr ? -1 : 1));
      const commitsByPeriod = {};
      for (const period of periods) {
        commitsByPeriod[period.id] = commits.filter((c) => inPeriod(c, period)).length;
      }

      return {
        name: repo.name,
        path: repo.path,
        firstCommitDate: sorted[0].dateStr,
        lastCommitDate: sorted[sorted.length - 1].dateStr,
        totalCommitsInWindow: commits.length,
        commitsByPeriod,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalCommitsInWindow - a.totalCommitsInWindow);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const options = parseArgs();
  if (options.help) {
    printHelp();
    return;
  }

  console.log(`Scanning for git repos under ${options.baseDir} (maxdepth ${options.maxDepth})...`);
  const { repos, excluded } = discoverRepos(options.baseDir, options.maxDepth, {
    allowedOwners: options.allowedOwners,
    includeExternal: options.includeExternal,
  });
  console.log(
    `Discovered ${repos.length} repos` +
      (excluded.externalRemote.length ? `, excluded ${excluded.externalRemote.length} external-owner repos` : '') +
      (excluded.duplicateClone.length ? `, excluded ${excluded.duplicateClone.length} duplicate clones` : '') +
      '.'
  );
  if (excluded.externalRemote.length) {
    console.log('  External-owner repos excluded:');
    for (const e of excluded.externalRemote) console.log(`    - ${e.path} (${e.remoteUrl})`);
  }
  if (excluded.duplicateClone.length) {
    console.log('  Duplicate clones excluded:');
    for (const e of excluded.duplicateClone) console.log(`    - ${e.path} (kept ${e.keptInstead} instead)`);
  }

  const periods = buildPeriods(options.years, options.ytdCutoff);
  const earliestSince = `${Math.min(...options.years)}-01-01`;

  const allCommitsByRepo = new Map();
  let processed = 0;
  for (const repo of repos) {
    try {
      const commits = getRepoCommits(repo.path, earliestSince);
      allCommitsByRepo.set(repo.name, commits);
    } catch (err) {
      console.warn(`  ! Skipping ${repo.name}: ${err.message}`);
      allCommitsByRepo.set(repo.name, []);
    }
    processed++;
    if (processed % 10 === 0) console.log(`  ...processed ${processed}/${repos.length} repos`);
  }

  const periodResults = aggregate(repos, allCommitsByRepo, periods, options.top);
  const repoSummaries = buildRepoSummaries(repos, allCommitsByRepo, periods);

  const result = {
    generatedAt: new Date().toISOString(),
    baseDir: options.baseDir,
    maxDepth: options.maxDepth,
    years: options.years,
    ytdCutoff: options.ytdCutoff,
    reposDiscovered: repos.length,
    reposWithCommitsInWindow: repoSummaries.length,
    excluded: {
      externalRemote: excluded.externalRemote.map((e) => ({ path: e.path, remoteUrl: e.remoteUrl })),
      duplicateClone: excluded.duplicateClone,
    },
    periods: periodResults,
    repos: repoSummaries,
  };

  mkdirSync(dirname(options.out), { recursive: true });
  writeFileSync(options.out, JSON.stringify(result, null, 2));
  console.log(`\nWrote ${options.out}`);

  console.log('\nSummary:');
  for (const p of periodResults) {
    if (p.id.includes('-full') || p.id.includes('-ytd')) {
      console.log(`  ${p.label}: ${p.totals.commits.toLocaleString()} commits, ${p.totals.activeRepos} active repos, net ${p.totals.netLines.toLocaleString()} lines, ${p.totals.uniqueContributors} contributors`);
    }
  }

  if (options.json) {
    console.log('\n' + JSON.stringify(result, null, 2));
  }
}

main();

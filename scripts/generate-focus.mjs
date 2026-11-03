#!/usr/bin/env node

/**
 * Where the site owner's hours went, week by week, for RepoFocus (#453).
 *
 * Reads the last WEEKS weeks of commits on each of the owner's repos
 * (FoundersConfig `site.github`), private ones included, and measures the
 * hours the way the baseline's were measured (src/lib/baseline.ts): commits
 * less than 2 hours apart are one work session, each session counts its span
 * plus 15 minutes, at most 4 hours. A session belongs to the week (Monday,
 * UTC) it started in. Commits by bots aren't anyone's hours and are left out.
 *
 * Writes src/data/focus.json (gitignored, and not in public/, so it's never
 * served as is): the weeks, and each repo with hours in them, its hours a
 * week. Private repos only when FoundersConfig `privateRepos` is on (the
 * switch in /admin). Nothing here is analysis kept in the repo: every build
 * measures again from the commits.
 *
 * Signs in through scripts/lib/owner-github.mjs (the owner's GitHub App, or
 * locally GITHUB_TOKEN=$(gh auth token) npm run generate-focus). With neither,
 * or if GitHub can't be reached, it keeps the last focus it wrote (none on a
 * fresh copy) and never fails the build.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { client, ownerRepoList } from './lib/owner-github.mjs';

// .env, when there is one (Node 24 reads it; on Vercel the env is already set)
try {
  process.loadEnvFile();
} catch {
  // no .env
}

const ROOT = process.cwd();
const OUT_JSON = path.join(ROOT, 'src', 'data', 'focus.json');
const CONFIG = path.join(ROOT, 'src', 'data', 'FoundersConfig.json');

const WEEKS = 12;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// The baseline's work session (theunpartyrunway's run-repo-analysis)
const SESSION_GAP = 2 * HOUR;
const SESSION_LEAD = 0.25 * HOUR;
const SESSION_MAX = 4 * HOUR;

// The Monday (UTC) a moment's week starts on
function weekStart(time) {
  const day = new Date(time);
  day.setUTCHours(0, 0, 0, 0);
  return day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY;
}

/** A repo's commit times as work sessions: { start, hours } each */
export function sessions(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const found = [];
  let start = sorted[0];
  let last = sorted[0];
  for (const time of sorted.slice(1)) {
    if (time - last < SESSION_GAP) {
      last = time;
      continue;
    }
    found.push({ start, hours: Math.min(last - start + SESSION_LEAD, SESSION_MAX) / HOUR });
    start = last = time;
  }
  if (sorted.length) found.push({ start, hours: Math.min(last - start + SESSION_LEAD, SESSION_MAX) / HOUR });
  return found;
}

const isBot = (commit) => commit.author?.type === 'Bot' || /\[bot\]$/.test(commit.author?.login ?? commit.commit?.author?.name ?? '');
const round = (hours) => Math.round(hours * 10) / 10;

function keepLast(reason) {
  const fresh = !fs.existsSync(OUT_JSON);
  if (fresh) fs.writeFileSync(OUT_JSON, `${JSON.stringify({ generatedAt: null, owner: null, weeks: [], repos: [] }, null, 2)}\n`);
  console.log(`🎯 focus: ${reason}; ${fresh ? 'wrote none' : 'kept the last focus'} (${path.relative(ROOT, OUT_JSON)})`);
}

export async function generateFocus() {
  const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  const owner = config.site?.github;
  if (!owner) return keepLast('no site.github in FoundersConfig');

  let signedIn;
  try {
    signedIn = await client();
  } catch (error) {
    return keepLast(`couldn't sign in to GitHub (${error.message})`);
  }
  if (!signedIn) return keepLast('no GitHub App or GITHUB_TOKEN');
  const { octokit, as } = signedIn;

  // This week and the WEEKS - 1 before it
  const thisWeek = weekStart(Date.now());
  const weeks = Array.from({ length: WEEKS }, (_, index) => thisWeek - (WEEKS - 1 - index) * 7 * DAY);
  const since = new Date(weeks[0]).toISOString();

  const repos = [];
  try {
    for (const repo of await ownerRepoList(octokit, as, owner)) {
      // A fork is someone else's work; a repo untouched since is quiet; a
      // private one stays out unless the owner shows them
      if (repo.fork || (repo.pushed_at && repo.pushed_at < since)) continue;
      if (repo.private && config.privateRepos !== true) continue;
      let commits;
      try {
        commits = await octokit.paginate('GET /repos/{owner}/{repo}/commits', { owner, repo: repo.name, since, per_page: 100 });
      } catch (error) {
        // An empty repo answers 409
        if (error.status === 409) continue;
        throw error;
      }
      const times = commits.filter((c) => !isBot(c)).map((c) => Date.parse(c.commit.author?.date ?? c.commit.committer?.date));
      const found = sessions(times.filter(Number.isFinite));
      if (!found.length) continue;
      const hours = weeks.map(() => 0);
      for (const session of found) {
        const index = weeks.indexOf(weekStart(session.start));
        if (index >= 0) hours[index] += session.hours;
      }
      repos.push({ repo: repo.name, private: repo.private, hours: hours.map(round), sessions: found.length, commits: times.length });
    }
  } catch (error) {
    return keepLast(`GitHub didn't answer (${error.status ?? ''} ${error.message})`.replace(/\s+/g, ' '));
  }

  repos.sort((a, b) => b.hours.reduce((s, h) => s + h, 0) - a.hours.reduce((s, h) => s + h, 0));
  const body = {
    generatedAt: new Date().toISOString(),
    owner,
    weeks: weeks.map((week) => new Date(week).toISOString().slice(0, 10)),
    repos,
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(body, null, 2)}\n`);

  const total = repos.reduce((sum, r) => sum + r.hours.reduce((s, h) => s + h, 0), 0);
  console.log(`🎯 focus: ${round(total)} hours over ${WEEKS} weeks across ${repos.length} repos of ${owner}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateFocus().catch((error) => keepLast(error.message));
}

#!/usr/bin/env node
/**
 * Measures the site's own repo next to public repos of a similar scale, month
 * by month over the last 12 months, for /founders' comparison chart
 * (src/lib/comparisons.ts): pull requests merged, issues opened, and how many
 * people did the merging (five or more merged pull requests in the year, bots
 * left out). For the owner it also counts the whole account the repo lives
 * in (every repo, private ones included): pull requests merged, issues opened
 * and repos, for /founders' offer lines ({orgPrs}, {orgIssues}, {repos}).
 * Writes src/data/comparisons.json, which is tracked: it needs the
 * GitHub CLI signed in (`gh auth login`), so a build can't make it.
 *
 *   npm run measure:comparisons                         # the repos already in the file
 *   npm run measure:comparisons -- umami-software/umami documenso/documenso
 *
 * The site's own repo comes from `git remote get-url origin`. Search allows
 * 30 requests a minute, so it paces itself (a few minutes for five repos).
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'src/data/comparisons.json');
const REGULAR = 5; // merged pull requests in the year that make someone one of the people doing the work
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const own = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' })
  .trim()
  .replace(/^.*github\.com[:/]/, '')
  .replace(/\.git$/, '');
const others = process.argv.slice(2).length
  ? process.argv.slice(2)
  : (previous.repos ?? []).filter((r) => !r.mine).map((r) => r.repo);
if (!others.length) {
  console.error('Name the repos to compare with: npm run measure:comparisons -- owner/repo owner/repo');
  process.exit(1);
}

const gh = (args) => JSON.parse(execFileSync('gh', ['api', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 }));
let lastSearch = 0;
async function search(q, extra = []) {
  const gap = 2100 - (Date.now() - lastSearch);
  if (gap > 0) await wait(gap);
  lastSearch = Date.now();
  return gh(['-X', 'GET', 'search/issues', '-f', `q=${q}`, ...extra]);
}

// The last 12 whole months and this one: [start, end) as YYYY-MM-DD
const now = new Date();
const months = Array.from({ length: 13 }, (_, i) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12 + i, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { month: start.toISOString().slice(0, 7), from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
});
const since = months[0].from;

async function measure(repo, mine) {
  const full = gh([`repos/${repo}`]).full_name; // follows a rename
  const rows = [];
  for (const m of months) {
    const range = `${m.from}..${m.to}`;
    const prs = (await search(`repo:${full} is:pr is:merged merged:${range}`)).total_count;
    const issues = (await search(`repo:${full} is:issue created:${range}`)).total_count;
    rows.push({ month: m.month, prs, issues });
  }
  // The people doing the work: authors of merged pull requests, bots left out
  const authors = new Map();
  for (let page = 1; page <= 10; page++) {
    const { items } = await search(`repo:${full} is:pr is:merged merged:>=${since}`, ['-f', 'per_page=100', '-f', `page=${page}`]);
    for (const { user } of items) {
      if (user.type === 'Bot' || user.login.endsWith('[bot]')) continue;
      authors.set(user.login, (authors.get(user.login) ?? 0) + 1);
    }
    if (items.length < 100) break;
  }
  const people = [...authors.values()].filter((n) => n >= REGULAR).length;
  const name = full.split('/')[1].replace(/^theunparty/, '').replace(/\.(link|app|com)$/, '') || full;
  console.log(`${full}: ${rows.reduce((s, r) => s + r.prs, 0)} merged pull requests, ${rows.reduce((s, r) => s + r.issues, 0)} issues, ${people} people`);
  return { repo: full, name, ...(mine ? { mine: true } : {}), people, months: rows };
}

const repos = [await measure(own, true)];
for (const repo of others) repos.push(await measure(repo, false));

// The owner's whole account over the same months: an org's repos, or a user's
const owner = repos[0].repo.split('/')[0];
const qualifier = gh([`users/${owner}`]).type === 'Organization' ? `org:${owner}` : `user:${owner}`;
const range = `${months[0].from}..${months[months.length - 1].to}`;
const account = {
  owner,
  // Their own repos: forks of someone else's are left out, archived ones count
  repos: JSON.parse(execFileSync('gh', ['repo', 'list', owner, '--source', '--limit', '1000', '--json', 'name'], { encoding: 'utf8', maxBuffer: 1 << 26 })).length,
  prs: (await search(`${qualifier} is:pr is:merged merged:${range}`)).total_count,
  issues: (await search(`${qualifier} is:issue created:${range}`)).total_count,
};
console.log(`${owner}: ${account.repos} repos, ${account.prs} merged pull requests, ${account.issues} issues`);

writeFileSync(
  OUT,
  `${JSON.stringify({ measured: now.toISOString().slice(0, 10), since: months[0].month, regular: REGULAR, account, repos }, null, 2)}\n`
);
console.log(`Wrote ${path.relative(root, OUT)}`);

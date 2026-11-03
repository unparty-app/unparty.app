#!/usr/bin/env tsx
/**
 * scripts/test-baseline-snapshots.ts
 *
 * Dry-run diagnostic for the Build/Connect/About baseline snapshot cron
 * routes (src/app/api/cron/snapshot-build-priority, snapshot-connect,
 * snapshot-about-cost — all built on src/lib/snapshot-pr.ts). Computes each
 * pillar's fresh snapshot, reads what's currently committed on GitHub, and
 * reports whether a real run would open a PR — without ever writing
 * anything, so this is safe to run as often as you want.
 *
 * Usage:
 *   npm run test:baseline-snapshots                    # all three, dry run
 *   npm run test:baseline-snapshots -- --pillar=build   # build|connect|about
 *   npm run test:baseline-snapshots -- --live           # actually opens a PR for real changes
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filename: string) {
  try {
    const content = readFileSync(join(__dirname, '..', filename), 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Fine if a given env file doesn't exist locally.
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

// Dynamic imports, deliberately AFTER loadEnvFile — src/lib/github.ts reads
// GITHUB_APP_PRIVATE_KEY_PATH/WAITLIST_REPO_OWNER/etc. as module-level
// constants (evaluated once at import time), and ES module imports are
// hoisted ahead of this script's own top-level code regardless of where the
// import line sits textually. A static `import ... from '../src/lib/github'`
// here would capture those as undefined before loadEnvFile ever ran.
const { computeBuildPrioritySnapshot } = await import('../src/lib/build-priority-snapshot');
const { computeConnectSnapshot } = await import('../src/lib/connect-snapshot');
const { computeAboutSnapshot } = await import('../src/lib/about-snapshot');
const { readJsonFile } = await import('../src/lib/github');
const { runSnapshotPr } = await import('../src/lib/snapshot-pr');
const { prisma } = await import('../src/lib/prisma');
type SnapshotConfig<T> = import('../src/lib/snapshot-pr').SnapshotConfig<T>;
type BuildPrioritySnapshot = import('../src/lib/build-priority-snapshot').BuildPrioritySnapshot;
type AboutSnapshot = import('../src/lib/about-snapshot').AboutSnapshot;

const fmtNum = (n: number, digits = 1) => n.toLocaleString('en-US', { maximumFractionDigits: digits });
const fmtUsd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

function describeBuildSnapshot(d: BuildPrioritySnapshot): string {
  const { entries } = d;
  const combined = entries.map((e) => e.combined);
  const avg = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
  const maxEntry = entries.reduce((a, b) => (b.combined > a.combined ? b : a));
  const minEntry = entries.reduce((a, b) => (b.combined < a.combined ? b : a));
  const tierCounts = { 'YAH.': 0, 'MEH.': 0, 'NAH.': 0 };
  for (const e of entries) tierCounts[e.tier]++;

  return [
    `  ${entries.length} unppps scored`,
    `  combined:   avg ${fmtNum(avg(combined))}  min ${minEntry.combined} (${minEntry.route})  max ${maxEntry.combined} (${maxEntry.route})`,
    `  repoTotal:  avg ${fmtNum(avg(entries.map((e) => e.repoTotal)))}   unpppTotal: avg ${fmtNum(avg(entries.map((e) => e.unpppTotal)))}`,
    `  tiers:      YAH. ${tierCounts['YAH.']} · MEH. ${tierCounts['MEH.']} · NAH. ${tierCounts['NAH.']}`,
  ].join('\n');
}

function describeAboutSnapshot(d: AboutSnapshot): string {
  const { entries } = d;
  const devHours = entries.map((e) => e.devHours);
  const polarPrice = entries.map((e) => e.polarPrice);
  const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0);
  const avg = (nums: number[]) => sum(nums) / (nums.length || 1);
  const high = entries.filter((e) => e.confidence === 'high').length;
  const low = entries.length - high;

  return [
    `  ${entries.length} unppps priced`,
    `  devHours:   avg ${fmtNum(avg(devHours))}h   total ${fmtNum(sum(devHours), 0)}h`,
    `  polarPrice: avg ${fmtUsd(avg(polarPrice))}   total ${fmtUsd(sum(polarPrice))}`,
    `  confidence: high ${high} · low ${low}`,
  ].join('\n');
}

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const prefix = `${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
};

const PILLAR_FILTER = getArg('--pillar'); // 'build' | 'connect' | 'about' | null (all)
const LIVE = args.includes('--live');

const REQUIRED_ENV = [
  'GITHUB_APP_ID',
  'GITHUB_APP_INSTALLATION_ID',
  'WAITLIST_REPO_OWNER',
] as const;

function checkEnv(): boolean {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  const hasPrivateKey = !!process.env.GITHUB_APP_PRIVATE_KEY || !!process.env.GITHUB_APP_PRIVATE_KEY_PATH;

  if (missing.length === 0 && hasPrivateKey) return true;

  console.error('[test-baseline-snapshots] Missing GitHub App env vars — see .env.example:');
  for (const key of missing) console.error(`  - ${key}`);
  if (!hasPrivateKey) console.error('  - GITHUB_APP_PRIVATE_KEY (or GITHUB_APP_PRIVATE_KEY_PATH)');
  console.error('These are required to read committed snapshots and (with --live) open a PR.');
  return false;
}

interface Pillar<T> {
  name: string;
  compute: () => Promise<T>;
  config: SnapshotConfig<T>;
  describe: (data: T) => string;
}

async function runPillar<T>(pillar: Pillar<T>) {
  console.log(`\n=== ${pillar.name} ===`);

  let fresh: T;
  try {
    fresh = await pillar.compute();
  } catch (err) {
    console.error(`[test-baseline-snapshots] ${pillar.name}: compute failed —`, err instanceof Error ? err.message : err);
    return;
  }
  console.log(pillar.describe(fresh));

  let current: T | null;
  let baseline: T | null;
  try {
    [current, baseline] = await Promise.all([
      readJsonFile<T>(pillar.config.currentPath, 'main'),
      readJsonFile<T>(pillar.config.baselinePath, 'main'),
    ]);
  } catch (err) {
    console.error(
      `[test-baseline-snapshots] ${pillar.name}: failed to read committed files from GitHub — `,
      err instanceof Error ? err.message : err
    );
    console.error('This usually means the GitHub App credentials are wrong, or the App lacks access to this repo.');
    return;
  }

  const currentMissing = current === null;
  const baselineMissing = baseline === null;
  const changed = currentMissing || !pillar.config.isEqual(current as T, fresh);

  console.log(`  current file:  ${pillar.config.currentPath}  ${currentMissing ? '(missing)' : changed ? '(stale — would update)' : '(up to date)'}`);
  console.log(`  baseline file: ${pillar.config.baselinePath}  ${baselineMissing ? '(missing — would seed)' : '(exists — never touched again)'}`);

  const wouldOpenPr = changed || baselineMissing;
  console.log(`  → a real run would ${wouldOpenPr ? 'OPEN A PR' : 'do nothing (no changes)'}.`);

  if (LIVE && wouldOpenPr) {
    console.log(`  --live: running for real...`);
    const result = await runSnapshotPr(pillar.config, fresh);
    console.log(`  result:`, result);
  }
}

async function main() {
  if (!checkEnv()) process.exit(1);

  const pillars: Record<string, Pillar<unknown>> = {
    build: {
      name: 'Build (priority)',
      compute: computeBuildPrioritySnapshot as () => Promise<unknown>,
      config: {
        pillar: 'build-priority',
        currentPath: 'public/data/build-priority-current.json',
        baselinePath: 'public/data/build-priority-baseline.json',
        isEqual: (a, b) => JSON.stringify((a as { entries: unknown }).entries) === JSON.stringify((b as { entries: unknown }).entries),
        prBodySummary: () => '',
      },
      describe: (d) => describeBuildSnapshot(d as BuildPrioritySnapshot),
    },
    connect: {
      name: 'Connect (audience)',
      compute: computeConnectSnapshot as () => Promise<unknown>,
      config: {
        pillar: 'connect',
        currentPath: 'public/data/connect-current.json',
        baselinePath: 'public/data/connect-baseline.json',
        isEqual: (a, b) => JSON.stringify((a as { stats: unknown }).stats) === JSON.stringify((b as { stats: unknown }).stats),
        prBodySummary: () => '',
      },
      describe: (d) => {
        const { stats, window_days } = d as import('../src/lib/connect-snapshot').ConnectSnapshot;
        return [
          `  window: ${window_days}d`,
          `  story:   vercel ${stats.story.vercel} views · ga ${stats.story.ga} organic sessions`,
          `  article: vercel ${stats.article.vercel} views · ga ${stats.article.ga} organic sessions`,
        ].join('\n');
      },
    },
    about: {
      name: 'About (cost/time)',
      compute: computeAboutSnapshot as () => Promise<unknown>,
      config: {
        pillar: 'about-cost',
        currentPath: 'public/data/about-cost-current.json',
        baselinePath: 'public/data/about-cost-baseline.json',
        isEqual: (a, b) => JSON.stringify((a as { entries: unknown }).entries) === JSON.stringify((b as { entries: unknown }).entries),
        prBodySummary: () => '',
      },
      describe: (d) => describeAboutSnapshot(d as AboutSnapshot),
    },
  };

  const selected = PILLAR_FILTER ? { [PILLAR_FILTER]: pillars[PILLAR_FILTER] } : pillars;
  if (PILLAR_FILTER && !pillars[PILLAR_FILTER]) {
    console.error(`Unknown --pillar=${PILLAR_FILTER}. Expected one of: build, connect, about`);
    process.exit(1);
  }

  if (LIVE) {
    console.log('--live: real runs will open real PRs for anything that changed.\n');
  }

  for (const pillar of Object.values(selected)) {
    if (pillar) await runPillar(pillar);
  }

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('[test-baseline-snapshots] Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

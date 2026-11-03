#!/usr/bin/env node

/**
 * Regenerates src/app/theunpartyrunway/theunpartyrunway-features.json from
 * live git history in the local theunpartyrunway checkout, one entry per
 * top-level subdirectory ("feature").
 *
 * NOTE on status/risk: the previous file's status/risk numbers do not
 * correspond to any git-derived formula we could find — e.g. `docs` and
 * `reports` carried byte-identical status/risk/core/brand despite being
 * different directories with different real commit histories (verified:
 * `docs` has 111 commits spanning 2025-06-06..2026-08-20; that pairing
 * can't be reproduced from real per-directory git stats). Rather than fake
 * a formula to match numbers that were themselves not reliably computed,
 * this generator defines status/risk fresh and documents the definition:
 *   - status: commit count touching that subdirectory (activity volume)
 *   - risk:   days since the last commit touching that subdirectory (staleness)
 * core/brand (first/last commit subject) ARE reproducible from git history
 * and match the previous file's values where the upstream repo hasn't
 * changed since that snapshot.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { resolveLocalRepoPath } from './lib/resolve-local-repo-path.js';

const UNPPP_ID = 'theunpartyunppp';
const OUTPUT_PATH = path.join(process.cwd(), 'src/app/theunpartyunppp/theunpartyunppp-features.json');
const CONFIG_PATH = path.join(process.cwd(), 'src/data/UnpppsConfig.json');

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'venv', '.venv', '__pycache__']);

function getTopLevelDirs(repoPath) {
  return fs
    .readdirSync(repoPath, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function gitLogFor(repoPath, subdir, format) {
  try {
    return execSync(`git log --format="${format}" -- "${subdir}"`, {
      cwd: repoPath,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

function analyzeDir(repoPath, subdir) {
  const allSubjects = gitLogFor(repoPath, subdir, '%s');
  if (!allSubjects) return null;

  const subjects = allSubjects.split('\n');
  const commitCount = subjects.length;
  const brand = subjects[0]; // most recent
  const core = subjects[subjects.length - 1]; // first/oldest

  const lastDateRaw = gitLogFor(repoPath, subdir, '%ad').split('\n')[0];
  let risk = null;
  if (lastDateRaw) {
    const lastDate = new Date(lastDateRaw);
    risk = Math.max(0, Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return { status: String(commitCount), core, brand, risk: risk === null ? 'nil' : String(risk) };
}

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const unppp = config.unppps.find((u) => u.id === UNPPP_ID);
  if (!unppp) {
    console.error(`${UNPPP_ID} not found in ${CONFIG_PATH}`);
    process.exit(1);
  }

  const resolution = resolveLocalRepoPath(UNPPP_ID, { gh: unppp.gh });
  if (resolution.status !== 'resolved') {
    console.error(`Could not resolve local repo path for ${UNPPP_ID}: ${resolution.reason}`);
    process.exit(1);
  }
  console.log(`Resolved ${UNPPP_ID} -> ${resolution.repoPath}`);

  const dirs = getTopLevelDirs(resolution.repoPath);
  console.log(`Found ${dirs.length} top-level subdirectories`);

  const entries = [];
  for (const dir of dirs) {
    const stats = analyzeDir(resolution.repoPath, dir);
    if (!stats) continue; // no commits touching this dir (e.g. untracked scratch dir)
    entries.push({
      name: dir,
      connect: `${UNPPP_ID}/${dir}`,
      status: stats.status,
      core: stats.core,
      brand: stats.brand,
      risk: stats.risk,
      budget: 'TBD.',
      grow: 'TBD.',
    });
  }

  const output = { [UNPPP_ID]: entries };
  const dryRun = process.argv.includes('--dry-run');
  const outPath = dryRun ? `${OUTPUT_PATH}.generated.json` : OUTPUT_PATH;
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${entries.length} entries to ${outPath}`);
}

main();

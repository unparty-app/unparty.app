#!/usr/bin/env node

/**
 * Resolves an unppp id to its local git repo path on disk.
 *
 * Directory-convention search finds candidate .git roots; git remote
 * comparison against the unppp's `gh` field (src/data/UnpppsConfig.json)
 * disambiguates when there's more than one. If no candidate's remote
 * matches, the shallowest candidate wins by convention (logged, not
 * treated as a hard failure) rather than skipping outright — the alternative
 * of demanding a remote match unconditionally would wrongly skip repos like
 * theunpartydashboard, whose local clone's remote (a personal fork) doesn't
 * match its configured canonical `gh` URL even though the top-level repo is
 * unambiguously the right one (the only other candidate is an unrelated
 * nested repo like moodClientTemplate).
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const DEFAULT_BASE_DIR = '/Users/UNPARTYLLC';

function normalizeGhUrl(url) {
  if (!url) return null;
  return url
    .trim()
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

function getRemoteUrl(repoPath) {
  try {
    return execSync('git remote get-url origin', {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

// Directories never worth descending into looking for a repo root — either
// they're huge build/dependency trees, or (for SKIP_CONTENTS) they're inside
// a repo we already found so their own .git-like entries are that repo's
// tracked content, not a separate embedded repo.
const SKIP_DIRS = new Set(['node_modules', 'Pods', '.build', 'DerivedData', 'dist', 'build', '.next']);

/**
 * Find all .git roots under `<baseDir>/<id>`, up to maxDepth. Real-world repos
 * here (e.g. theunpartycharette) nest one checkout inside another, so a match
 * at a shallow depth does NOT stop the walk — every candidate up to maxDepth
 * is collected, sorted shallowest-first.
 */
function findGitRoots(idDir, maxDepth = 3) {
  const candidates = [];

  function walk(dir, depth) {
    if (depth > maxDepth) return;
    if (fs.existsSync(path.join(dir, '.git'))) {
      candidates.push({ repoPath: dir, depth });
    }
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), depth + 1);
    }
  }

  walk(idDir, 0);
  candidates.sort((a, b) => a.depth - b.depth);
  return candidates;
}

/**
 * @param {string} id - unppp id, e.g. "theunpartyrunway"
 * @param {object} [opts]
 * @param {string} [opts.baseDir] - defaults to /Users/UNPARTYLLC
 * @param {string|null} [opts.gh] - expected GitHub URL for this id, from UnpppsConfig.json
 * @returns {{ status: 'resolved', repoPath: string, matchedByRemote: boolean } |
 *           { status: 'missing', reason: string } |
 *           { status: 'ambiguous', reason: string, candidates: string[] }}
 */
export function resolveLocalRepoPath(id, opts = {}) {
  const baseDir = opts.baseDir || DEFAULT_BASE_DIR;
  const idDir = path.join(baseDir, id);

  if (!fs.existsSync(idDir)) {
    return { status: 'missing', reason: `no directory at ${idDir}` };
  }

  const candidates = findGitRoots(idDir);

  if (candidates.length === 0) {
    return { status: 'missing', reason: `no .git root found under ${idDir}` };
  }

  if (candidates.length === 1) {
    return { status: 'resolved', repoPath: candidates[0].repoPath, matchedByRemote: false };
  }

  // Multiple candidates: disambiguate by matching git remote against the
  // configured gh URL.
  const expected = normalizeGhUrl(opts.gh);
  if (expected) {
    const remoteMatches = candidates.filter((c) => {
      const remote = normalizeGhUrl(getRemoteUrl(c.repoPath));
      return remote && remote.endsWith(expected.replace(/^https?:\/\/github\.com\//, ''));
    });
    if (remoteMatches.length === 1) {
      return { status: 'resolved', repoPath: remoteMatches[0].repoPath, matchedByRemote: true };
    }
    if (remoteMatches.length > 1) {
      // Ambiguous even after remote matching — fall back to shallowest match.
      return { status: 'resolved', repoPath: remoteMatches[0].repoPath, matchedByRemote: true };
    }
  }

  // No remote match (or no gh configured): fall back to the shallowest
  // candidate by convention, logged for visibility rather than skipped.
  return {
    status: 'resolved',
    repoPath: candidates[0].repoPath,
    matchedByRemote: false,
    note: `no candidate remote matched gh=${opts.gh ?? 'null'}; used shallowest of ${candidates.length} candidates by convention`,
  };
}

/**
 * CLI: node scripts/lib/resolve-local-repo-path.js [--base-dir <dir>]
 * Resolves every unppp in src/data/UnpppsConfig.json and prints a summary table.
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseDirArgIdx = process.argv.indexOf('--base-dir');
  const baseDir = baseDirArgIdx !== -1 ? process.argv[baseDirArgIdx + 1] : DEFAULT_BASE_DIR;

  const configPath = path.join(process.cwd(), 'src/data/UnpppsConfig.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const results = config.unppps.map((u) => {
    const result = resolveLocalRepoPath(u.id, { baseDir, gh: u.gh });
    return { id: u.id, ...result };
  });

  const resolved = results.filter((r) => r.status === 'resolved');
  const missing = results.filter((r) => r.status === 'missing');
  const flagged = resolved.filter((r) => r.note);

  console.log(`\nResolved: ${resolved.length}/${results.length}`);
  console.log(`Missing:  ${missing.length}/${results.length}\n`);

  console.log('--- resolved (with notes) ---');
  for (const r of flagged) {
    console.log(`  ${r.id.padEnd(24)} -> ${r.repoPath}  [${r.note}]`);
  }

  console.log('\n--- missing ---');
  for (const r of missing) {
    console.log(`  ${r.id.padEnd(24)} (${r.reason})`);
  }

  const outPath = path.join(process.cwd(), 'scripts/lib/resolve-local-repo-path.output.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n');
  console.log(`\nFull results written to ${outPath}`);
}

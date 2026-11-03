#!/usr/bin/env node

/**
 * stamp-dates — keeps every article's created and updated dates right, so no
 * one ever types one (#1030).
 *
 *   Content                                   created       updated
 *   public/covers/stories/story-N.md          started-at    updated-at
 *   src/app/theunparty<x>/<name>.md           date          updated-at
 *   content/articles/<slug>.json              date          updated
 *   src/app/constants/editorial-articles/
 *     articles/<name>.ts                      date          updated
 *
 * - created: set once, when missing, to the file's first commit date (today
 *   for a file not committed yet). Never changed after that.
 * - updated: set to today when the title or the body changed against --base
 *   (default HEAD). Tags, cover, published, other metadata and whitespace
 *   don't count. A new file has no updated date yet.
 * - Dates are the author's local date (YYYY-MM-DD): a 9pm edit in New York is
 *   that day, not the next UTC day. --today <date> overrides it.
 *
 * Runs from the pre-commit hook (scripts/pre-commit-frontmatter) on staged
 * content. Files of other kinds are ignored, so callers can pass any list.
 *
 * Usage:
 *   node scripts/stamp-dates.js [--base <ref>] [--today YYYY-MM-DD] <files...>
 *   node scripts/stamp-dates.js --all     # fill missing created dates only
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { kindOf, stampText } from '../src/lib/stamp-dates-core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

const localToday = () => new Date().toLocaleDateString('en-CA');

function firstCommitDate(rel, today) {
  const out = git('log', '--follow', '--diff-filter=A', '--format=%as', '--', rel);
  const dates = out ? out.trim().split('\n').filter(Boolean) : [];
  return dates.length ? dates[dates.length - 1] : today;
}

// --- main ------------------------------------------------------------------

function stampFile(rel, opts) {
  const k = kindOf(rel);
  if (!k) return null;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  const text = fs.readFileSync(abs, 'utf8');
  // null: new file (or --all), so nothing to compare and no updated date
  const base = opts.fillOnly ? null : git('show', `${opts.base}:${rel}`);
  let created;
  const dates = { today: opts.today, created: () => (created ??= firstCommitDate(rel, opts.today)) };
  const { text: out, notes } = stampText(rel, text, base, dates);
  if (out !== text) fs.writeFileSync(abs, out, 'utf8');
  return { rel, changed: out !== text, notes };
}

function allContentFiles() {
  const out = git('ls-files') ?? '';
  return out.split('\n').filter((rel) => kindOf(rel));
}

function main() {
  const args = process.argv.slice(2);
  const opts = { base: 'HEAD', today: localToday(), fillOnly: false };
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base') opts.base = args[++i];
    else if (args[i] === '--today') opts.today = args[++i];
    else if (args[i] === '--all') opts.fillOnly = true;
    else files.push(path.relative(ROOT, path.resolve(process.cwd(), args[i])).split(path.sep).join('/'));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.today ?? '')) {
    console.error('--today needs YYYY-MM-DD');
    process.exit(2);
  }
  const targets = opts.fillOnly ? allContentFiles() : files;
  if (!targets.length) {
    console.error('Usage: node scripts/stamp-dates.js [--base <ref>] [--today YYYY-MM-DD] <files...> | --all');
    process.exit(2);
  }

  let changed = 0;
  for (const rel of targets) {
    const result = stampFile(rel, opts);
    if (!result || !result.notes.length) continue;
    if (result.changed) changed++;
    console.log(`${result.changed ? '✓' : '⊘'} ${rel}: ${result.notes.join(', ')}`);
  }
  console.log(`${changed} file(s) stamped`);
}

main();

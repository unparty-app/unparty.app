#!/usr/bin/env node
/**
 * generate-unparty-refs: scans every tracked file for references to unparty —
 * the brand, not the frame — and writes src/data/unpartyRefsManifest.json for
 * the unparty button (/admin/unparty), which lists each remaining reference so
 * a buyer can replace them (#1095). Deployed, the app has no source tree, so
 * the button reads this manifest instead; it regenerates on every build (and
 * before `npm run dev`), like iconManifest.json, and is gitignored. It runs
 * first in the build, so nothing the build generates is counted. The SETUP.
 * "brand" step is done when the manifest reports zero. Without git the
 * manifest says it was not measured instead of guessing (D2, #1244).
 *
 * WHAT COUNTS, by category (in the order a buyer replaces them):
 *  - identity: any other "unparty" — the brand name, "unparty LLC", the
 *    unparty-app GitHub org. Centralized values live in FoundersConfig.json
 *    (via src/app/constants/organization.ts), so one edit clears many.
 *  - projects: theunparty<name> — unparty's example projects, one per showcase
 *    page, story and article. The public copy leaves them out (D5, #1244);
 *    any that remain are DELETED, never renamed, since renaming changes URLs.
 *  - domain: unparty.app — one config value (site.url in FoundersConfig.json).
 *  - author: unparty's founder (jmurrym, jmmurry, Justin Murry, justin@…) in
 *    author and byline data. Replaced last.
 *  - paths: tracked files whose path contains "unparty" (route folders, cover
 *    stories, article files, brand images). They count toward done (D4); the
 *    app shell's own images use neutral names, so every remaining path is
 *    brand or content to delete or replace.
 *
 * WHAT DOES NOT COUNT (the frame, not the brand):
 *  - "unppp" — frame vocabulary, like "story" or "cover": the word for a
 *    project in this frame. A buyer keeps it. Counted separately as
 *    information only, never toward done.
 *  - ALLOWLIST files — the replacement tooling itself (this script, its
 *    manifest, the unparty button, the identity checker) has to name unparty
 *    to do its job, and LICENSE.md keeps the licensor's (unparty LLC's) name
 *    on the license the buyer received. The SETUP. curriculum counts (D6):
 *    the brand step is last, so retiring the guides is the final move.
 *  - EXEMPT_TOKENS / EXEMPT_IN_FILE — exact names that stay: the keys
 *    visitors' saved settings live under, and the old color names kept so
 *    saved themes still resolve (D3, #1244).
 *  - TOOLING_TOKENS — the tooling's own names (generate-unparty-refs,
 *    unpartyRefsManifest, unparty-refs, admin/unparty) wherever the frame has
 *    to wire or document the tool (package.json build chain, CLAUDE.md, the
 *    admin nav href). A buyer keeps the tool, so pointing at it never counts.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'src', 'data', 'unpartyRefsManifest.json');

// Frame files, never counted: prefix-matched against the tracked path
const ALLOWLIST = [
  'src/lib/site-address.ts', // The upstream address builds are told at, and how a copy leaves it
  // the replacement tooling itself
  'scripts/generate-unparty-refs.js',
  'src/data/unpartyRefsManifest.json',
  'src/lib/unparty-refs.ts',
  'src/app/admin/unparty/',
  'src/app/api/admin/unparty-refs/',
  // flags FoundersConfig.json values that are "still unparty's"
  'scripts/check-founders-config.mjs',
  // The SETUP. curriculum is NOT here: it counts (D6, #1244). A founder
  // rewrites or retires it as the very last step
  // the license grant: unparty LLC stays the licensor of the buyer's copy
  'LICENSE.md',
  // where a copy tells unparty it was built (#589): the one unparty address
  // meant to stay, and only ever used when its owner chooses to
  'src/lib/builds.ts',
];

const CATEGORIES = {
  identity: {
    label: 'identity',
    description:
      'The brand name itself: "unparty", "unparty LLC", the unparty-app GitHub org. Replace first — most of these read from FoundersConfig.json already, so start there.',
    order: 1,
  },
  domain: {
    label: 'domain',
    description:
      'unparty.app — the site address. One config value: site.url in FoundersConfig.json. Hard-coded copies are listed here.',
    order: 2,
  },
  projects: {
    label: 'projects',
    description:
      'theunparty<name> — unparty\'s example projects (showcase pages, stories, articles, data). The public copy leaves them out; any your copy still has, delete. Never rename them — renaming changes URLs.',
    order: 3,
  },
  author: {
    label: 'author',
    description:
      'unparty\'s founder in author and byline data (jmurrym, jmmurry, Justin Murry, justin@…). Replace last, as you take over each file.',
    order: 4,
  },
};

const AUTHOR_PATTERN = /jmurrym|jmmurry|justin[\s._-]?murry|justin@/gi;
const UNPARTY_PATTERN = /unparty/gi;
const VOCABULARY_PATTERN = /unppp/gi;

// The tooling's own names: an occurrence inside one of these is the frame
// pointing at this tool (build chain, docs, the admin nav), never the brand
const TOOLING_TOKENS = ['generate-unparty-refs', 'unpartyrefsmanifest', 'unparty-refs', 'admin/unparty', 'unparty_button'];

// Exact names that stay, wherever they appear (D3, #1244): the keys visitors'
// saved settings live under. Renaming them would reset every visitor's theme,
// cookie choice and breadcrumbs, and a copy on its own domain never shares them
const EXEMPT_TOKENS = new Set(['unpartySelectedColor', 'unpartyAnalyticsConsent', 'unparty-breadcrumbs']);

// Exact names that stay in one file: RENAMED_COLORS maps the old color names
// that browsers and Clerk still have saved to the new ones
const EXEMPT_IN_FILE = {
  'src/app/constants/colors.ts': new Set(['unparty', 'unpartyblack', 'unpartywhite', 'unpartypurple']),
};

// Extensions that never carry text references worth line-scanning
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.icns',
  '.mp4', '.mov', '.webm', '.mp3', '.wav', '.m4a',
  '.pdf', '.zip', '.woff', '.woff2', '.ttf', '.otf', '.eot',
]);

function isAllowlisted(file) {
  return ALLOWLIST.some((entry) => file.startsWith(entry));
}

// Every tracked file, plus untracked files git doesn't ignore. Returns null
// when git can't list them (a `vercel deploy` upload or a ZIP download has no
// .git): walking the disk instead would also count files the build generated,
// so the count could never be trusted (D2, #1244). Vercel builds of a GitHub
// repo are shallow clones, which still list every file
function listTrackedFiles() {
  try {
    // --others --exclude-standard folds in new files not yet git-added
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const files = out.toString('utf8').split('\0').filter(Boolean);
    return files.length > 0 ? files : null;
  } catch {
    return null;
  }
}

function detectRepo() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  if (owner && slug) return `https://github.com/${owner}/${slug}`;
  try {
    const remote = execFileSync('git', ['config', '--get', 'remote.origin.url'], { cwd: root })
      .toString('utf8')
      .trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) return `https://github.com/${match[1]}/${match[2]}`;
  } catch {
    // no remote - the page falls back to plain file:line text
  }
  return null;
}

function detectBranch() {
  if (process.env.VERCEL_GIT_COMMIT_REF) return process.env.VERCEL_GIT_COMMIT_REF;
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root })
      .toString('utf8')
      .trim();
    if (branch && branch !== 'HEAD') return branch;
  } catch {
    // detached or no git
  }
  return 'main';
}

// Expands the token around an occurrence for a readable match string, e.g.
// "unparty-kpi", "UNPARTY" in "UNPARTY LLC", "theunparty-beta-v2"
function tokenAround(line, start, end) {
  const isWordChar = (ch) => /[A-Za-z0-9_-]/.test(ch);
  let from = start;
  let to = end;
  while (from > 0 && isWordChar(line[from - 1])) from--;
  while (to < line.length && isWordChar(line[to])) to++;
  return line.slice(from, to);
}

// Classifies every "unparty" occurrence on a line, exactly once each:
// projects (theunparty<name>) -> domain (unparty.app) -> identity (the rest).
// Occurrences inside a tooling token (the frame wiring this tool into the
// build chain, docs, or the admin nav) are skipped - a buyer keeps the tool.
function classifyLine(line, file) {
  const lower = line.toLowerCase();
  const toolingRanges = [];
  for (const token of TOOLING_TOKENS) {
    let at = lower.indexOf(token);
    while (at !== -1) {
      toolingRanges.push([at, at + token.length]);
      at = lower.indexOf(token, at + 1);
    }
  }
  const inToolingToken = (start, end) =>
    toolingRanges.some(([from, to]) => start >= from && end <= to);

  const found = [];
  for (const match of line.matchAll(UNPARTY_PATTERN)) {
    const start = match.index;
    const end = start + match[0].length;
    if (inToolingToken(start, end)) continue;
    const before = line.slice(Math.max(0, start - 3), start).toLowerCase();
    const trailing = line.slice(end).match(/^[a-z0-9]+/i);
    if (before === 'the' && trailing) {
      found.push({ category: 'projects', match: line.slice(start - 3, end + trailing[0].length) });
    } else if (line.slice(end, end + 4).toLowerCase() === '.app') {
      found.push({ category: 'domain', match: line.slice(start, end + 4) });
    } else {
      const token = tokenAround(line, start, end);
      if (EXEMPT_TOKENS.has(token) || EXEMPT_IN_FILE[file]?.has(token)) continue;
      found.push({ category: 'identity', match: token });
    }
  }
  for (const match of line.matchAll(AUTHOR_PATTERN)) {
    found.push({ category: 'author', match: match[0] });
  }
  return found;
}

function generateUnpartyRefs() {
  const files = listTrackedFiles();
  if (!files) {
    const unmeasured = {
      generatedAt: new Date().toISOString(),
      repo: detectRepo(),
      branch: detectBranch(),
      measured: false,
      reason: 'git could not list this copy\'s files (no .git folder). Deploy from GitHub, or run npm run dev in a cloned copy, to count.',
      done: false,
      total: { files: 0, matches: 0, paths: 0 },
      vocabulary: { pattern: 'unppp', kept: true, note: '', files: 0, matches: 0 },
      allowlist: ALLOWLIST,
      toolingTokens: TOOLING_TOKENS,
      exemptTokens: [...EXEMPT_TOKENS],
      categories: [],
      paths: [],
    };
    fs.writeFileSync(manifestPath, JSON.stringify(unmeasured, null, 2) + '\n');
    console.warn(`⚠️  unparty refs not counted: ${unmeasured.reason}`);
    return unmeasured;
  }

  // category id -> file -> Map<"line\u0000match", count>
  const byCategory = { identity: new Map(), domain: new Map(), projects: new Map(), author: new Map() };
  const countedFiles = new Set();
  const vocabulary = { files: 0, matches: 0 };
  const paths = [];
  let totalMatches = 0;

  const record = (category, file, line, matchText) => {
    let fileMap = byCategory[category].get(file);
    if (!fileMap) byCategory[category].set(file, (fileMap = new Map()));
    const key = `${line}\u0000${matchText}`;
    fileMap.set(key, (fileMap.get(key) ?? 0) + 1);
    countedFiles.add(file);
    totalMatches += 1;
  };

  for (const file of files) {
    const allowed = isAllowlisted(file);
    if (!allowed && file.toLowerCase().includes('unparty')) paths.push(file);

    const full = path.join(root, file);
    let buffer;
    try {
      buffer = fs.readFileSync(full);
    } catch {
      continue; // deleted but still tracked in the index
    }

    const binary = BINARY_EXTENSIONS.has(path.extname(file).toLowerCase()) || buffer.includes(0);
    if (binary) {
      // Covers and other media can carry the brand in their metadata; point
      // at the file itself (line 0) so the buyer replaces or deletes it
      if (!allowed && /unparty/i.test(buffer.toString('latin1'))) {
        record('identity', file, 0, 'unparty (binary file metadata)');
      }
      continue;
    }

    const text = buffer.toString('utf8');
    let vocabularyHits = 0;
    let lineNumber = 0;
    for (const line of text.split('\n')) {
      lineNumber += 1;
      if (allowed) continue;
      vocabularyHits += [...line.matchAll(VOCABULARY_PATTERN)].length;
      for (const { category, match } of classifyLine(line, file)) {
        record(category, file, lineNumber, match);
      }
    }
    if (vocabularyHits > 0) {
      vocabulary.files += 1;
      vocabulary.matches += vocabularyHits;
    }
  }

  const categories = Object.entries(CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([id, meta]) => {
      let matches = 0;
      const entries = [...byCategory[id].entries()]
        .map(([file, fileMap]) => {
          let count = 0;
          const lines = [...fileMap.entries()].map(([key, occurrences]) => {
            const [line, match] = key.split('\u0000');
            count += occurrences;
            return occurrences > 1 ? [Number(line), match, occurrences] : [Number(line), match];
          });
          matches += count;
          return { file, count, lines };
        })
        .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));
      return { id, ...meta, files: entries.length, matches, entries };
    });

  paths.sort();

  const manifest = {
    generatedAt: new Date().toISOString(),
    repo: detectRepo(),
    branch: detectBranch(),
    measured: true,
    done: totalMatches === 0 && paths.length === 0,
    total: { files: countedFiles.size, matches: totalMatches, paths: paths.length },
    vocabulary: {
      pattern: 'unppp',
      kept: true,
      note: 'Frame vocabulary, like "story" or "cover" - the word for a project in this frame. Never counts toward done.',
      ...vocabulary,
    },
    allowlist: ALLOWLIST,
    toolingTokens: TOOLING_TOKENS,
    exemptTokens: [...EXEMPT_TOKENS],
    categories,
    paths,
  };

  // Keep the committed file stable between builds: only generatedAt changed
  // means nothing changed, so leave the file (and its diff) alone
  try {
    const previous = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const same =
      JSON.stringify({ ...previous, generatedAt: null, branch: null, repo: null }) ===
      JSON.stringify({ ...manifest, generatedAt: null, branch: null, repo: null });
    if (same && previous.repo === manifest.repo && previous.branch === manifest.branch) {
      console.log(
        `🔎 unparty refs unchanged: ${manifest.total.matches} matches in ${manifest.total.files} files, ${manifest.total.paths} paths (unppp vocabulary kept: ${vocabulary.matches})`
      );
      return previous;
    }
  } catch {
    // first run, unreadable, or invalid - write fresh below
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `🔎 unparty refs: ${manifest.total.matches} matches in ${manifest.total.files} files, ${manifest.total.paths} paths (unppp vocabulary kept: ${vocabulary.matches})${manifest.done ? ' - done at zero ✅' : ''}`
  );
  return manifest;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateUnpartyRefs();
}

export { generateUnpartyRefs };

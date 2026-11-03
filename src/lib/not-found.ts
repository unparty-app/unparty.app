import 'server-only';

import { prisma } from '@/lib/prisma';
import { dbOn } from '@/lib/db-on';
import { getPublishedEditorialArticles } from '@/app/constants/editorial-articles';
import { listProjects } from '@/lib/projects';
import storiesManifest from '@/data/storiesManifest.json';

/**
 * Server-side helpers for the 404 page (src/app/not-found.tsx): what kind of
 * request missed, which real pages it most likely meant, and a daily count of
 * misses with no personal data (NotFoundHit).
 */

export type NotFoundKind = 'page' | 'scanner';

export interface NotFoundSuggestion {
  href: string;
  label: string;
}

const MAX_PATH = 200;

// Closest-match cutoff: two edits in six letters ('theme' vs 'seeme', 0.6)
// is a different word, not a slip
const MIN_SIMILARITY = 0.67;

// Probes for software this site doesn't run (WordPress, PHP, dotfiles, admin
// panels). They get the plain page with no suggestions and are counted apart
const SCANNER = /\.(php\d?|aspx?|jsp|cgi|env|ini|ya?ml|sql|bak|old|swp|log|git)(\/|$)|(^|\/)(wp-|wordpress|xmlrpc|phpmyadmin|cgi-bin|vendor\/|\.git|\.env|\.aws|\.ssh|server-status)/i;

export function classifyPath(path: string): NotFoundKind {
  return SCANNER.test(path) ? 'scanner' : 'page';
}

// --- did you mean ---------------------------------------------------------

interface Candidate extends NotFoundSuggestion {
  keys: string[]; // What a mistyped path is compared against
}

const titleCase = (slug: string) => slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Built once per server instance: pages that exist and are worth suggesting,
// plus a lookup by href. Not home: the page links there anyway, and short
// words like 'theme' sit one edit from 'home'
let candidates: { all: Candidate[]; byHref: Map<string, Candidate> } | null = null;
function getCandidates() {
  if (candidates) return candidates;
  const list: Candidate[] = [
    { href: '/article', label: 'Articles', keys: ['article', 'articles', 'docs', 'blog'] },
    { href: '/covers', label: 'Covers', keys: ['covers', 'story', 'stories'] },
    { href: '/founders', label: 'Founders', keys: ['founders', 'founder', 'about', 'team'] },
    { href: '/unppp', label: 'unppps', keys: ['unppp', 'unppps', 'products', 'projects'] },
    { href: '/status', label: 'Status', keys: ['status'] },
    { href: '/books', label: 'Books', keys: ['books', 'book'] },
  ];
  // The owner's own projects (FoundersConfig) and unparty's unppps
  for (const p of listProjects()) {
    list.push({ href: `/${p.id}`, label: p.name || p.id, keys: [p.id, p.id.replace(/^theunparty/, '')] });
  }
  for (const a of getPublishedEditorialArticles()) {
    list.push({ href: `/article/${a.slug}`, label: a.title, keys: [a.slug] });
  }
  for (const slug of storiesManifest.published as string[]) {
    list.push({ href: `/story/${slug}`, label: titleCase(slug), keys: [slug] });
  }
  candidates = { all: list, byHref: new Map(list.map((c) => [c.href, c])) };
  return candidates;
}

// Levenshtein similarity, 0..1. Strings whose lengths alone put them below
// MIN_SIMILARITY score 0 without the full comparison (the distance is at
// least the length difference), so a long path costs almost nothing
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  if (Math.min(a.length, b.length) / Math.max(a.length, b.length) < MIN_SIMILARITY) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

function safeDecode(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

// Kept out of the count: too long to be a real page, or an '@' (could carry
// an email), checked decoded so '%40' is caught too
const mayStore = (path: string) => path.length <= MAX_PATH && !safeDecode(path).includes('@');

// '/Articles/My_Post.md/' -> ['articles', 'my-post']
function segmentsOf(path: string): string[] {
  return safeDecode(path)
    .toLowerCase()
    .split('/')
    .map((s) => s.replace(/\.(md|mdx|html?)$/, '').replace(/[_\s]+/g, '-'))
    .filter(Boolean);
}

/**
 * Up to three real pages the visitor most likely meant, best first. Never
 * used to redirect: a redirect from a missing URL to a guess hides the broken
 * link and can count as a soft 404.
 *
 * 1. A parent that exists: /article/some-post/null -> /article/some-post
 * 2. Common slips: /articles/x -> /article/x, /theme -> /theunpartytheme
 * 3. Closest match by edit distance on the slug, or on the whole path
 */
export function suggestRoutes(path: string): NotFoundSuggestion[] {
  // No page on this site has a path this long
  if (path.length > MAX_PATH) return [];
  const { all, byHref } = getCandidates();
  const segments = segmentsOf(path);
  if (!segments.length) return [];

  const picked: NotFoundSuggestion[] = [];
  const pick = (href: string) => {
    const c = byHref.get(href);
    if (c && !picked.some((p) => p.href === href)) picked.push({ href: c.href, label: c.label });
  };

  // 1. The nearest existing parent
  for (let n = segments.length - 1; n >= 1; n--) {
    const parent = '/' + segments.slice(0, n).join('/');
    if (byHref.has(parent) && parent !== '/article') {
      pick(parent);
      break;
    }
  }

  // 2. Common slips
  const [first, ...rest] = segments;
  const aliased = ({ articles: 'article', stories: 'story', unppps: 'unppp' } as Record<string, string>)[first];
  if (aliased) pick('/' + [aliased, ...rest].join('/'));
  if (segments.length === 1) pick(`/theunparty${first.replace(/^theunparty/, '')}`);

  // 3. Closest by edit distance
  const last = segments[segments.length - 1];
  const whole = segments.join('-');
  const scored = all
    .map((c) => ({ c, score: Math.max(...c.keys.map((k) => Math.max(similarity(last, k), similarity(whole, k)))) }))
    .filter(({ score }) => score >= MIN_SIMILARITY)
    .sort((a, b) => b.score - a.score);
  for (const { c } of scored) {
    if (picked.length >= 3) break;
    pick(c.href);
  }

  return picked.slice(0, 3);
}

// --- counting -----------------------------------------------------------

/**
 * Count one miss for today (UTC). Stores only the missing path (no query
 * string) and, when the link came from this site, the linking page's path.
 * A path with an '@' (could carry an email, '%40' included) or longer than
 * 200 chars is not stored; such a linking page is stored as ''. Never throws: a missing table or database only logs a warning.
 */
export async function recordNotFound(path: string, kind: NotFoundKind, referer: string | null, host: string | null) {
  const clean = path.split('?')[0];
  if (!clean || !mayStore(clean)) return;

  let referrerPath = '';
  if (referer && host) {
    try {
      const ref = new URL(referer);
      if (ref.host === host && mayStore(ref.pathname)) referrerPath = ref.pathname;
    } catch {
      // Not a URL: keep ''
    }
  }

  // Nowhere to count it, and nothing wrong with that
  if (!dbOn()) return;

  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  try {
    await prisma.notFoundHit.upsert({
      where: { day_path_referrerPath: { day, path: clean, referrerPath } },
      create: { day, path: clean, referrerPath, kind },
      update: { count: { increment: 1 } },
    });
  } catch (error) {
    console.warn('[not-found] could not record a 404:', error instanceof Error ? error.message : error);
  }
}

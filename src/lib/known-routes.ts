/**
 * Which dynamic URLs exist, for src/proxy.ts.
 *
 * A page that calls notFound() gets an empty HTML shell from Next.js: the 404
 * page only appears after JavaScript runs, so crawlers, link previews and
 * no-JS visitors see a blank page (vercel/next.js#99793, still open on 16.4).
 * A URL that matches no route gets the full not-found page. So the proxy
 * rewrites a slug these routes don't serve to an unmatched path before the
 * page runs; the page's own notFound() stays as the backstop.
 *
 * The slugs come from src/data/routeManifest.json, generated from each
 * route's registry by scripts/generate-route-manifest.cts. next.config.ts
 * passes it in as ROUTE_MANIFEST rather than this file importing it, so dev
 * and tsc work before it exists; with no file nothing is rewritten. Adding a dynamic
 * route that calls notFound()? Add it here and to that script.
 */

// Route -> what may follow /<route>/<slug>
const SUB_PAGES: Record<string, string[]> = {
  article: ['', '/read'], // src/app/article/[slug], [slug]/read
  story: ['', '/read'], // src/app/story/[slug], [slug]/read
  watch: [''], // src/app/watch/[slug]
  html: [''], // src/app/html/[filename]
  unppp: [''], // src/app/unppp/[type]
};

const routeManifest: Record<string, string[]> = JSON.parse(process.env.ROUTE_MANIFEST || '{}');
const known = new Map(Object.entries(routeManifest).map(([route, slugs]) => [route, new Set(slugs)]));

const ROUTE = /^\/([^/]+)\/([^/]+)(\/[^/]+)?$/;

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** True when `pathname` is one of these routes with a slug it doesn't serve. */
export function isMissingRoute(pathname: string): boolean {
  const match = ROUTE.exec(pathname);
  if (!match) return false;
  const [, route, slug, rest = ''] = match;
  const slugs = known.get(route);
  if (!slugs || !SUB_PAGES[route]?.includes(rest)) return false;
  // /story/cover-004: the page redirects old cover ids to their slug
  if (route === 'story' && /^cover-\d+$/.test(slug)) return false;
  return !slugs.has(safeDecode(slug));
}

// --- /steps/[stepId] (#1390) ------------------------------------------------
//
// Steps are database rows that change without a deploy, so they can't be in
// the build-time list above. The proxy asks GET /api/steps/exists for
// one id at a time instead, and remembers each answer: a step that exists
// for 10 minutes, a missing one for 1 minute, so a step created a moment ago
// is found on the next check. Any doubt (timeout, error) counts as "exists",
// and the page's own notFound() decides.

const STEP = /^\/steps\/([^/]+)$/;
const FOUND_MS = 10 * 60 * 1000;
const MISSING_MS = 60 * 1000;
const knownSteps = new Map<string, { exists: boolean; until: number }>();

/** The step id in a /steps/<id> path, or null. */
export function stepIdFrom(pathname: string): string | null {
  const match = STEP.exec(pathname);
  return match ? safeDecode(match[1]) : null;
}

/** True only when /api/steps/exists says this step doesn't exist. */
export async function isMissingStep(stepId: string, origin: string): Promise<boolean> {
  const cached = knownSteps.get(stepId);
  if (cached && cached.until > Date.now()) return !cached.exists;
  try {
    const res = await fetch(`${origin}/api/steps/exists?id=${encodeURIComponent(stepId)}`, {
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const { exists } = (await res.json()) as { exists: boolean | null };
    if (typeof exists !== 'boolean') return false;
    if (knownSteps.size > 1000) knownSteps.clear(); // bots probing ids can't grow it forever
    knownSteps.set(stepId, { exists, until: Date.now() + (exists ? FOUND_MS : MISSING_MS) });
    return !exists;
  } catch {
    return false;
  }
}

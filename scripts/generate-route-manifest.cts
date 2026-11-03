/**
 * Writes src/data/routeManifest.json: every slug each dynamic route serves,
 * read from the same registries its page checks before calling notFound().
 *
 * Why: a page that calls notFound() gets an empty HTML shell from Next.js (the
 * 404 shows only after JavaScript runs; vercel/next.js#99793, still open on
 * 16.4). An unmatched URL gets the full not-found page. src/middleware.ts uses
 * this list to send a missing slug down the unmatched path instead, see
 * src/lib/known-routes.ts.
 *
 * Runs in `npm run build` (after sync-stories) and `npm run dev` (predev).
 * Usage: npx tsx scripts/generate-route-manifest.cts
 *
 * .cts on purpose: the article registry loads JSON and MD articles with
 * require(), which an ES module run doesn't have. It would warn and return
 * only the TS articles, and the middleware would then 404 every other one.
 */
import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getPublishedEditorialArticles } from '../src/app/constants/editorial-articles/registry';
import { getPublishedVideoEntries } from '../src/app/constants/video-registry';
import { UNPPP_NAV_ITEMS } from '../src/app/constants/unpppNav';
import storiesManifest from '../src/data/storiesManifest.json';
import UnpppTypesConfig from '../src/data/UnpppTypesConfig.json';

const root = process.cwd(); // npm runs scripts from the repo root

// The registries catch a failed loader and only warn. A short list would 404
// real pages, so any warning while collecting fails the build instead
const warnings: unknown[][] = [];
const warn = console.warn;
console.warn = (...args: unknown[]) => {
  warnings.push(args);
  warn(...args);
};
const sorted = (slugs: string[]) => [...new Set(slugs)].sort();

// Keys are the route's first segment; src/lib/known-routes.ts says which
// sub-pages (like /read) each one has
const manifest: Record<string, string[]> = {
  // src/app/article/[slug]: published JSON, TS and MD articles
  article: sorted(getPublishedEditorialArticles().map((a) => a.slug)),
  // src/app/story/[slug]: published stories (sync-stories fills the manifest)
  story: sorted(storiesManifest.published as string[]),
  // src/app/watch/[slug]
  watch: sorted(getPublishedVideoEntries().map((v) => v.slug)),
  // src/app/html/[filename]: any public/<name>.html
  html: sorted(readdirSync(join(root, 'public')).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''))),
  // src/app/unppp/[type]: a type in UnpppTypesConfig with a nav item
  unppp: sorted(
    UnpppTypesConfig.types.map((t) => t.id).filter((id) => UNPPP_NAV_ITEMS.some((item) => item.category === id))
  ),
};

console.warn = warn;
if (warnings.length) {
  console.error('✗ routeManifest.json not written: a registry failed to load (see the warnings above)');
  process.exit(1);
}

const out = join(root, 'src/data/routeManifest.json');
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `✓ routeManifest.json: ${Object.entries(manifest).map(([route, slugs]) => `${slugs.length} ${route}`).join(', ')}`
);

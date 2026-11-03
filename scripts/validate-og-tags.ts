#!/usr/bin/env tsx
/**
 * scripts/validate-og-tags.ts
 *
 * Validates OG/Twitter meta tags + JSON-LD structured data across every
 * real route in the app (src/lib/site-routes.ts — the same source
 * src/app/sitemap.ts uses), reading static HTML from `next build`'s output
 * (.next/server/app). Requires a completed build first: `npm run
 * build:validate` (or `npm run validate:og:local`, which does both).
 *
 * Route discovery is dynamic — new articles/stories/unppp pages get
 * validated automatically the moment they're published, no config edit
 * needed. og-validation-config.json now only holds what isn't
 * route-derived: image URL patterns, recommended (non-required) tags, and
 * image size spec.
 *
 * Default run validates a fast subset (all static routes + a sample of
 * showcase/article/story routes) — meant for push/PR feedback. `--full`
 * validates every route the app has — meant for the nightly schedule run.
 *
 * Usage:
 *   npm run validate:og                # fast subset
 *   npm run validate:og -- --full      # every route
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// src/app/constants/editorial-articles/registry.ts intentionally uses
// require() (with its own try/catch fallback) to load JSON/MD articles —
// written for Next.js's runtime, where require() is always available even
// in otherwise-ESM files. This is a plain ESM tsx script, where Node
// doesn't provide a global require, so those calls would silently fail
// and registry.ts would quietly fall back to TS-only articles. Shimming
// require here (standard Node interop pattern) instead of touching
// registry.ts keeps that file's real runtime behavior untouched.
//
// Scoped to registry.ts's own location, not this script's — a global
// require resolves relative paths (registry.ts's `require('../../utils/...')`)
// against whatever file created it, so pointing this at validate-og-tags.ts's
// own path would resolve those relative imports from the wrong directory.
globalThis.require = createRequire(
  new URL('../src/app/constants/editorial-articles/registry.ts', import.meta.url)
);

import { getAllSiteRoutes, type SiteRoute, type SiteRouteType } from '../src/lib/site-routes';

// import.meta.url, not __dirname — this repo's scripts run as ESM
// ("type": "module" in package.json), where __dirname doesn't exist.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const configPath = path.join(__dirname, 'og-validation-config.json');
let config: { buildDir: string; ogImagePatterns: string[]; recommendedTags?: string[] };
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error(`${colors.red}✗ ERROR${colors.reset} Failed to load config: ${(error as Error).message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const FULL = args.includes('--full');
const SAMPLE_SIZE = 5;

function log(level: 'error' | 'warn' | 'success' | 'info', message: string) {
  const prefix = {
    error: `${colors.red}✗ ERROR${colors.reset}`,
    warn: `${colors.yellow}⚠ WARNING${colors.reset}`,
    success: `${colors.green}✓ SUCCESS${colors.reset}`,
    info: `${colors.cyan}ℹ INFO${colors.reset}`,
  }[level];
  console.log(`${prefix} ${message}`);
}

// ── Route selection ──────────────────────────────────────────────────────

const HOME_REQUIRED_TAGS = [
  'og:title', 'og:description', 'og:image', 'og:url', 'og:type',
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
];
const STANDARD_REQUIRED_TAGS = ['og:title', 'og:description', 'og:image', 'twitter:card'];

interface ValidatedRoute extends SiteRoute {
  name: string;
  priority: 'critical' | 'high';
  requiredTags: string[];
}

function toValidatedRoute(r: SiteRoute): ValidatedRoute {
  const isHome = r.route === '';
  return {
    ...r,
    name: isHome ? '/' : r.route,
    priority: isHome ? 'critical' : 'high',
    requiredTags: isHome ? HOME_REQUIRED_TAGS : STANDARD_REQUIRED_TAGS,
  };
}

function selectRoutes(routes: SiteRoute[]): SiteRoute[] {
  if (FULL) return routes;

  const byType = (t: SiteRouteType) => routes.filter((r) => r.type === t);
  const byRecency = (rs: SiteRoute[]) =>
    [...rs].sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));

  return [
    ...byType('static'), // small, fixed set — always all of it
    ...byType('showcase').slice(0, SAMPLE_SIZE),
    ...byRecency(byType('article')).slice(0, SAMPLE_SIZE),
    ...byRecency(byType('story')).slice(0, SAMPLE_SIZE),
  ];
}

// ── Meta tag validation (unchanged logic from the previous .cjs version) ──

interface MetaTag { name: string; content: string }

function parseMetaTags(html: string): MetaTag[] {
  const metaTags: MetaTag[] = [];
  const metaRegex = /<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"\s*\/?>/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    metaTags.push({ name: match[1], content: match[2] });
  }
  return metaTags;
}

function validateMetaTags(metaTags: MetaTag[], requiredTags: string[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const found: Record<string, string> = {};

  requiredTags.forEach((tagName) => {
    const tag = metaTags.find((t) => t.name === tagName);
    if (!tag) {
      errors.push(`Missing required tag: ${tagName}`);
      return;
    }
    found[tagName] = tag.content;
    if (!tag.content || tag.content.trim() === '') {
      errors.push(`Empty content for tag: ${tagName}`);
    }
    if ((tagName === 'og:image' || tagName === 'twitter:image') && tag.content) {
      const isValid = config.ogImagePatterns.some((pattern) => new RegExp(pattern).test(tag.content));
      if (!isValid) {
        warnings.push(`Invalid image URL pattern for ${tagName}: ${tag.content}`);
      }
    }
  });

  config.recommendedTags?.forEach((tagName) => {
    const tag = metaTags.find((t) => t.name === tagName);
    if (!tag && !requiredTags.includes(tagName)) {
      warnings.push(`Missing recommended tag: ${tagName}`);
    }
  });

  return { errors, warnings, found };
}

// ── JSON-LD validation (new) ─────────────────────────────────────────────
//
// Shape checks intentionally mirror src/app/utils/structuredData.ts's
// generateArticleJsonLd/generateBreadcrumbJsonLd/generateOrganizationJsonLd
// output — not literal code sharing (that file builds JSON-LD from an
// EditorialArticle at render time; this checks JSON-LD already embedded in
// rendered HTML, the opposite direction), but any field required here
// should exist on what those generators actually produce.

function parseJsonLdBlocks(html: string): { data: Record<string, unknown> | null; raw: string }[] {
  const blocks: { data: Record<string, unknown> | null; raw: string }[] = [];
  const scriptRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1].trim();
    try {
      blocks.push({ data: JSON.parse(raw), raw });
    } catch {
      blocks.push({ data: null, raw });
    }
  }
  return blocks;
}

function findByType(blocks: { data: Record<string, unknown> | null }[], type: string) {
  return blocks.find((b) => b.data?.['@type'] === type)?.data ?? null;
}

function requireFields(obj: Record<string, unknown> | null, type: string, fields: string[], errors: string[]) {
  if (!obj) {
    errors.push(`Missing ${type} JSON-LD block`);
    return;
  }
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      errors.push(`${type} JSON-LD missing field: ${field}`);
    }
  }
}

function validateJsonLd(html: string, routeType: SiteRouteType, isHome: boolean): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blocks = parseJsonLdBlocks(html);

  const malformed = blocks.filter((b) => b.data === null);
  if (malformed.length > 0) {
    errors.push(`${malformed.length} JSON-LD block(s) failed to parse as JSON`);
  }

  if (routeType === 'article' || routeType === 'story' || routeType === 'video') {
    if (routeType === 'video') {
      requireFields(
        findByType(blocks, 'VideoObject'),
        'VideoObject',
        ['name', 'description', 'thumbnailUrl', 'contentUrl'],
        errors
      );
    } else {
      requireFields(findByType(blocks, 'Article'), 'Article', ['headline', 'image', 'datePublished', 'author'], errors);
    }
    const breadcrumb = findByType(blocks, 'BreadcrumbList');
    if (!breadcrumb) {
      errors.push('Missing BreadcrumbList JSON-LD block');
    } else if (!Array.isArray(breadcrumb.itemListElement) || breadcrumb.itemListElement.length === 0) {
      errors.push('BreadcrumbList JSON-LD missing non-empty itemListElement array');
    }
  }

  if (isHome) {
    requireFields(findByType(blocks, 'Organization'), 'Organization', ['name', 'logo'], errors);
  }

  return { errors, warnings };
}

// ── HTML file resolution (unchanged logic) ────────────────────────────────

function getHtmlPath(route: string): string {
  if (route === '/') {
    const possiblePaths = [
      path.join(config.buildDir, 'index.html'),
      path.join(config.buildDir, 'page.html'),
      path.join(config.buildDir, '../pages/index.html'),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
    return path.join(config.buildDir, 'index.html');
  }

  const cleanRoute = route.slice(1);
  const lastSegment = cleanRoute.split('/').pop() ?? cleanRoute;
  const possiblePaths = [
    path.join(config.buildDir, `${cleanRoute}.html`),
    path.join(config.buildDir, cleanRoute, 'index.html'),
    path.join(config.buildDir, cleanRoute, 'page.html'),
    // Some routes' build output repeats the last segment as the filename
    // instead of using index.html/page.html — e.g. /story -> story/story.html.
    path.join(config.buildDir, cleanRoute, `${lastSegment}.html`),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return possiblePaths[0];
}

interface PageResult {
  route: ValidatedRoute;
  htmlPath: string;
  exists: boolean;
  errors: string[];
  warnings: string[];
  found: Record<string, string>;
}

function validateRoute(route: ValidatedRoute): PageResult {
  const routeForPath = route.route === '' ? '/' : route.route;
  const htmlPath = getHtmlPath(routeForPath);

  if (!fs.existsSync(htmlPath)) {
    return { route, htmlPath, exists: false, errors: ['HTML file not found'], warnings: [], found: {} };
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const metaTags = parseMetaTags(html);
  const metaResult = validateMetaTags(metaTags, route.requiredTags);
  const jsonLdResult = validateJsonLd(html, route.type, route.route === '');

  return {
    route,
    htmlPath,
    exists: true,
    errors: [...metaResult.errors, ...jsonLdResult.errors],
    warnings: [...metaResult.warnings, ...jsonLdResult.warnings],
    found: metaResult.found,
  };
}

// ── Report ────────────────────────────────────────────────────────────────

function generateReport(results: PageResult[]): boolean {
  const totalPages = results.length;
  const passedPages = results.filter((r) => r.errors.length === 0).length;
  const failedPages = totalPages - passedPages;
  const criticalFailures = results.filter((r) => r.route.priority === 'critical' && r.errors.length > 0).length;

  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bold}Open Graph + JSON-LD Validation Report${colors.reset}`);
  console.log('='.repeat(80));
  console.log(`Mode: ${FULL ? 'FULL (every route)' : `SAMPLE (${totalPages} routes — pass --full for everything)`}`);
  console.log(`Total Pages: ${totalPages}`);
  console.log(`${colors.green}Passed: ${passedPages}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedPages}${colors.reset}`);
  console.log(`${colors.red}Critical Failures: ${criticalFailures}${colors.reset}`);
  console.log('='.repeat(80) + '\n');

  results.forEach((result) => {
    const status = result.errors.length === 0 ? '✓' : '✗';
    const color = result.errors.length === 0 ? colors.green : colors.red;

    console.log(`\n${color}${status} ${result.route.name}${colors.reset} [${result.route.type}/${result.route.priority}]`);
    console.log(`  Path: ${result.htmlPath}`);

    if (!result.exists) {
      console.log(`  ${colors.red}HTML file not found${colors.reset}`);
      return;
    }

    if (result.errors.length > 0) {
      console.log(`  ${colors.red}Errors:${colors.reset}`);
      result.errors.forEach((err) => console.log(`    - ${err}`));
    }
    if (result.warnings.length > 0) {
      console.log(`  ${colors.yellow}Warnings:${colors.reset}`);
      result.warnings.forEach((warn) => console.log(`    - ${warn}`));
    }
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`  ${colors.green}All checks passed${colors.reset}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  if (failedPages > 0) {
    console.log(`\n${colors.bold}📊 SUMMARY:${colors.reset} ${failedPages}/${totalPages} page(s) failed`);
    if (criticalFailures > 0) {
      console.log(`${colors.red}${colors.bold}⚠️  CRITICAL:${colors.reset} ${criticalFailures} critical-priority page(s) affected!\n`);
    }
  } else {
    console.log(`\n${colors.green}${colors.bold}🎉 All ${totalPages} validated pages have valid OG metadata + JSON-LD!${colors.reset}\n`);
  }

  return failedPages === 0 && criticalFailures === 0;
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${colors.bold}🔍 Starting OG + JSON-LD Validation...${colors.reset}\n`);
  console.log(`Build directory: ${config.buildDir}`);

  const allRoutes = await getAllSiteRoutes();
  const selected = selectRoutes(allRoutes).map(toValidatedRoute);

  console.log(`Discovered ${allRoutes.length} total routes; validating ${selected.length} (${FULL ? 'full' : 'sample'}).\n`);

  const results = selected.map((route) => {
    log('info', `Validating ${route.name}`);
    return validateRoute(route);
  });

  const success = generateReport(results);

  if (success) {
    log('success', 'All validated pages passed!');
    process.exit(0);
  } else {
    log('error', 'Validation failed. See report above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[validate-og-tags] Failed:', err);
  process.exit(1);
});

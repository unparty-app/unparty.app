#!/usr/bin/env tsx
/**
 * scripts/test-vercel-queries.ts
 *
 * Smoke test for src/lib/vercel-analytics-queries.ts (theunpartyapp#664),
 * mirroring scripts/test-ga-queries.ts's diagnostic style but for the
 * Vercel Analytics drain data instead of GA4 — first-party pageview counts
 * for /article/* and /story/* independent of Google.
 *
 * Unlike ga-queries, this reads from Postgres via Prisma, which loads
 * DATABASE_URL from .env itself (no manual env-file loading needed here).
 *
 * Usage:
 *   npm run test:vercel-queries               # last 30 days
 *   npm run test:vercel-queries -- --days=7
 */

import { Prisma } from '@prisma/client';
import { VercelAnalyticsQueries } from '../src/lib/vercel-analytics-queries';

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const prefix = `${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
};

const days = Number(getArg('--days') ?? '30');
const endDate = new Date();
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - days);

interface PathGroup {
  path: string;
  views: number;
}

function summarizePrefix(allPaths: PathGroup[], pathPrefix: string) {
  const rows = allPaths.filter((p) => p.path.startsWith(pathPrefix));
  const totalViews = rows.reduce((sum, r) => sum + r.views, 0);
  return { rows: rows.sort((a, b) => b.views - a.views), totalViews };
}

function reportPrefix(allPaths: PathGroup[], pathPrefix: string, limit = 10) {
  console.log(`\n=== ${pathPrefix} (last ${days}d, all traffic sources) ===`);

  const { rows, totalViews } = summarizePrefix(allPaths, pathPrefix);
  console.log(`Totals: ${totalViews} pageviews across ${rows.length} distinct pages`);

  if (rows.length === 0) {
    console.log('(No pageviews recorded under this prefix in this window.)');
    return;
  }

  console.log('\nTop pages:');
  for (const row of rows.slice(0, limit)) {
    console.log(`  ${row.views.toString().padStart(5)} views  ${row.path}`);
  }
}

/**
 * Distinguishes the ways this can fail so a setup problem is obvious
 * instead of an opaque Prisma stack trace: missing/malformed DATABASE_URL,
 * an unreachable DB host, and bad credentials each need a different fix.
 */
function logPrismaFailure(err: unknown, context: string) {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    if (/Environment variable not found: DATABASE_URL/.test(err.message)) {
      console.error(
        `[vercel-queries] ${context}: DATABASE_URL is not set. Set it in .env or .env.local — see .env.example. ` +
          '(Prisma loads .env automatically here; no manual env-file loading needed for this script.)'
      );
    } else if (err.errorCode === 'P1001') {
      console.error(
        `[vercel-queries] ${context}: can't reach the database host. Check DATABASE_URL points at a live Neon endpoint ` +
          `and that you have network access to it. Prisma's message: ${err.message}`
      );
    } else if (err.errorCode === 'P1000') {
      console.error(
        `[vercel-queries] ${context}: authentication to the database failed — the credentials in DATABASE_URL are wrong. ` +
          `Prisma's message: ${err.message}`
      );
    } else {
      console.error(`[vercel-queries] ${context}: Prisma failed to initialize. Prisma's message: ${err.message}`);
    }
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(
      `[vercel-queries] ${context}: query failed (Prisma error ${err.code}). ` +
        'If this is P2021/P2022, the vercel_pageviews table or a column on it is missing — run `npm run db:generate` ' +
        `and confirm the schema is pushed/migrated. Prisma's message: ${err.message}`
    );
    return;
  }

  console.error(`[vercel-queries] ${context}: unexpected error.`, err);
}

async function main() {
  console.log(`Querying vercel_pageviews (via Vercel Analytics drain) for the last ${days} days...`);

  const allPaths = await VercelAnalyticsQueries.getPageviewsByPath(startDate, endDate);
  const siteTotal = allPaths.reduce((sum, r) => sum + r.views, 0);

  console.log(`\nSite-wide total: ${siteTotal} pageviews across ${allPaths.length} distinct paths in this window.`);

  if (siteTotal === 0) {
    console.log(
      '\nNo pageviews recorded anywhere in this window. Before assuming /article and /story specifically have no ' +
        'traffic, rule out the drain itself not being wired:\n' +
        '  - The Vercel Analytics drain only fires from a deployed Vercel project, not local dev — this being empty ' +
        'locally is expected.\n' +
        '  - On the deployed project, confirm the Analytics Drain is configured (Vercel project settings) and that ' +
        'DRAIN_SECRET (preferred) or the legacy VERCEL_WEBHOOK_SECRET matches what the drain sends — see ' +
        'src/app/api/analytics/vercel/route.ts.\n' +
        '  - Try a wider --days window in case the drain is working but traffic is just sparse.'
    );
    return;
  }

  reportPrefix(allPaths, '/article/');
  reportPrefix(allPaths, '/story/');

  console.log('\nDone. If this printed real numbers, the Vercel Analytics query layer is working end to end.');
}

main().catch((err) => {
  logPrismaFailure(err, 'main');
  console.error('\n[test-vercel-queries] Failed — see the [vercel-queries] log line above for the specific cause.');
  process.exit(1);
});

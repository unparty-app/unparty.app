#!/usr/bin/env tsx
/**
 * scripts/test-ga-queries.ts
 *
 * Smoke test for src/lib/ga-queries.ts (theunpartyapp#664). Prints organic
 * landing-page performance for /article/* and /story/* over the last N days
 * so GA4 credential/property setup issues surface immediately instead of
 * silently failing inside an admin route later.
 *
 * Usage:
 *   npm run test:ga-queries               # last 30 days
 *   npm run test:ga-queries -- --days=7
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GA4Queries } from '../src/lib/ga-queries';

// import.meta.url, not __dirname — this repo's scripts run as ESM
// ("type": "module" in package.json), where __dirname doesn't exist.
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * tsx doesn't auto-load .env files the way Next.js's dev/build server does,
 * so standalone scripts have to load them manually — same approach as
 * scripts/view-google-sheet-with-env.mjs. Loads .env first, then .env.local
 * on top (matching Next's own precedence), without overwriting anything
 * already present in the environment.
 */
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

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

async function reportPrefix(pathPrefix: string) {
  console.log(`\n=== ${pathPrefix} (last ${days}d, organic search only) ===`);

  const summary = await GA4Queries.getOrganicTrafficSummary(startDate, endDate, pathPrefix);
  console.log(
    `Totals: ${summary.sessions} sessions, ${summary.engagedSessions} engaged, ` +
      `avg engagement ${formatSeconds(summary.avgEngagementTimeSeconds)}, ${summary.pageCount} distinct pages`
  );

  if (summary.sessions === 0) {
    console.log('(No organic sessions in this window — expected pre-#661/e8e885f, or if the window predates those changes.)');
    return;
  }

  const topPages = await GA4Queries.getOrganicLandingPages(startDate, endDate, pathPrefix, 10);
  console.log('\nTop pages:');
  for (const page of topPages) {
    console.log(
      `  ${page.sessions.toString().padStart(5)} sessions  ${formatSeconds(page.avgEngagementTimeSeconds).padStart(7)} avg engagement  ${page.path}`
    );
  }
}

async function main() {
  console.log(`Querying GA4 property from GA4_PROPERTY_ID for the last ${days} days...`);

  await reportPrefix('/article/');
  await reportPrefix('/story/');

  console.log('\nDone. If this printed real numbers, GA4 setup is working end to end.');
}

main().catch((err) => {
  console.error('\n[test-ga-queries] Failed — see the [ga-queries] log lines above for the specific cause.');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

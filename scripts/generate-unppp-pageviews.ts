#!/usr/bin/env tsx
/**
 * scripts/generate-unppp-pageviews.ts
 *
 * CLI wrapper around src/lib/unppp-pageview-snapshot.ts — writes the
 * computed snapshot to a static JSON file that src/utils/unpppPriority.ts
 * statically imports. That file must stay client-safe (no Prisma/server
 * imports) since it's consumed by the client component
 * EffortVisualization.tsx, so this is the only place that queries Postgres
 * for this data locally.
 *
 * The real scheduled refresh runs via Vercel Cron
 * (src/app/api/cron/snapshot-unppp-pageviews/route.ts), which opens a PR
 * with the same computation — this script is for local/manual use.
 *
 * Usage:
 *   npm run generate-unppp-pageviews
 *   npm run generate-unppp-pageviews -- --window-days 14
 *   npm run generate-unppp-pageviews -- --json           # print instead of write
 *   npm run generate-unppp-pageviews -- --output <path>
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'
import UnpppsConfig from '../src/data/UnpppsConfig.json'
import { computeUnpppPageviewSnapshot } from '../src/lib/unppp-pageview-snapshot'
import { prisma } from '../src/lib/prisma'

const args = process.argv.slice(2)
const getArg = (flag: string) => {
  const i = args.indexOf(flag)
  return i !== -1 && args[i + 1] ? args[i + 1] : null
}

const OUTPUT_PATH = resolve(getArg('--output') ?? 'public/data/unppp-pageviews.json')
// Matches TRACE_RETENTION_DAYS in src/app/api/cron/db-cleanup/route.ts — never
// ask for pageviews older than what the DB actually retains.
const WINDOW_DAYS = parseInt(getArg('--window-days') ?? '30', 10)
const PRINT_JSON = args.includes('--json')

async function main() {
  const output = await computeUnpppPageviewSnapshot(WINDOW_DAYS)

  if (PRINT_JSON) {
    console.log(JSON.stringify(output, null, 2))
    return
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8')
  console.log(
    `Matched ${output.pageviews.length}/${UnpppsConfig.unppps.length} unppps, ${output.total_pageviews} pageviews.`
  )
  console.log(`Wrote snapshot to ${OUTPUT_PATH}`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

#!/usr/bin/env tsx
/**
 * Live-scoring debug view for unppp-priority-count.ts + repo-priority-count.ts.
 *
 * Prints a sorted breakdown table across every UnpppsConfig entry so both
 * scoring files can be tuned and immediately eyeballed — no dev server, no
 * UI, just rerun after editing a weight constant.
 *
 * Usage:
 *   npm run priority:debug
 *   npx tsx scripts/priority-count-debug.ts --sort=repo --limit=15
 *   npx tsx scripts/priority-count-debug.ts --json
 *   npx tsx scripts/priority-count-debug.ts --stats
 *
 * Options:
 *   --sort=unppp|repo|combined   Sort column (default: combined)
 *   --limit=<n>                  Only show the top N rows
 *   --json                       Print raw JSON instead of a table
 *   --stats                      Print distribution stats instead of the row table —
 *                                mean/median/stdDev per metric, score-collision counts,
 *                                signal coverage, percentile-classification splits.
 *                                All computed live from the current run, nothing hardcoded.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import { calculatePriorityCount } from '../src/utils/unppp-priority-count'
import { calculateRepoPriorityCount } from '../src/utils/repo-priority-count'
import { getStepLinkPoints } from '../src/utils/step-priority-count'
import { buildStoryMentionCounts, getStoryMentionPoints } from '../src/utils/story-mention-count'
import { classifyByPercentile } from '../src/utils/percentile-classification'

const prisma = new PrismaClient()

interface UnpppConfigEntry {
  id: string
  repoName?: string
  [key: string]: unknown
}

function parseArgs() {
  const args = process.argv.slice(2)
  const sortArg = args.find(a => a.startsWith('--sort='))?.split('=')[1]
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1]
  return {
    sort: (sortArg === 'unppp' || sortArg === 'repo' ? sortArg : 'combined') as 'unppp' | 'repo' | 'combined',
    limit: limitArg ? parseInt(limitArg, 10) : undefined,
    json: args.includes('--json'),
    stats: args.includes('--stats'),
  }
}

function describe(values: number[]) {
  const n = values.length
  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / n
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2]
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n
  return {
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
    mean: Math.round(mean * 100) / 100,
    median,
    stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
  }
}

/** Groups values, reports how many rows are non-unique (share their value
 *  with at least one other row) and the single largest colliding group. */
function collisionStats(values: number[]) {
  const groups = new Map<number, number>()
  for (const v of values) groups.set(v, (groups.get(v) ?? 0) + 1)
  const distinctValues = groups.size
  const nonUniqueCount = values.length - [...groups.values()].filter(c => c === 1).length
  let largestGroupValue = 0
  let largestGroupSize = 0
  for (const [value, size] of groups) {
    if (size > largestGroupSize) {
      largestGroupValue = value
      largestGroupSize = size
    }
  }
  return {
    distinctValues,
    nonUniqueCount,
    nonUniquePct: Math.round((nonUniqueCount / values.length) * 1000) / 10,
    largestGroupValue,
    largestGroupSize,
    largestGroupPct: Math.round((largestGroupSize / values.length) * 1000) / 10,
  }
}

function printStats(rows: {
  id: string
  matched: boolean
  unpppTotal: number
  repoTotal: number
  stepLinkPoints: number
  storyMentionPoints: number
  combined: number
  url: number
  completedKeys: number
  expectedKeys: number
  category: string | null
  featured: boolean
  votableFeature: boolean
  storyPublished: boolean
  debt: number
  hasMedia: boolean
  hasPolarProduct: boolean
  hasExplicitRepoName: boolean
}[]) {
  const n = rows.length
  const pct = (count: number) => Math.round((count / n) * 1000) / 10

  console.log(`\n=== Unppp census — ${n} entries in UnpppsConfig.json ===\n`)

  const categoryCounts = new Map<string, number>()
  for (const r of rows) {
    const key = r.category ?? '(none)'
    categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1)
  }
  console.log('Category distribution:')
  console.table(
    [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count, pct: `${pct(count)}%` }))
  )

  const urlTierCounts = { 'unparty.app (4)': 0, 'testflight (3)': 0, 'vercel (2)': 0, 'other (1)': 0, 'none (0)': 0 }
  for (const r of rows) {
    if (r.url === 4) urlTierCounts['unparty.app (4)']++
    else if (r.url === 3) urlTierCounts['testflight (3)']++
    else if (r.url === 2) urlTierCounts['vercel (2)']++
    else if (r.url === 1) urlTierCounts['other (1)']++
    else urlTierCounts['none (0)']++
  }
  console.log('\nURL tier distribution:')
  console.table(
    Object.entries(urlTierCounts).map(([tier, count]) => ({ tier, count, pct: `${pct(count)}%` }))
  )

  const flag = (label: string, count: number) => ({ flag: label, count, total: n, pct: `${pct(count)}%` })
  console.log('\nFeature-flag coverage:')
  console.table([
    flag('featured', rows.filter(r => r.featured).length),
    flag('votableFeature', rows.filter(r => r.votableFeature).length),
    flag('storyPublished', rows.filter(r => r.storyPublished).length),
    flag('has media', rows.filter(r => r.hasMedia).length),
    flag('has polarProductId', rows.filter(r => r.hasPolarProduct).length),
    flag('has explicit repoName', rows.filter(r => r.hasExplicitRepoName).length),
  ])

  console.log('\nConfig completeness (completedKeys / expectedKeys, out of 25):')
  console.table(describe(rows.map(r => r.completedKeys)))

  console.log('\ndebt field stats:')
  console.table(describe(rows.map(r => r.debt)))

  console.log(`\n=== Priority score distribution — ${n} unppps ===\n`)

  console.log('Per-metric stats:')
  console.table({
    unpppTotal: describe(rows.map(r => r.unpppTotal)),
    repoTotal: describe(rows.map(r => r.repoTotal)),
    stepLinkPoints: describe(rows.map(r => r.stepLinkPoints)),
    storyMentionPoints: describe(rows.map(r => r.storyMentionPoints)),
    combined: describe(rows.map(r => r.combined)),
  })

  console.log('\nScore collisions (rows sharing an identical value):')
  console.table({
    unpppTotal: collisionStats(rows.map(r => r.unpppTotal)),
    repoTotal: collisionStats(rows.map(r => r.repoTotal)),
    combined: collisionStats(rows.map(r => r.combined)),
  })

  const matchedCount = rows.filter(r => r.matched).length
  const withStepLink = rows.filter(r => r.stepLinkPoints > 0).length
  const withStoryMention = rows.filter(r => r.storyMentionPoints > 0).length
  console.log('\nSignal coverage:')
  console.table([
    { signal: 'matched to raw-repo-metadata.json', count: matchedCount, total: n, pct: `${pct(matchedCount)}%` },
    { signal: 'has a linked admin Step (stepLinkPoints > 0)', count: withStepLink, total: n, pct: `${pct(withStepLink)}%` },
    { signal: 'mentioned in >=1 story (storyMentionPoints > 0)', count: withStoryMention, total: n, pct: `${pct(withStoryMention)}%` },
  ])

  const combinedValues = rows.map(r => r.combined)
  const repoTotalValues = rows.map(r => r.repoTotal)
  const moodCounts = { 'YAH.': 0, 'MEH.': 0, 'NAH.': 0 }
  const priorityCounts = { 'YAH.': 0, 'MEH.': 0, 'NAH.': 0 }
  for (const r of rows) {
    moodCounts[classifyByPercentile(combinedValues, r.combined)]++
    priorityCounts[classifyByPercentile(repoTotalValues, r.repoTotal)]++
  }
  console.log('\nPercentile classification splits (same tercile logic as /api/unppp/priority-score):')
  console.table({
    'MOOD (by combined)': { ...moodCounts, 'YAH.%': `${pct(moodCounts['YAH.'])}%`, 'MEH.%': `${pct(moodCounts['MEH.'])}%`, 'NAH.%': `${pct(moodCounts['NAH.'])}%` },
    'PRIORITY (by repoTotal)': { ...priorityCounts, 'YAH.%': `${pct(priorityCounts['YAH.'])}%`, 'MEH.%': `${pct(priorityCounts['MEH.'])}%`, 'NAH.%': `${pct(priorityCounts['NAH.'])}%` },
  })
}

async function main() {
  const { sort, limit, json, stats } = parseArgs()

  const repoMetadataPath = join(process.cwd(), 'public/raw-repo-metadata.json')
  const unpppConfigPath = join(process.cwd(), 'src/data/UnpppsConfig.json')
  const storyMappingsPath = join(process.cwd(), 'public/data/story-repo-mappings.json')

  const repoMetadata: Record<string, unknown>[] = JSON.parse(readFileSync(repoMetadataPath, 'utf-8'))
  const unpppConfig: { unppps: UnpppConfigEntry[] } = JSON.parse(readFileSync(unpppConfigPath, 'utf-8'))
  const storyMappings: { mappings: Record<string, { mentionedRepositories: string[] }> } = JSON.parse(readFileSync(storyMappingsPath, 'utf-8'))

  const linkedSteps = await prisma.step.findMany({
    where: { unpppId: { not: null } },
    select: { unpppId: true },
    distinct: ['unpppId'],
  })
  const linkedUnpppIds = new Set(linkedSteps.map(s => s.unpppId as string))
  const storyMentionCounts = buildStoryMentionCounts(storyMappings.mappings)

  // Prefer the authoritative unppp_id written by repo-metadata-analyzer
  // (resolved server-side from UnpppsConfig's `gh` field, so it's correct
  // even when the GitHub repo name diverges from the unppp id — e.g.
  // theunpartycharette's repo is actually named "uncolor-ios"). Fall back
  // to matching by repo name for data from before that field existed.
  const repoByUnpppId = new Map(
    repoMetadata
      .filter((r): r is typeof r & { unppp_id: string } => typeof r.unppp_id === 'string' && !!r.unppp_id)
      .map(r => [r.unppp_id, r])
  )
  const repoByName = new Map(repoMetadata.map(r => [r.name as string, r]))

  const rows = unpppConfig.unppps.map(entry => {
    const unpppScore = calculatePriorityCount(entry)
    const repoRow = repoByUnpppId.get(entry.id) ?? repoByName.get(entry.repoName || entry.id)
    const repoScore = calculateRepoPriorityCount(repoRow)
    const stepLinkPoints = getStepLinkPoints(entry.id, linkedUnpppIds)
    const storyMentionPoints = getStoryMentionPoints(entry.id, storyMentionCounts)

    return {
      id: entry.id,
      matched: !!repoRow,
      unpppTotal: unpppScore.total,
      url: unpppScore.urlPoints,
      core: unpppScore.corePoints,
      product: unpppScore.productPoints,
      keys: `${unpppScore.completedKeys}/${unpppScore.expectedKeys}`,
      completedKeys: unpppScore.completedKeys,
      expectedKeys: unpppScore.expectedKeys,
      repoTotal: repoScore.total,
      activePeriod: repoScore.activePeriodPoints,
      timeBounded: repoScore.timeBoundedPoints,
      stepLinkPoints,
      storyMentionPoints,
      combined: unpppScore.total + repoScore.total + stepLinkPoints + storyMentionPoints,
      // Raw config fields, for the unppp-metadata census (--stats)
      category: typeof entry.category === 'string' ? entry.category : null,
      featured: !!entry.featured,
      votableFeature: !!entry.votableFeature,
      storyPublished: !!entry.storyPublished,
      debt: typeof entry.debt === 'number' ? entry.debt : 0,
      hasMedia: Array.isArray(entry.media) && entry.media.length > 0,
      hasPolarProduct: typeof entry.polarProductId === 'string' && entry.polarProductId.length > 0,
      hasExplicitRepoName: typeof entry.repoName === 'string' && entry.repoName.length > 0,
    }
  })

  rows.sort((a, b) => {
    const key = sort === 'unppp' ? 'unpppTotal' : sort === 'repo' ? 'repoTotal' : 'combined'
    return b[key] - a[key]
  })

  const limited = limit ? rows.slice(0, limit) : rows

  if (json) {
    console.log(JSON.stringify(limited, null, 2))
    return
  }

  if (stats) {
    printStats(rows)
    return
  }

  console.log(`\nPriority scores — sorted by ${sort} (${limited.length}/${rows.length} unppps, ${rows.filter(r => r.matched).length} matched to raw-repo-metadata.json)\n`)
  console.table(
    limited.map(r => ({
      id: r.id,
      'unppp total': r.unpppTotal,
      url: r.url,
      core: r.core,
      product: r.product,
      keys: r.keys,
      'repo total': r.matched ? r.repoTotal : '—',
      active: r.matched ? r.activePeriod : '—',
      bounded: r.matched ? r.timeBounded : '—',
      step: r.stepLinkPoints ? `✓ +${r.stepLinkPoints}` : '—',
      story: r.storyMentionPoints ? `+${r.storyMentionPoints}` : '—',
      combined: r.combined,
    }))
  )
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

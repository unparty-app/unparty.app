#!/usr/bin/env node

/**
 * UNPARTY Debt Score Calculator
 *
 * Calculates debt score statistics from UnpppsConfig.json
 * Usage: node scripts/debt-score.js [--json]
 *
 * Options:
 *   --json    Output results as JSON
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

const UNPPPS_CONFIG_PATH = join(rootDir, 'src', 'data', 'UnpppsConfig.json')

/**
 * Load debt values from UnpppsConfig.json
 */
function loadDebtScores() {
  const config = JSON.parse(readFileSync(UNPPPS_CONFIG_PATH, 'utf-8'))

  const entries = config.unppps
    .filter(u => u.debt !== undefined && u.debt !== null)
    .map(u => ({ id: u.id, name: u.name, debt: u.debt }))

  return entries
}

/**
 * Calculate average debt score
 */
function calculateAverage(total, count) {
  if (count === 0) return 0
  return total / count
}

/**
 * Calculate median debt score
 */
function calculateMedian(sorted) {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Calculate most common debt score (mode)
 */
function calculateMode(scores) {
  const frequency = {}
  let maxCount = 0

  for (const score of scores) {
    frequency[score] = (frequency[score] || 0) + 1
    if (frequency[score] > maxCount) {
      maxCount = frequency[score]
    }
  }

  const modes = Object.entries(frequency)
    .filter(([, count]) => count === maxCount)
    .map(([score]) => Number(score))

  return { values: modes, count: maxCount }
}

/**
 * Calculate all debt score statistics
 */
function calculateStats(entries) {
  if (entries.length === 0) return null

  const scores = entries.map(e => e.debt)
  const sorted = [...scores].sort((a, b) => a - b)

  const total = scores.reduce((sum, s) => sum + s, 0)
  const average = calculateAverage(total, scores.length)
  const median = calculateMedian(sorted)
  const mode = calculateMode(scores)
  const highest = sorted[sorted.length - 1]
  const lowest = sorted[0]

  const highestEntry = entries.find(e => e.debt === highest)
  const lowestEntry = entries.find(e => e.debt === lowest)

  return {
    count: entries.length,
    total,
    average: Math.round(average * 100) / 100,
    median,
    mode,
    highest: { score: highest, id: highestEntry?.id },
    lowest: { score: lowest, id: lowestEntry?.id }
  }
}

/**
 * Print statistics to console
 */
function printStats(stats) {
  const { count, total, average, median, mode, highest, lowest } = stats

  console.log('\n📊 DEBT SCORE STATISTICS\n')
  console.log(`   Entries Analyzed : ${count}`)
  console.log(`   Total Debt       : ${total.toLocaleString()} pts\n`)
  console.log(`   📈 AVERAGE DEBT SCORE  : ${average.toLocaleString()} pts`)
  console.log(`   🔁 MOST COMMON SCORE   : ${mode.values.join(', ')} pts (appears ${mode.count}x)`)
  console.log(`   🔝 HIGHEST DEBT SCORE  : ${highest.score.toLocaleString()} pts (${highest.id})`)
  console.log(`   🔻 LOWEST DEBT SCORE   : ${lowest.score.toLocaleString()} pts (${lowest.id})`)
  console.log(`   ⚖️  MEDIAN DEBT SCORE   : ${median.toLocaleString()} pts`)
  console.log('')
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)
  const jsonOutput = args.includes('--json')

  console.log('🎯 UNPARTY Debt Score Calculator')

  const entries = loadDebtScores()

  if (entries.length === 0) {
    console.error('❌ No debt scores found in UnpppsConfig.json')
    process.exit(1)
  }

  const stats = calculateStats(entries)

  if (jsonOutput) {
    console.log(JSON.stringify(stats, null, 2))
  } else {
    printStats(stats)
  }
}

main()

#!/usr/bin/env node

/**
 * UNPARTY Runway Features Analysis
 *
 * Analyzes theunpartyrunway-features.json to calculate:
 * - Status score statistics (high/low/average)
 * - Risk score statistics (high/low/average)
 * - Word frequency analysis for core and brand fields
 *
 * Usage: node scripts/runway-features-analysis.js [--json]
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

const FEATURES_PATH = join(rootDir, 'src', 'app', 'theunpartyrunway', 'theunpartyrunway-features.json')

// Words to exclude from word frequency analysis
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'that', 'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its', 'all', 'no'
])

// Values that indicate placeholder/incomplete data
const PLACEHOLDER_VALUES = new Set(['TBD.', 'TBD', 'tbd', 'tbd.', 'N/A', 'n/a', ''])

/**
 * Load features from theunpartyrunway-features.json
 */
function loadFeatures() {
  const data = JSON.parse(readFileSync(FEATURES_PATH, 'utf-8'))
  return data.theunpartyrunway || []
}

/**
 * Calculate numeric statistics
 */
function calculateNumericStats(features, field) {
  const values = features
    .map(f => parseInt(f[field], 10))
    .filter(v => !isNaN(v))

  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((acc, v) => acc + v, 0)
  const average = sum / values.length

  const highest = sorted[sorted.length - 1]
  const lowest = sorted[0]

  const highestEntry = features.find(f => parseInt(f[field], 10) === highest)
  const lowestEntry = features.find(f => parseInt(f[field], 10) === lowest)

  // Calculate median
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2

  return {
    count: values.length,
    sum,
    average: Math.round(average * 100) / 100,
    median,
    highest: { value: highest, name: highestEntry?.name },
    lowest: { value: lowest, name: lowestEntry?.name }
  }
}

/**
 * Extract words from text, filtering out stop words and short words
 */
function extractWords(text) {
  if (!text || PLACEHOLDER_VALUES.has(text)) return []

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // Replace non-alphanumeric with spaces
    .split(/\s+/)                   // Split on whitespace
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
}

/**
 * Calculate word frequency from a field
 */
function calculateWordFrequency(features, field) {
  const wordCounts = {}

  for (const feature of features) {
    const words = extractWords(feature[field])
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    }
  }

  const sorted = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])

  const totalWords = sorted.reduce((acc, [, count]) => acc + count, 0)
  const uniqueWords = sorted.length

  // Get most used words (top 10)
  const mostUsed = sorted.slice(0, 10).map(([word, count]) => ({ word, count }))

  // Get words with minimum frequency (truly least used)
  const minCount = sorted.length > 0 ? sorted[sorted.length - 1][1] : 0
  const allLeastUsed = sorted.filter(([, count]) => count === minCount)
  
  // Return up to 10 examples of least used words (all have the same minimum count)
  const leastUsed = allLeastUsed.slice(0, 10).map(([word, count]) => ({ word, count }))
  const leastUsedTotalCount = allLeastUsed.length

  return {
    totalWords,
    uniqueWords,
    mostUsed,
    leastUsed,
    leastUsedTotalCount  // Total number of words with minimum frequency
  }
}

/**
 * Print numeric statistics to console
 */
function printNumericStats(stats, label) {
  console.log(`\n📊 ${label.toUpperCase()} SCORE STATISTICS\n`)
  console.log(`   Entries Analyzed : ${stats.count}`)
  console.log(`   Total Sum        : ${stats.sum.toLocaleString()}\n`)
  console.log(`   📈 AVERAGE SCORE  : ${stats.average.toLocaleString()}`)
  console.log(`   🔝 HIGHEST SCORE  : ${stats.highest.value.toLocaleString()} (${stats.highest.name})`)
  console.log(`   🔻 LOWEST SCORE   : ${stats.lowest.value.toLocaleString()} (${stats.lowest.name})`)
  console.log(`   ⚖️  MEDIAN SCORE   : ${stats.median.toLocaleString()}`)
}

/**
 * Print word frequency to console
 */
function printWordFrequency(wordStats, label) {
  console.log(`\n📝 ${label.toUpperCase()} WORD FREQUENCY\n`)
  console.log(`   Total Words   : ${wordStats.totalWords.toLocaleString()}`)
  console.log(`   Unique Words  : ${wordStats.uniqueWords.toLocaleString()}\n`)

  if (wordStats.mostUsed.length > 0) {
    console.log('   🔥 MOST USED WORDS:')
    for (const { word, count } of wordStats.mostUsed) {
      console.log(`      ${word.padEnd(25)} : ${count}x`)
    }
  } else {
    console.log('   🔥 MOST USED WORDS: (none)')
  }

  if (wordStats.leastUsed.length > 0) {
    const leastLabel = wordStats.leastUsedTotalCount > 10
      ? `LEAST USED WORDS (${wordStats.leastUsedTotalCount} total with count=${wordStats.leastUsed[0].count}):`
      : 'LEAST USED WORDS:'
    console.log(`\n   ❄️  ${leastLabel}`)
    for (const { word, count } of wordStats.leastUsed) {
      console.log(`      ${word.padEnd(25)} : ${count}x`)
    }
  } else {
    console.log('\n   ❄️  LEAST USED WORDS: (none)')
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)
  const jsonOutput = args.includes('--json')

  console.log('🎯 UNPARTY Runway Features Analysis')
  console.log('━'.repeat(50))

  const features = loadFeatures()

  if (features.length === 0) {
    console.error('❌ No features found in theunpartyrunway-features.json')
    process.exit(1)
  }

  console.log(`\n📁 Loaded ${features.length} features from theunpartyrunway-features.json`)

  // Calculate statistics
  const statusStats = calculateNumericStats(features, 'status')
  const riskStats = calculateNumericStats(features, 'risk')
  const coreWords = calculateWordFrequency(features, 'core')
  const brandWords = calculateWordFrequency(features, 'brand')

  if (jsonOutput) {
    const results = {
      featuresCount: features.length,
      status: statusStats,
      risk: riskStats,
      coreWordFrequency: coreWords,
      brandWordFrequency: brandWords
    }
    console.log(JSON.stringify(results, null, 2))
  } else {
    // Print status statistics
    if (statusStats) {
      printNumericStats(statusStats, 'STATUS')
    }

    // Print risk statistics
    if (riskStats) {
      printNumericStats(riskStats, 'RISK')
    }

    // Print core word frequency
    printWordFrequency(coreWords, 'CORE')

    // Print brand word frequency
    printWordFrequency(brandWords, 'BRAND')

    // Summary section answering the questions
    console.log('\n' + '━'.repeat(50))
    console.log('📋 ANSWERS TO QUESTIONS')
    console.log('━'.repeat(50))

    console.log('\n1. STATUS SCORE (high/low/average):')
    console.log(`   • Highest: ${statusStats.highest.value} (${statusStats.highest.name})`)
    console.log(`   • Lowest:  ${statusStats.lowest.value} (${statusStats.lowest.name})`)
    console.log(`   • Average: ${statusStats.average}`)

    console.log('\n2. MOST/LEAST USED WORDS IN CORE:')
    if (coreWords.mostUsed.length > 0) {
      console.log(`   • Most Used:  "${coreWords.mostUsed[0].word}" (${coreWords.mostUsed[0].count}x)`)
    } else {
      console.log('   • Most Used:  (no words found)')
    }
    if (coreWords.leastUsed.length > 0) {
      const coreLeastInfo = coreWords.leastUsedTotalCount > 1
        ? ` (${coreWords.leastUsedTotalCount} words with count=1)`
        : ''
      console.log(`   • Least Used: "${coreWords.leastUsed[0].word}" (${coreWords.leastUsed[0].count}x)${coreLeastInfo}`)
    } else {
      console.log('   • Least Used: (no words found)')
    }

    console.log('\n3. MOST/LEAST USED WORDS IN BRAND:')
    if (brandWords.mostUsed.length > 0) {
      console.log(`   • Most Used:  "${brandWords.mostUsed[0].word}" (${brandWords.mostUsed[0].count}x)`)
    } else {
      console.log('   • Most Used:  (no words found)')
    }
    if (brandWords.leastUsed.length > 0) {
      const brandLeastInfo = brandWords.leastUsedTotalCount > 1
        ? ` (${brandWords.leastUsedTotalCount} words with count=1)`
        : ''
      console.log(`   • Least Used: "${brandWords.leastUsed[0].word}" (${brandWords.leastUsed[0].count}x)${brandLeastInfo}`)
    } else {
      console.log('   • Least Used: (no words found)')
    }

    console.log('\n4. RISK SCORE (high/low/average):')
    console.log(`   • Highest: ${riskStats.highest.value} (${riskStats.highest.name})`)
    console.log(`   • Lowest:  ${riskStats.lowest.value} (${riskStats.lowest.name})`)
    console.log(`   • Average: ${riskStats.average}`)

    console.log('')
  }
}

main()

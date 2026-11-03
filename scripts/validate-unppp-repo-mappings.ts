#!/usr/bin/env tsx
/**
 * Validate unppp ID to repository name mappings
 *
 * Run with: npx tsx scripts/validate-unppp-repo-mappings.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface RepositoryMetadata {
  name: string
  full_name: string
  description: string | null
  [key: string]: unknown
}

interface UnppppConfigEntry {
  id: string
  name: string
  repoName?: string
  [key: string]: unknown
}

interface UnpppsConfig {
  unppps: UnppppConfigEntry[]
  [key: string]: unknown
}

function main() {
  console.log('🔍 Validating unppp → repository mappings...\n')

  // Load data
  const repoMetadataPath = join(process.cwd(), 'public/raw-repo-metadata.json')
  const unpppConfigPath = join(process.cwd(), 'src/data/UnpppsConfig.json')

  const repoMetadata: RepositoryMetadata[] = JSON.parse(readFileSync(repoMetadataPath, 'utf-8'))
  const unpppConfig: UnpppsConfig = JSON.parse(readFileSync(unpppConfigPath, 'utf-8'))

  const repoNames = new Set(repoMetadata.map(r => r.name))

  console.log(`📊 Found ${unpppConfig.unppps.length} unppps and ${repoMetadata.length} repositories\n`)

  // Validate mappings
  const results: {
    valid: Array<{ unpppId: string; repoName: string; hasExplicitMapping: boolean }>
    missing: Array<{ unpppId: string; expectedRepoName: string }>
    suggestions: Array<{ unpppId: string; expectedRepoName: string; similarRepos: string[] }>
  } = {
    valid: [],
    missing: [],
    suggestions: []
  }

  unpppConfig.unppps.forEach((unppp) => {
    const hasExplicitMapping = !!unppp.repoName
    const expectedRepoName = unppp.repoName || unppp.id

    if (repoNames.has(expectedRepoName)) {
      results.valid.push({
        unpppId: unppp.id,
        repoName: expectedRepoName,
        hasExplicitMapping
      })
    } else {
      results.missing.push({
        unpppId: unppp.id,
        expectedRepoName
      })

      // Find similar repo names (simple substring matching)
      const similar = Array.from(repoNames).filter(name =>
        name.includes(unppp.id) || unppp.id.includes(name)
      )

      if (similar.length > 0) {
        results.suggestions.push({
          unpppId: unppp.id,
          expectedRepoName,
          similarRepos: similar
        })
      }
    }
  })

  // Print results
  console.log('✅ Valid mappings:')
  results.valid.forEach(({ unpppId, repoName, hasExplicitMapping }) => {
    const badge = hasExplicitMapping ? '🔗' : '🔄'
    console.log(`  ${badge} ${unpppId} → ${repoName}`)
  })

  if (results.missing.length > 0) {
    console.log('\n❌ Missing repositories:')
    results.missing.forEach(({ unpppId, expectedRepoName }) => {
      console.log(`  ⚠️  ${unpppId} → ${expectedRepoName} (not found)`)
    })
  }

  if (results.suggestions.length > 0) {
    console.log('\n💡 Suggestions for missing repos:')
    results.suggestions.forEach(({ unpppId, expectedRepoName, similarRepos }) => {
      console.log(`  ${unpppId} (expected: ${expectedRepoName})`)
      console.log(`    Similar repos found: ${similarRepos.join(', ')}`)
    })
  }

  // Summary
  console.log('\n📈 Summary:')
  console.log(`  ✅ Valid: ${results.valid.length}`)
  console.log(`  ❌ Missing: ${results.missing.length}`)
  console.log(`  🔗 Explicit mappings: ${results.valid.filter(v => v.hasExplicitMapping).length}`)
  console.log(`  🔄 Semantic mappings: ${results.valid.filter(v => !v.hasExplicitMapping).length}`)

  // Exit with error if missing mappings
  if (results.missing.length > 0) {
    console.log('\n⚠️  Some unppp IDs do not have corresponding repositories.')
    console.log('   Add explicit "repoName" field to UnpppsConfig.json if needed.')
    process.exit(1)
  }

  console.log('\n✨ All unppp IDs have valid repository mappings!')
}

main()

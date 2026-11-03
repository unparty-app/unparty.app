/**
 * Utility for mapping unppp IDs to repository names from raw-repo-metadata.json
 */

import UnpppsConfig from '@/data/UnpppsConfig.json'
import type { RepositoryMetadata } from '@/types/repository-metadata'

interface UnppppConfigEntry {
  id: string
  name: string
  repoName?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * Get the repository name for a given unppp ID
 *
 * Priority:
 * 1. Explicit repoName field in UnpppsConfig
 * 2. Direct match with unppp ID (semantic assumption)
 * 3. null if no match found
 */
export function getRepoNameForUnppp(unpppId: string): string | null {
  const unppp = UnpppsConfig.unppps.find(u => u.id === unpppId);

  if (!unppp) {
    return null
  }

  // Use explicit repoName if provided, otherwise use the unppp ID
  return (unppp as UnppppConfigEntry).repoName || unppp.id
}

/**
 * Get all repository names mapped to unppp IDs
 * Returns a Map<unpppId, repoName>
 */
export function getAllUnpppRepoMappings(): Map<string, string> {
  const mappings = new Map<string, string>()

  UnpppsConfig.unppps.forEach(unppp => {
    const repoName = (unppp as UnppppConfigEntry).repoName || unppp.id
    mappings.set(unppp.id, repoName)
  })

  return mappings
}

/**
 * Validate that unppp IDs have corresponding repositories in metadata
 * Returns array of unppp IDs that don't have matching repos
 */
export function validateUnpppRepoMappings(repoMetadata: RepositoryMetadata[]): {
  valid: { unpppId: string; repoName: string }[]
  missing: { unpppId: string; expectedRepoName: string }[]
} {
  const repoNames = new Set(repoMetadata.map(r => r.name))
  const valid: { unpppId: string; repoName: string }[] = []
  const missing: { unpppId: string; expectedRepoName: string }[] = []

  UnpppsConfig.unppps.forEach(unppp => {
    const repoName = (unppp as UnppppConfigEntry).repoName || unppp.id

    if (repoNames.has(repoName)) {
      valid.push({ unpppId: unppp.id, repoName })
    } else {
      missing.push({ unpppId: unppp.id, expectedRepoName: repoName })
    }
  })

  return { valid, missing }
}

/**
 * Get unppp config entry for a given repo name
 * Useful for reverse lookups
 */
export function getUnpppForRepoName(repoName: string): UnppppConfigEntry | null {
  const unppp = UnpppsConfig.unppps.find(u => {
    const mappedRepoName = (u as UnppppConfigEntry).repoName || u.id
    return mappedRepoName === repoName
  })

  return (unppp as UnppppConfigEntry) || null
}

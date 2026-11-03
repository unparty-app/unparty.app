import unpppScores from '../../../public/data/unppp-scores.json'
import type { NavCategory } from '../constants/unpppNav'

export interface UnpppRepository {
  id: string
  full_name: string
  type: NavCategory
  confidence: number
  assumption_score: number
  similarity_score: number
  standards_score: number
  monthly_standards_score: number
  mo_cc_rate: number
  mo_cc_trend: number
  mo_velocity_ratio: number
  mo_peak_day_ratio: number
  mo_n_commits: number
  commits_per_month: number
  velocity_trend: 'increasing' | 'decreasing' | 'stable'
  uses_conventional_commits: boolean
  avg_message_length: number
  detailed_messages_ratio: number
  dominant_commit_type: string
  kw_cli: number
  kw_api: number
  kw_ui: number
  kw_bot: number
  kw_agent: number
  kw_test: number
  ct_feat: number
  ct_fix: number
  ct_docs: number
  ct_chore: number
  ct_refactor: number
  ct_test: number
  last_updated: string
}

export interface UnpppTypeGroup {
  type: NavCategory
  count: number
  repositories: UnpppRepository[]
}

export interface UnpppScoresData {
  generated_at: string
  total: number
  scores: UnpppRepository[]
}

/**
 * Get all UNPPP repositories grouped by type
 * @param minConfidence - Minimum confidence score to include (default: 0, include all)
 * @returns Object mapping type to array of repositories
 */
export function getRepositoriesByType(minConfidence: number = 0): Record<NavCategory, UnpppRepository[]> {
  const data = unpppScores as UnpppScoresData
  
  const grouped: Record<NavCategory, UnpppRepository[]> = {
    app: [],
    agent: [],
    service: [],
    assistant: [],
    library: [],
    framework: [],
    tool: [],
    bot: [],
  }

  data.scores.forEach((repo) => {
    // Filter: only include repos that start with "theunparty"
    if (!repo.id.startsWith('theunparty')) {
      return
    }
    
    // Filter by confidence if specified
    if (repo.confidence >= minConfidence) {
      const type = repo.type as NavCategory
      if (grouped[type]) {
        grouped[type].push(repo)
      }
    }
  })

  return grouped
}

/**
 * Get all UNPPP repositories as type groups with metadata
 * @param minConfidence - Minimum confidence score to include (default: 0, include all)
 * @returns Array of type groups sorted by count descending
 */
export function getTypeGroups(minConfidence: number = 0): UnpppTypeGroup[] {
  const grouped = getRepositoriesByType(minConfidence)
  
  const groups: UnpppTypeGroup[] = Object.entries(grouped).map(([type, repositories]) => ({
    type: type as NavCategory,
    count: repositories.length,
    repositories: repositories.sort((a, b) => b.standards_score - a.standards_score), // Sort by quality
  }))

  // Sort by count descending
  return groups.sort((a, b) => b.count - a.count)
}

/**
 * Get a specific repository by ID
 * @param id - Repository ID
 * @returns Repository or undefined if not found (only returns repos starting with "theunparty")
 */
export function getRepositoryById(id: string): UnpppRepository | undefined {
  const data = unpppScores as UnpppScoresData
  const repo = data.scores.find((repo) => repo.id === id)
  // Only return if it starts with "theunparty"
  return repo && repo.id.startsWith('theunparty') ? repo : undefined
}

/**
 * Get all repositories of a specific type
 * @param type - Repository type
 * @param minConfidence - Minimum confidence score to include (default: 0, include all)
 * @returns Array of repositories sorted by standards_score descending
 */
export function getRepositoriesByTypeCategory(
  type: NavCategory,
  minConfidence: number = 0
): UnpppRepository[] {
  const grouped = getRepositoriesByType(minConfidence)
  return grouped[type] || []
}

/**
 * Get total count of repositories by type
 * @returns Object mapping type to count
 */
export function getTypeCounts(): Record<NavCategory, number> {
  const grouped = getRepositoriesByType()
  return Object.entries(grouped).reduce((acc, [type, repos]) => ({
    ...acc,
    [type]: repos.length,
  }), {} as Record<NavCategory, number>)
}

/**
 * Check if a repository exists in unppp-scores.json
 * @param id - Repository ID
 * @returns boolean
 */
export function repositoryExists(id: string): boolean {
  return getRepositoryById(id) !== undefined
}

/**
 * Get total number of repositories
 * @returns Total count of all repositories that start with "theunparty"
 */
export function getTotalRepositoryCount(): number {
  const data = unpppScores as UnpppScoresData
  return data.scores.filter(repo => repo.id.startsWith('theunparty')).length
}

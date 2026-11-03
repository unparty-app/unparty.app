/**
 * Utility for calculating averages from raw-repo-metadata.json
 * Focuses on time-bounded commits and other key metrics across all UNPPPs
 * 
 * @see /public/raw-repo-metadata.json - Data source
 * @see /src/types/repository-metadata.ts - Type definitions
 */

import { RepositoryMetadata } from '@/types/repository-metadata'

// ============================================================================
// AVERAGE CALCULATION INTERFACES
// ============================================================================

/**
 * Averaged time-bounded commit metrics across repositories
 */
export interface TimeBoundedCommitsAverage {
  commits_last_5_days: number
  commits_last_7_days: number
  commits_last_30_days: number
  weighted_activity_score: number
  unique_authors_5d: number
  unique_authors_7d: number
  unique_authors_30d: number
  sprint_velocity_daily: number
  sprint_velocity_weekly: number
  sprint_velocity_monthly: number
}

/**
 * Complete repository averages including basic and enhanced metrics
 */
export interface RepositoryAverages {
  /** Number of repositories included in calculation */
  repositoryCount: number
  
  /** Basic repository metrics averages */
  basic: {
    stars: number
    forks: number
    issues: number
    size_kb: number
    activity_score: number
    days_since_push: number
  }
  
  /** Enhanced metrics averages */
  enhanced: {
    languages_count: number
    contributors_count: number
    releases_count: number
    community_health_score: number
    
    /** Commit analysis averages */
    commits_analysis: {
      total_recent_commits: number
      ai_coauthor_commits: number
      claude_commits: number
      unique_authors: number
      avg_commit_message_length: number
      conventional_commits_ratio: number
      commit_velocity_per_week: number
    }
    
    /** Time-bounded commits averages (main focus) */
    time_bounded_commits: TimeBoundedCommitsAverage
  }
}

/**
 * Summary statistics for time-bounded commits specifically
 */
export interface TimeBoundedCommitsSummary {
  averages: TimeBoundedCommitsAverage
  totals: TimeBoundedCommitsAverage
  repositoryCount: number
  repositoriesWithData: string[]
  repositoriesWithoutData: string[]
}

export interface RepoEffortCluster {
  label: string
  repositories: string[]
  averageVelocity: number
  averageContributors: number
}

export interface RepositoryHistoryInsights {
  totalRepositories: number
  acceleratingRepos: string[]
  coolingRepos: string[]
  stagnantRepos: string[]
  spikingRepos: string[]
  highestActivityRepo: string | null
  lowestActivityRepo: string | null
  effortClusters: RepoEffortCluster[]
}

type ClusterAccumulator = {
  repos: string[]
  velocitySum: number
  contributorsSum: number
}

const HIGH_VELOCITY_THRESHOLD = 5
const STEADY_VELOCITY_THRESHOLD = 1
const TEAM_CONTRIBUTOR_THRESHOLD = 4
const PAIR_CONTRIBUTOR_THRESHOLD = 2
const STAGNANT_DAYS_THRESHOLD = 90
const MIN_COMMITS_FOR_TREND_DETECTION = 3
const ACCELERATION_MULTIPLIER = 1.25
const COOLING_MULTIPLIER = 0.75
const MIN_SPIKE_COMMITS_7D = 6
const SPIKE_VELOCITY_MULTIPLIER = 2

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate averages for time-bounded commits across all repositories
 * 
 * @param repositories Array of repository metadata
 * @returns Summary of time-bounded commits averages and totals
 */
export function calculateTimeBoundedCommitsAverages(
  repositories: RepositoryMetadata[]
): TimeBoundedCommitsSummary {
  const reposWithData = repositories.filter(
    repo => repo.enhanced_metrics?.time_bounded_commits
  )
  
  const reposWithoutData = repositories.filter(
    repo => !repo.enhanced_metrics?.time_bounded_commits
  )
  
  if (reposWithData.length === 0) {
    const emptyAverage: TimeBoundedCommitsAverage = {
      commits_last_5_days: 0,
      commits_last_7_days: 0,
      commits_last_30_days: 0,
      weighted_activity_score: 0,
      unique_authors_5d: 0,
      unique_authors_7d: 0,
      unique_authors_30d: 0,
      sprint_velocity_daily: 0,
      sprint_velocity_weekly: 0,
      sprint_velocity_monthly: 0,
    }
    
    return {
      averages: emptyAverage,
      totals: emptyAverage,
      repositoryCount: repositories.length,
      repositoriesWithData: [],
      repositoriesWithoutData: reposWithoutData.map(r => r.name),
    }
  }
  
  // Calculate totals
  const totals = reposWithData.reduce(
    (acc, repo) => {
      const tbc = repo.enhanced_metrics.time_bounded_commits!
      return {
        commits_last_5_days: acc.commits_last_5_days + tbc.commits_last_5_days,
        commits_last_7_days: acc.commits_last_7_days + tbc.commits_last_7_days,
        commits_last_30_days: acc.commits_last_30_days + tbc.commits_last_30_days,
        weighted_activity_score: acc.weighted_activity_score + tbc.weighted_activity_score,
        unique_authors_5d: acc.unique_authors_5d + tbc.unique_authors_5d,
        unique_authors_7d: acc.unique_authors_7d + tbc.unique_authors_7d,
        unique_authors_30d: acc.unique_authors_30d + tbc.unique_authors_30d,
        sprint_velocity_daily: acc.sprint_velocity_daily + tbc.sprint_velocity_daily,
        sprint_velocity_weekly: acc.sprint_velocity_weekly + tbc.sprint_velocity_weekly,
        sprint_velocity_monthly: acc.sprint_velocity_monthly + tbc.sprint_velocity_monthly,
      }
    },
    {
      commits_last_5_days: 0,
      commits_last_7_days: 0,
      commits_last_30_days: 0,
      weighted_activity_score: 0,
      unique_authors_5d: 0,
      unique_authors_7d: 0,
      unique_authors_30d: 0,
      sprint_velocity_daily: 0,
      sprint_velocity_weekly: 0,
      sprint_velocity_monthly: 0,
    }
  )
  
  // Calculate averages
  const count = reposWithData.length
  const averages: TimeBoundedCommitsAverage = {
    commits_last_5_days: Number((totals.commits_last_5_days / count).toFixed(2)),
    commits_last_7_days: Number((totals.commits_last_7_days / count).toFixed(2)),
    commits_last_30_days: Number((totals.commits_last_30_days / count).toFixed(2)),
    weighted_activity_score: Number((totals.weighted_activity_score / count).toFixed(2)),
    unique_authors_5d: Number((totals.unique_authors_5d / count).toFixed(2)),
    unique_authors_7d: Number((totals.unique_authors_7d / count).toFixed(2)),
    unique_authors_30d: Number((totals.unique_authors_30d / count).toFixed(2)),
    sprint_velocity_daily: Number((totals.sprint_velocity_daily / count).toFixed(2)),
    sprint_velocity_weekly: Number((totals.sprint_velocity_weekly / count).toFixed(2)),
    sprint_velocity_monthly: Number((totals.sprint_velocity_monthly / count).toFixed(2)),
  }
  
  return {
    averages,
    totals,
    repositoryCount: repositories.length,
    repositoriesWithData: reposWithData.map(r => r.name),
    repositoriesWithoutData: reposWithoutData.map(r => r.name),
  }
}

/**
 * Calculate comprehensive averages across all repository metrics
 * 
 * @param repositories Array of repository metadata
 * @returns Complete repository averages
 */
export function calculateRepositoryAverages(
  repositories: RepositoryMetadata[]
): RepositoryAverages {
  if (repositories.length === 0) {
    throw new Error('No repositories provided for average calculation')
  }
  
  const count = repositories.length
  
  // Calculate basic metrics averages
  const basicTotals = repositories.reduce(
    (acc, repo) => ({
      stars: acc.stars + repo.stars,
      forks: acc.forks + repo.forks,
      issues: acc.issues + repo.issues,
      size_kb: acc.size_kb + repo.size_kb,
      activity_score: acc.activity_score + repo.activity_score,
      days_since_push: acc.days_since_push + repo.days_since_push,
    }),
    { stars: 0, forks: 0, issues: 0, size_kb: 0, activity_score: 0, days_since_push: 0 }
  )
  
  // Calculate enhanced metrics averages
  const enhancedTotals = repositories.reduce(
    (acc, repo) => {
      const em = repo.enhanced_metrics
      return {
        languages_count: acc.languages_count + em.languages_count,
        contributors_count: acc.contributors_count + em.contributors_count,
        releases_count: acc.releases_count + em.releases_count,
        community_health_score: acc.community_health_score + em.community_health_score,
        total_recent_commits: acc.total_recent_commits + em.commits_analysis.total_recent_commits,
        ai_coauthor_commits: acc.ai_coauthor_commits + em.commits_analysis.ai_coauthor_commits,
        claude_commits: acc.claude_commits + em.commits_analysis.claude_commits,
        unique_authors: acc.unique_authors + em.commits_analysis.unique_authors,
        avg_commit_message_length: acc.avg_commit_message_length + em.commits_analysis.avg_commit_message_length,
        conventional_commits_ratio: acc.conventional_commits_ratio + em.commits_analysis.conventional_commits_ratio,
        commit_velocity_per_week: acc.commit_velocity_per_week + em.commits_analysis.commit_velocity_per_week,
      }
    },
    {
      languages_count: 0,
      contributors_count: 0,
      releases_count: 0,
      community_health_score: 0,
      total_recent_commits: 0,
      ai_coauthor_commits: 0,
      claude_commits: 0,
      unique_authors: 0,
      avg_commit_message_length: 0,
      conventional_commits_ratio: 0,
      commit_velocity_per_week: 0,
    }
  )
  
  // Get time-bounded commits summary
  const timeBoundedSummary = calculateTimeBoundedCommitsAverages(repositories)
  
  return {
    repositoryCount: count,
    basic: {
      stars: Number((basicTotals.stars / count).toFixed(2)),
      forks: Number((basicTotals.forks / count).toFixed(2)),
      issues: Number((basicTotals.issues / count).toFixed(2)),
      size_kb: Number((basicTotals.size_kb / count).toFixed(2)),
      activity_score: Number((basicTotals.activity_score / count).toFixed(2)),
      days_since_push: Number((basicTotals.days_since_push / count).toFixed(2)),
    },
    enhanced: {
      languages_count: Number((enhancedTotals.languages_count / count).toFixed(2)),
      contributors_count: Number((enhancedTotals.contributors_count / count).toFixed(2)),
      releases_count: Number((enhancedTotals.releases_count / count).toFixed(2)),
      community_health_score: Number((enhancedTotals.community_health_score / count).toFixed(2)),
      commits_analysis: {
        total_recent_commits: Number((enhancedTotals.total_recent_commits / count).toFixed(2)),
        ai_coauthor_commits: Number((enhancedTotals.ai_coauthor_commits / count).toFixed(2)),
        claude_commits: Number((enhancedTotals.claude_commits / count).toFixed(2)),
        unique_authors: Number((enhancedTotals.unique_authors / count).toFixed(2)),
        avg_commit_message_length: Number((enhancedTotals.avg_commit_message_length / count).toFixed(2)),
        conventional_commits_ratio: Number((enhancedTotals.conventional_commits_ratio / count).toFixed(2)),
        commit_velocity_per_week: Number((enhancedTotals.commit_velocity_per_week / count).toFixed(2)),
      },
      time_bounded_commits: timeBoundedSummary.averages,
    },
  }
}

/**
 * Load and parse raw repository metadata from public JSON file
 * 
 * @returns Promise resolving to array of repository metadata
 */
export async function loadRawRepositoryMetadata(): Promise<RepositoryMetadata[]> {
  try {
    const response = await fetch('/raw-repo-metadata.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch repository metadata: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data)) {
      throw new Error('Repository metadata is not an array')
    }
    
    return data as RepositoryMetadata[]
  } catch (error) {
    console.error('Error loading repository metadata:', error)
    throw error
  }
}

/**
 * Convenience function to load metadata and calculate time-bounded commits averages
 * 
 * @returns Promise resolving to time-bounded commits summary
 */
export async function getTimeBoundedCommitsBaseline(): Promise<TimeBoundedCommitsSummary> {
  const repositories = await loadRawRepositoryMetadata()
  return calculateTimeBoundedCommitsAverages(repositories)
}

/**
 * Convenience function to load metadata and calculate all repository averages
 * 
 * @returns Promise resolving to complete repository averages
 */
export async function getRepositoryAveragesBaseline(): Promise<RepositoryAverages> {
  const repositories = await loadRawRepositoryMetadata()
  return calculateRepositoryAverages(repositories)
}

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Filter repositories by UNPPP mapping
 * Only includes repositories that have corresponding UNPPP entries
 * 
 * @param repositories Array of repository metadata
 * @param unpppMapping Map of unppp IDs to repository names
 * @returns Filtered array of repositories
 */
export function filterRepositoriesByUnppp(
  repositories: RepositoryMetadata[],
  unpppMapping: Map<string, string>
): RepositoryMetadata[] {
  const unpppRepoNames = new Set(unpppMapping.values())
  return repositories.filter(repo => unpppRepoNames.has(repo.name))
}

/**
 * Get repositories that are missing time-bounded commits data
 * 
 * @param repositories Array of repository metadata
 * @returns Array of repository names missing the data
 */
export function getRepositoriesWithoutTimeBoundedCommits(
  repositories: RepositoryMetadata[]
): string[] {
  return repositories
    .filter(repo => !repo.enhanced_metrics?.time_bounded_commits)
    .map(repo => repo.name)
}

/**
 * Get detailed breakdown of repositories by their time-bounded commits status
 * 
 * @param repositories Array of repository metadata
 * @returns Object with arrays of repositories with and without data
 */
export function analyzeTimeBoundedCommitsAvailability(repositories: RepositoryMetadata[]) {
  const withData: RepositoryMetadata[] = []
  const withoutData: RepositoryMetadata[] = []
  
  repositories.forEach(repo => {
    if (repo.enhanced_metrics?.time_bounded_commits) {
      withData.push(repo)
    } else {
      withoutData.push(repo)
    }
  })
  
  return {
    withData,
    withoutData,
    withDataCount: withData.length,
    withoutDataCount: withoutData.length,
    totalCount: repositories.length,
    dataAvailabilityRatio: withData.length / repositories.length,
  }
}

/**
 * Analyze repository history patterns from raw metadata to identify
 * trends, outliers, inactivity, spikes, and effort-based clusters.
 */
export function analyzeRepositoryHistoryInsights(
  repositories: RepositoryMetadata[]
): RepositoryHistoryInsights {
  if (repositories.length === 0) {
    return {
      totalRepositories: 0,
      acceleratingRepos: [],
      coolingRepos: [],
      stagnantRepos: [],
      spikingRepos: [],
      highestActivityRepo: null,
      lowestActivityRepo: null,
      effortClusters: [],
    }
  }

  const acceleratingRepos: string[] = []
  const coolingRepos: string[] = []
  const stagnantRepos: string[] = []
  const spikingRepos: string[] = []
  const clusterMap = new Map<string, ClusterAccumulator>()

  let highestActivityRepo: string | null = null
  let lowestActivityRepo: string | null = null
  let highestActivityScore = -Infinity
  let lowestActivityScore = Infinity

  const getVelocityBand = (velocity: number) => {
    if (velocity >= HIGH_VELOCITY_THRESHOLD) return 'HIGH VELOCITY'
    if (velocity >= STEADY_VELOCITY_THRESHOLD) return 'STEADY VELOCITY'
    return 'LOW VELOCITY'
  }

  const getContributorBand = (contributors: number) => {
    if (contributors >= TEAM_CONTRIBUTOR_THRESHOLD) return 'TEAM'
    if (contributors >= PAIR_CONTRIBUTOR_THRESHOLD) return 'PAIR'
    return 'SOLO'
  }

  repositories.forEach(repo => {
    const activityScore = repo.activity_score || 0
    if (activityScore > highestActivityScore) {
      highestActivityScore = activityScore
      highestActivityRepo = repo.name
    }
    if (activityScore < lowestActivityScore) {
      lowestActivityScore = activityScore
      lowestActivityRepo = repo.name
    }

    const commitsAnalysis = repo.enhanced_metrics?.commits_analysis
    const timeBounded = repo.enhanced_metrics?.time_bounded_commits
    const velocity = commitsAnalysis?.commit_velocity_per_week || 0
    const contributors = repo.enhanced_metrics?.contributors_count || 0

    if (repo.days_since_push >= STAGNANT_DAYS_THRESHOLD || (timeBounded?.commits_last_30_days ?? 0) === 0) {
      stagnantRepos.push(repo.name)
    }

    if (timeBounded) {
      const projectedFrom5Days = (timeBounded.commits_last_5_days * 7) / 5
      const baseline7Days = Math.max(timeBounded.commits_last_7_days, 1)

      if (
        timeBounded.commits_last_5_days >= MIN_COMMITS_FOR_TREND_DETECTION
        && projectedFrom5Days >= baseline7Days * ACCELERATION_MULTIPLIER
      ) {
        acceleratingRepos.push(repo.name)
      } else if (
        timeBounded.commits_last_7_days >= MIN_COMMITS_FOR_TREND_DETECTION
        && projectedFrom5Days <= baseline7Days * COOLING_MULTIPLIER
      ) {
        coolingRepos.push(repo.name)
      }

      if (timeBounded.commits_last_7_days >= Math.max(MIN_SPIKE_COMMITS_7D, velocity * SPIKE_VELOCITY_MULTIPLIER)) {
        spikingRepos.push(repo.name)
      }
    }

    const clusterLabel = `${getVelocityBand(velocity)} • ${getContributorBand(contributors)}`
    const existingCluster = clusterMap.get(clusterLabel)
    if (existingCluster) {
      existingCluster.repos.push(repo.name)
      existingCluster.velocitySum += velocity
      existingCluster.contributorsSum += contributors
    } else {
      clusterMap.set(clusterLabel, {
        repos: [repo.name],
        velocitySum: velocity,
        contributorsSum: contributors,
      })
    }
  })

  const effortClusters = Array.from(clusterMap.entries())
    .map(([label, cluster]) => ({
      label,
      repositories: cluster.repos.sort(),
      averageVelocity: Math.round((cluster.velocitySum / cluster.repos.length) * 100) / 100,
      averageContributors: Math.round((cluster.contributorsSum / cluster.repos.length) * 100) / 100,
    }))
    .sort((a, b) => b.repositories.length - a.repositories.length)
    .slice(0, 3)

  return {
    totalRepositories: repositories.length,
    acceleratingRepos: acceleratingRepos.sort(),
    coolingRepos: coolingRepos.sort(),
    stagnantRepos: stagnantRepos.sort(),
    spikingRepos: spikingRepos.sort(),
    highestActivityRepo,
    lowestActivityRepo,
    effortClusters,
  }
}

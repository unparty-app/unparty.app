/**
 * Language Calculation Utilities
 * 
 * Centralized formulas and utilities for processing repository language data.
 * All calculations follow these principles:
 * - Immutable data transformations
 * - Type-safe with zero `any` types
 * - Pure functions (no side effects)
 * - Well-documented with JSDoc
 * 
 * @see src/types/repository-metadata.ts - Type definitions
 * @see https://github.com/unparty-app/theunpartyapp/issues/310 - Implementation plan
 */

import type { 
  RepositoryMetadata, 
  LanguageData, 
  LanguagesDetail,
  AggregatedLanguageStats,
  AggregatedRepositoryStats
} from '@/types/repository-metadata';

// ============================================================================
// CONFIGURATION: Key formulas and constants
// ============================================================================

/**
 * GitHub official language colors
 * @see https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
 */
export const LANGUAGE_COLOR_MAP: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  'C++': '#f34b7d',
  'C#': '#178600',
  C: '#555555',
  CSS: '#563d7c',
  HTML: '#e34c26',
  JSON: '#292929',
  Markdown: '#083fa1',
  MDX: '#fcb32c',
  Shell: '#89e051',
  Bash: '#89e051',
  Makefile: '#427819',
  Mermaid: '#ff3670',
  YAML: '#cb171e',
  TOML: '#9c4221',
  Dockerfile: '#384d54',
};

/**
 * Markup and configuration languages to optionally filter out
 * These are typically not "programming" languages in the traditional sense
 */
export const MARKUP_LANGUAGES = [
  'HTML',
  'CSS',
  'JSON',
  'Markdown',
  'MDX',
  'YAML',
  'TOML',
  'XML',
];

/**
 * Default color for unknown languages
 */
const DEFAULT_COLOR = '#858585';

/**
 * Bytes per kilobyte constant
 */
const BYTES_PER_KB = 1024;

// ============================================================================
// CORE CALCULATIONS
// ============================================================================

/**
 * Calculate percentage with specified precision
 * 
 * @param value - Numerator value
 * @param total - Denominator value
 * @param precision - Decimal places (default: 0 for whole numbers)
 * @returns Percentage rounded to specified precision
 * 
 * @example
 * calculatePercentage(25, 100) // Returns: 25
 * calculatePercentage(1, 3, 2) // Returns: 33.33
 * calculatePercentage(0, 0) // Returns: 0 (safe division)
 */
export function calculatePercentage(
  value: number,
  total: number,
  precision: number = 0
): number {
  if (total === 0) return 0;
  
  const multiplier = Math.pow(10, precision);
  return Math.round((value / total) * 100 * multiplier) / multiplier;
}

/**
 * Convert language detail object to array with percentages and colors
 * 
 * @param languagesDetail - Language name to byte count mapping
 * @returns Array of language data sorted by bytes (descending)
 * 
 * @example
 * processLanguages({ Python: 1000, JavaScript: 500 })
 * // Returns: [
 * //   { name: 'Python', bytes: 1000, percentage: 67, color: '#3572A5' },
 * //   { name: 'JavaScript', bytes: 500, percentage: 33, color: '#f1e05a' }
 * // ]
 */
export function processLanguages(languagesDetail: LanguagesDetail): LanguageData[] {
  const totalBytes = Object.values(languagesDetail).reduce((sum, bytes) => sum + bytes, 0);
  
  return Object.entries(languagesDetail)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: calculatePercentage(bytes, totalBytes),
      color: LANGUAGE_COLOR_MAP[name] || DEFAULT_COLOR,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

/**
 * Aggregate languages across multiple repositories
 * 
 * @param repos - Array of repository metadata
 * @returns Aggregated language byte counts and total
 * 
 * @example
 * aggregateLanguages([repo1, repo2])
 * // Returns: {
 * //   languages: { Python: 5000, JavaScript: 3000 },
 * //   totalBytes: 8000
 * // }
 */
export function aggregateLanguages(repos: RepositoryMetadata[]): {
  languages: Record<string, number>;
  totalBytes: number;
} {
  const aggregated: Record<string, number> = {};
  let totalBytes = 0;

  repos.forEach(repo => {
    if (repo.enhanced_metrics?.languages_detail) {
      Object.entries(repo.enhanced_metrics.languages_detail).forEach(([lang, bytes]) => {
        aggregated[lang] = (aggregated[lang] || 0) + bytes;
        totalBytes += bytes;
      });
    }
  });

  return { languages: aggregated, totalBytes };
}

/**
 * Filter out markup/config languages if requested
 * Recalculates percentages after filtering to maintain 100% total
 * 
 * @param languages - Array of language data
 * @param includeMarkup - Whether to include markup languages
 * @returns Filtered and recalculated language array
 * 
 * @example
 * const data = [
 *   { name: 'Python', bytes: 1000, percentage: 50, color: '#3572A5' },
 *   { name: 'HTML', bytes: 1000, percentage: 50, color: '#e34c26' }
 * ];
 * filterLanguages(data, false)
 * // Returns: [{ name: 'Python', bytes: 1000, percentage: 100, color: '#3572A5' }]
 */
export function filterLanguages(
  languages: LanguageData[],
  includeMarkup: boolean = true
): LanguageData[] {
  if (includeMarkup) return languages;

  const filtered = languages.filter(lang => !MARKUP_LANGUAGES.includes(lang.name));
  const totalBytes = filtered.reduce((sum, lang) => sum + lang.bytes, 0);

  // Recalculate percentages after filtering
  return filtered.map(lang => ({
    ...lang,
    percentage: calculatePercentage(lang.bytes, totalBytes),
  }));
}

/**
 * Format bytes into human-readable format
 * 
 * @param bytes - Number of bytes
 * @param precision - Decimal places (default: 2)
 * @returns Formatted string (e.g., "1.23 MB")
 * 
 * @example
 * formatBytes(1536) // Returns: "1.50 KB"
 * formatBytes(1048576) // Returns: "1.00 MB"
 * formatBytes(0) // Returns: "0 Bytes"
 */
export function formatBytes(bytes: number, precision: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = BYTES_PER_KB;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(precision)} ${sizes[i]}`;
}

/**
 * Get top N languages by byte count
 * 
 * @param languages - Array of language data (should be pre-sorted)
 * @param count - Number of top languages to return
 * @returns Array of top language names
 * 
 * @example
 * getTopLanguages(languageData, 3)
 * // Returns: ['TypeScript', 'JavaScript', 'Python']
 */
export function getTopLanguages(languages: LanguageData[], count: number = 5): string[] {
  return languages
    .slice(0, count)
    .map(lang => lang.name);
}

/**
 * Calculate language diversity score using Shannon entropy
 * Higher score indicates more diverse language usage
 * Score ranges from 0 (single language) to 1 (perfectly distributed)
 * 
 * @param languages - Array of language data with percentages
 * @returns Diversity score (0-1)
 * 
 * @example
 * // Single language
 * calculateLanguageDiversity([{ name: 'Python', bytes: 1000, percentage: 100, color: '#3572A5' }])
 * // Returns: 0
 * 
 * // Two equal languages
 * calculateLanguageDiversity([
 *   { name: 'Python', bytes: 500, percentage: 50, color: '#3572A5' },
 *   { name: 'JavaScript', bytes: 500, percentage: 50, color: '#f1e05a' }
 * ])
 * // Returns: 1 (max diversity for 2 languages)
 */
export function calculateLanguageDiversity(languages: LanguageData[]): number {
  if (languages.length <= 1) return 0;

  const entropy = languages.reduce((sum, lang) => {
    const p = lang.percentage / 100;
    return sum - (p > 0 ? p * Math.log2(p) : 0);
  }, 0);

  // Normalize by max possible entropy for this number of languages
  const maxEntropy = Math.log2(languages.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * Get complete aggregated statistics for visualization
 * 
 * @param repos - Array of repository metadata
 * @param includeMarkup - Whether to include markup languages
 * @returns Complete aggregated statistics object
 * 
 * @example
 * getAggregatedStats(repositories, false)
 * // Returns: {
 * //   languages: [...],
 * //   totalBytes: 30218368,
 * //   totalRepositories: 37,
 * //   languageCount: 12,
 * //   topLanguages: ['TypeScript', 'JavaScript', 'Python', ...]
 * // }
 */
export function getAggregatedStats(
  repos: RepositoryMetadata[],
  includeMarkup: boolean = true
): AggregatedLanguageStats {
  const { languages: aggregated } = aggregateLanguages(repos);
  const processedLanguages = processLanguages(aggregated);
  const filteredLanguages = filterLanguages(processedLanguages, includeMarkup);
  
  return {
    languages: filteredLanguages,
    totalBytes: filteredLanguages.reduce((sum, lang) => sum + lang.bytes, 0),
    totalRepositories: repos.length,
    languageCount: filteredLanguages.length,
    topLanguages: getTopLanguages(filteredLanguages, 5),
  };
}

// ============================================================================
// REPOSITORY FILTERING UTILITIES
// ============================================================================

/**
 * Filter out archived repositories
 * 
 * @param repos - Array of repository metadata
 * @returns Array of non-archived repositories
 */
export function filterActiveRepos(repos: RepositoryMetadata[]): RepositoryMetadata[] {
  return repos.filter(repo => !repo.archived);
}

/**
 * Filter repositories by minimum activity score
 * 
 * @param repos - Array of repository metadata
 * @param minScore - Minimum activity score (default: 1)
 * @returns Array of repositories meeting score threshold
 */
export function filterByActivityScore(
  repos: RepositoryMetadata[],
  minScore: number = 1
): RepositoryMetadata[] {
  return repos.filter(repo => repo.activity_score >= minScore);
}

/**
 * Filter repositories by recency (days since last push)
 * 
 * @param repos - Array of repository metadata
 * @param maxDays - Maximum days since push (default: 90)
 * @returns Array of recently active repositories
 */
export function filterRecentlyActive(
  repos: RepositoryMetadata[],
  maxDays: number = 90
): RepositoryMetadata[] {
  return repos.filter(repo => repo.days_since_push <= maxDays);
}

/**
 * Filter repositories by primary language
 * 
 * @param repos - Array of repository metadata
 * @param language - Language name to filter by
 * @returns Array of repositories using specified language
 */
export function filterByLanguage(
  repos: RepositoryMetadata[],
  language: string
): RepositoryMetadata[] {
  return repos.filter(repo => repo.language === language);
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sort languages by specified metric
 * 
 * @param languages - Array of language data
 * @param metric - Metric to sort by ('bytes', 'percentage', 'name')
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array copy
 */
export function sortLanguages(
  languages: LanguageData[],
  metric: 'bytes' | 'percentage' | 'name' = 'bytes',
  order: 'asc' | 'desc' = 'desc'
): LanguageData[] {
  const sorted = [...languages];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    if (metric === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = a[metric] - b[metric];
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

/**
 * Validate language detail object has positive byte counts
 * 
 * @param languagesDetail - Language detail to validate
 * @returns True if all byte counts are positive numbers
 */
export function isValidLanguageDetail(languagesDetail: LanguagesDetail): boolean {
  return Object.values(languagesDetail).every(
    bytes => typeof bytes === 'number' && bytes > 0 && isFinite(bytes)
  );
}

/**
 * Get language statistics summary
 * 
 * @param languages - Array of language data
 * @returns Statistics object with min, max, median, and mean
 */
export function getLanguageStats(languages: LanguageData[]): {
  min: number;
  max: number;
  median: number;
  mean: number;
} {
  if (languages.length === 0) {
    return { min: 0, max: 0, median: 0, mean: 0 };
  }
  
  const bytes = languages.map(l => l.bytes).sort((a, b) => a - b);
  const sum = bytes.reduce((a, b) => a + b, 0);
  
  return {
    min: bytes[0],
    max: bytes[bytes.length - 1],
    median: bytes[Math.floor(bytes.length / 2)],
    mean: sum / bytes.length,
  };
}

// ============================================================================
// AGGREGATED REPOSITORY STATISTICS
// ============================================================================

/**
 * Calculate aggregated statistics across all repositories
 * Includes metrics for commits, contributors, releases, AI-assisted work, etc.
 * 
 * @param repos - Array of repository metadata
 * @returns Comprehensive aggregated repository statistics
 * 
 * @example
 * const stats = getAggregatedRepoStats(repositories);
 * console.log(stats.totalContributors, stats.totalAICommits);
 */
export function getAggregatedRepoStats(repos: RepositoryMetadata[]): AggregatedRepositoryStats {
  if (repos.length === 0) {
    return {
      totalRepositories: 0,
      totalStars: 0,
      totalForks: 0,
      totalIssues: 0,
      totalContributors: 0,
      totalReleases: 0,
      totalAICommits: 0,
      totalClaudeCommits: 0,
      totalRecentCommits: 0,
      averageActivityScore: 0,
      averageCommitVelocity: 0,
      averageCommunityHealth: 0,
      archivedCount: 0,
      forkCount: 0,
      activeThisWeek: 0,
      activeThisMonth: 0,
      mostActiveRepo: '',
      mostContributorsRepo: '',
      mostReleasesRepo: '',
    };
  }

  let totalStars = 0;
  let totalForks = 0;
  let totalIssues = 0;
  let totalContributors = 0;
  let totalReleases = 0;
  let totalAICommits = 0;
  let totalClaudeCommits = 0;
  let totalRecentCommits = 0;
  let totalActivityScore = 0;
  let totalCommitVelocity = 0;
  let totalCommunityHealth = 0;
  let archivedCount = 0;
  let forkCount = 0;
  let activeThisWeek = 0;
  let activeThisMonth = 0;

  let mostActiveScore = 0;
  let mostActiveRepo = '';
  let mostContributors = 0;
  let mostContributorsRepo = '';
  let mostReleases = 0;
  let mostReleasesRepo = '';

  repos.forEach(repo => {
    totalStars += repo.stars;
    totalForks += repo.forks;
    totalIssues += repo.issues;
    totalActivityScore += repo.activity_score;

    if (repo.archived) archivedCount++;
    if (repo.is_fork) forkCount++;
    if (repo.days_since_push <= 7) activeThisWeek++;
    if (repo.days_since_push <= 30) activeThisMonth++;

    // Track most active repo
    if (repo.activity_score > mostActiveScore) {
      mostActiveScore = repo.activity_score;
      mostActiveRepo = repo.name;
    }

    // Enhanced metrics
    if (repo.enhanced_metrics) {
      totalContributors += repo.enhanced_metrics.contributors_count;
      totalReleases += repo.enhanced_metrics.releases_count;
      totalCommunityHealth += repo.enhanced_metrics.community_health_score;

      // Track repo with most contributors
      if (repo.enhanced_metrics.contributors_count > mostContributors) {
        mostContributors = repo.enhanced_metrics.contributors_count;
        mostContributorsRepo = repo.name;
      }

      // Track repo with most releases
      if (repo.enhanced_metrics.releases_count > mostReleases) {
        mostReleases = repo.enhanced_metrics.releases_count;
        mostReleasesRepo = repo.name;
      }

      // Commit analysis
      if (repo.enhanced_metrics.commits_analysis) {
        totalRecentCommits += repo.enhanced_metrics.commits_analysis.total_recent_commits;
        totalAICommits += repo.enhanced_metrics.commits_analysis.ai_coauthor_commits;
        totalClaudeCommits += repo.enhanced_metrics.commits_analysis.claude_commits;
        totalCommitVelocity += repo.enhanced_metrics.commits_analysis.commit_velocity_per_week;
      }
    }
  });

  return {
    totalRepositories: repos.length,
    totalStars,
    totalForks,
    totalIssues,
    totalContributors,
    totalReleases,
    totalAICommits,
    totalClaudeCommits,
    totalRecentCommits,
    averageActivityScore: Math.round((totalActivityScore / repos.length) * 100) / 100,
    averageCommitVelocity: Math.round((totalCommitVelocity / repos.length) * 100) / 100,
    averageCommunityHealth: Math.round((totalCommunityHealth / repos.length) * 100) / 100,
    archivedCount,
    forkCount,
    activeThisWeek,
    activeThisMonth,
    mostActiveRepo,
    mostContributorsRepo,
    mostReleasesRepo,
  };
}

/**
 * Get commit analysis statistics across all repositories
 * 
 * @param repos - Array of repository metadata
 * @returns Aggregated commit analysis statistics
 */
export function getCommitAnalysisStats(repos: RepositoryMetadata[]): {
  totalCommits: number;
  aiCommits: number;
  claudeCommits: number;
  aiCommitRatio: number;
  claudeCommitRatio: number;
  averageMessageLength: number;
  conventionalCommitsRatio: number;
  averageVelocity: number;
} {
  let totalCommits = 0;
  let aiCommits = 0;
  let claudeCommits = 0;
  let totalMessageLength = 0;
  let totalConventionalRatio = 0;
  let totalVelocity = 0;
  let reposWithAnalysis = 0;

  repos.forEach(repo => {
    if (repo.enhanced_metrics?.commits_analysis) {
      const analysis = repo.enhanced_metrics.commits_analysis;
      totalCommits += analysis.total_recent_commits;
      aiCommits += analysis.ai_coauthor_commits;
      claudeCommits += analysis.claude_commits;
      totalMessageLength += analysis.avg_commit_message_length;
      totalConventionalRatio += analysis.conventional_commits_ratio;
      totalVelocity += analysis.commit_velocity_per_week;
      reposWithAnalysis++;
    }
  });

  return {
    totalCommits,
    aiCommits,
    claudeCommits,
    aiCommitRatio: totalCommits > 0 ? Math.round((aiCommits / totalCommits) * 10000) / 100 : 0,
    claudeCommitRatio: totalCommits > 0 ? Math.round((claudeCommits / totalCommits) * 10000) / 100 : 0,
    averageMessageLength: reposWithAnalysis > 0 
      ? Math.round(totalMessageLength / reposWithAnalysis * 100) / 100 
      : 0,
    conventionalCommitsRatio: reposWithAnalysis > 0 
      ? Math.round(totalConventionalRatio / reposWithAnalysis * 100) / 100 
      : 0,
    averageVelocity: reposWithAnalysis > 0 
      ? Math.round(totalVelocity / reposWithAnalysis * 100) / 100 
      : 0,
  };
}

/**
 * Get activity period statistics across all repositories
 * 
 * @param repos - Array of repository metadata
 * @returns Aggregated activity period statistics
 */
export function getActivityPeriodStats(repos: RepositoryMetadata[]): {
  totalWeeksWithCommits: number;
  maxCommitsInWeek: number;
  totalBurstWeeks: number;
  averageActiveVelocity: number;
  mostBurstyRepo: string;
} {
  let totalWeeksWithCommits = 0;
  let maxCommitsInWeek = 0;
  let totalBurstWeeks = 0;
  let totalActiveVelocity = 0;
  let reposWithMetrics = 0;
  let mostBurstWeeks = 0;
  let mostBurstyRepo = '';

  repos.forEach(repo => {
    if (repo.enhanced_metrics?.active_period_metrics) {
      const metrics = repo.enhanced_metrics.active_period_metrics;
      totalWeeksWithCommits += metrics.weeks_with_commits;
      totalBurstWeeks += metrics.burst_weeks_count;
      totalActiveVelocity += metrics.active_velocity;
      reposWithMetrics++;

      if (metrics.max_commits_in_week > maxCommitsInWeek) {
        maxCommitsInWeek = metrics.max_commits_in_week;
      }

      if (metrics.burst_weeks_count > mostBurstWeeks) {
        mostBurstWeeks = metrics.burst_weeks_count;
        mostBurstyRepo = repo.name;
      }
    }
  });

  return {
    totalWeeksWithCommits,
    maxCommitsInWeek,
    totalBurstWeeks,
    averageActiveVelocity: reposWithMetrics > 0 
      ? Math.round(totalActiveVelocity / reposWithMetrics * 100) / 100 
      : 0,
    mostBurstyRepo,
  };
}

/**
 * Calculate repository health score based on multiple factors
 * 
 * @param repo - Repository metadata
 * @returns Health score between 0-100
 */
export function calculateRepoHealthScore(repo: RepositoryMetadata): number {
  let score = 0;
  const weights = {
    activityScore: 20,
    communityHealth: 25,
    commitVelocity: 15,
    contributors: 15,
    releases: 10,
    recency: 15,
  };

  // Activity score (normalized to 0-20)
  score += Math.min(repo.activity_score, 20) * (weights.activityScore / 20);

  // Community health
  if (repo.enhanced_metrics) {
    score += (repo.enhanced_metrics.community_health_score / 100) * weights.communityHealth;
    
    // Contributors (cap at 10)
    const contributorScore = Math.min(repo.enhanced_metrics.contributors_count, 10) / 10;
    score += contributorScore * weights.contributors;
    
    // Releases (cap at 20)
    const releaseScore = Math.min(repo.enhanced_metrics.releases_count, 20) / 20;
    score += releaseScore * weights.releases;
    
    // Commit velocity
    if (repo.enhanced_metrics.commits_analysis) {
      const velocityScore = Math.min(repo.enhanced_metrics.commits_analysis.commit_velocity_per_week, 10) / 10;
      score += velocityScore * weights.commitVelocity;
    }
  }

  // Recency (0 days = full score, 90+ days = 0)
  const recencyScore = Math.max(0, 1 - repo.days_since_push / 90);
  score += recencyScore * weights.recency;

  return Math.round(score);
}

/**
 * Group repositories by primary language
 * 
 * @param repos - Array of repository metadata
 * @returns Map of language to repository array
 */
export function groupByPrimaryLanguage(repos: RepositoryMetadata[]): Map<string, RepositoryMetadata[]> {
  const grouped = new Map<string, RepositoryMetadata[]>();
  
  repos.forEach(repo => {
    const lang = repo.language || 'Unknown';
    const existing = grouped.get(lang);
    if (existing) {
      existing.push(repo);
    } else {
      grouped.set(lang, [repo]);
    }
  });
  
  return grouped;
}

/**
 * Get repositories sorted by a specific metric
 * 
 * @param repos - Array of repository metadata
 * @param metric - Metric to sort by
 * @param order - Sort order (asc or desc)
 * @returns Sorted array copy
 */
export function sortReposByMetric(
  repos: RepositoryMetadata[],
  metric: 'stars' | 'forks' | 'issues' | 'activity_score' | 'contributors' | 'releases' | 'days_since_push',
  order: 'asc' | 'desc' = 'desc'
): RepositoryMetadata[] {
  const sorted = [...repos];
  
  sorted.sort((a, b) => {
    let aValue: number;
    let bValue: number;
    
    switch (metric) {
      case 'contributors':
        aValue = a.enhanced_metrics?.contributors_count || 0;
        bValue = b.enhanced_metrics?.contributors_count || 0;
        break;
      case 'releases':
        aValue = a.enhanced_metrics?.releases_count || 0;
        bValue = b.enhanced_metrics?.releases_count || 0;
        break;
      default:
        aValue = a[metric];
        bValue = b[metric];
    }
    
    return order === 'desc' ? bValue - aValue : aValue - bValue;
  });
  
  return sorted;
}

/**
 * Calculate AI adoption metrics across repositories
 * 
 * @param repos - Array of repository metadata
 * @returns AI adoption statistics
 */
export function getAIAdoptionMetrics(repos: RepositoryMetadata[]): {
  reposWithAI: number;
  reposWithClaude: number;
  aiAdoptionRate: number;
  claudeAdoptionRate: number;
  totalAICommits: number;
  totalClaudeCommits: number;
  topAIRepo: string;
  topClaudeRepo: string;
} {
  let reposWithAI = 0;
  let reposWithClaude = 0;
  let totalAICommits = 0;
  let totalClaudeCommits = 0;
  let maxAICommits = 0;
  let topAIRepo = '';
  let maxClaudeCommits = 0;
  let topClaudeRepo = '';

  repos.forEach(repo => {
    if (repo.enhanced_metrics?.commits_analysis) {
      const { ai_coauthor_commits, claude_commits } = repo.enhanced_metrics.commits_analysis;
      
      if (ai_coauthor_commits > 0) {
        reposWithAI++;
        totalAICommits += ai_coauthor_commits;
        if (ai_coauthor_commits > maxAICommits) {
          maxAICommits = ai_coauthor_commits;
          topAIRepo = repo.name;
        }
      }
      
      if (claude_commits > 0) {
        reposWithClaude++;
        totalClaudeCommits += claude_commits;
        if (claude_commits > maxClaudeCommits) {
          maxClaudeCommits = claude_commits;
          topClaudeRepo = repo.name;
        }
      }
    }
  });

  return {
    reposWithAI,
    reposWithClaude,
    aiAdoptionRate: repos.length > 0 ? Math.round((reposWithAI / repos.length) * 100) : 0,
    claudeAdoptionRate: repos.length > 0 ? Math.round((reposWithClaude / repos.length) * 100) : 0,
    totalAICommits,
    totalClaudeCommits,
    topAIRepo,
    topClaudeRepo,
  };
}

/**
 * Format a number with abbreviated suffix (K, M, B)
 * 
 * @param num - Number to format
 * @param precision - Decimal places (default: 1)
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatNumber(num: number, precision: number = 1): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(precision)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(precision)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(precision)}K`;
  }
  return num.toString();
}

/**
 * Format days since push into human-readable string
 * 
 * @param days - Days since last push
 * @returns Human-readable string (e.g., "Today", "3 days ago", "2 weeks ago")
 */
export function formatDaysSincePush(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * TypeScript schema for raw-repo-metadata.json
 * 
 * Defines comprehensive types for repository metadata including enhanced metrics
 * not available through standard GitHub API calls.
 * 
 * @see public/raw-repo-metadata.json - Data source
 * @see https://github.com/unparty-app/theunpartyapp/issues/310 - Implementation plan
 */

// ============================================================================
// REPOSITORY METADATA
// ============================================================================

/**
 * Complete repository metadata structure matching raw-repo-metadata.json
 */
export interface RepositoryMetadata {
  /** Repository name (without owner) */
  name: string;
  
  /** Full repository name (owner/repo) */
  full_name: string;
  
  /** Repository description */
  description: string | null;
  
  /** Owner type: 'organization' or 'user' */
  owner_type: string;
  
  /** Primary programming language */
  language: string | null;
  
  /** Star count */
  stars: number;
  
  /** Fork count */
  forks: number;
  
  /** Open issues count */
  issues: number;
  
  /** Repository size in kilobytes */
  size_kb: number;
  
  /** Repository creation timestamp (ISO 8601) */
  created_at: string;
  
  /** Last update timestamp (ISO 8601) */
  updated_at: string;
  
  /** Last push timestamp (ISO 8601) */
  pushed_at: string;
  
  /** Days since last push (calculated) */
  days_since_push: number;
  
  /** Default branch name */
  default_branch: string;
  
  /** Repository visibility */
  visibility: 'private' | 'public';
  
  /** Repository URL */
  url: string;
  
  /** Repository topics/tags */
  topics: string[];
  
  /** License type */
  license: string;
  
  /** Whether repository is archived */
  archived: boolean;
  
  /** Whether repository is disabled */
  disabled: boolean;
  
  /** Whether repository is a fork */
  is_fork: boolean;
  
  /** Watchers count */
  watchers_count: number;
  
  /** Network count (forks of forks) */
  network_count: number;
  
  /** Subscribers count */
  subscribers_count: number;
  
  /** Whether wiki is enabled */
  has_wiki: boolean;
  
  /** Whether GitHub Pages is enabled */
  has_pages: boolean;
  
  /** Whether projects are enabled */
  has_projects: boolean;
  
  /** Whether discussions are enabled */
  has_discussions: boolean;
  
  /** Activity score (custom metric) */
  activity_score: number;
  
  /** Analysis timestamp (ISO 8601) */
  analysis_date: string;
  
  /** Enhanced metrics not available via standard API */
  enhanced_metrics: EnhancedMetrics;

  /** GitHub Actions workflow health metrics (present in newer snapshots) */
  workflow_metrics?: WorkflowMetrics;

  /** Canonical UnpppsConfig id resolved via the gh field (present in snapshots
   *  generated after theunpartyrunway/repo/repo-metadata-analyzer started
   *  preserving the match instead of discarding it after the inclusion filter) */
  unppp_id?: string | null;

  /** Whether this repo matched an entry in UnpppsConfig's gh field */
  is_unppp?: boolean;
}

/**
 * Summary of a single GitHub Actions workflow
 */
export interface WorkflowSummary {
  /** Workflow ID */
  id: number;

  /** Workflow name */
  name: string;

  /** Workflow state (e.g., 'active') */
  state: string;

  /** Health assessment: 'yah' | 'meh' | 'nah' | 'unknown' */
  health: string;
}

/**
 * Aggregated GitHub Actions workflow metrics per repository
 */
export interface WorkflowMetrics {
  /** Workflows in active state */
  active_count: number;

  /** Workflows with failing recent runs */
  failing_count: number;

  /** Workflows with passing recent runs */
  passing_count: number;

  /** Workflows with unknown run status */
  unknown_count: number;

  /** Total workflows configured */
  total_count: number;

  /** Per-workflow summaries */
  workflows: WorkflowSummary[];
}

// ============================================================================
// ENHANCED METRICS
// ============================================================================

/**
 * Enhanced repository metrics computed from GitHub API extensions
 * These metrics are not available through standard repository API calls
 */
export interface EnhancedMetrics {
  /** Number of distinct programming languages detected */
  languages_count: number;
  
  /** Detailed language breakdown by byte count */
  languages_detail: LanguagesDetail;
  
  /** Number of unique contributors */
  contributors_count: number;
  
  /** Total number of releases */
  releases_count: number;
  
  /** Most recent release date (ISO 8601) or null if no releases */
  latest_release_date: string | null;
  
  /** Community health score (0-100) */
  community_health_score: number;
  
  /** Whether repository has a README file */
  has_readme?: boolean;
  
  /** Whether repository has a CONTRIBUTING guide */
  has_contributing_guide?: boolean;
  
  /** Whether repository has a CODE_OF_CONDUCT file */
  has_code_of_conduct?: boolean;
  
  /** Commit analysis metrics */
  commits_analysis: CommitsAnalysis;
  
  /** Activity pattern metrics over time */
  active_period_metrics: ActivePeriodMetrics;
  
  /** Time-bounded commit metrics */
  time_bounded_commits?: TimeBoundedCommits;
}

/**
 * Language name to byte count mapping
 * Key: Language name (e.g., "TypeScript", "Python")
 * Value: Number of bytes of code in that language
 */
export type LanguagesDetail = Record<string, number>;

/**
 * Commit history analysis metrics
 * Computed from recent commit history (typically last 100 commits)
 */
export interface CommitsAnalysis {
  /** Total commits analyzed (max 100) */
  total_recent_commits: number;
  
  /** Commits with AI co-author attribution (any AI) */
  ai_coauthor_commits: number;
  
  /** Commits specifically co-authored by Claude */
  claude_commits: number;
  
  /** Number of unique commit authors */
  unique_authors: number;
  
  /** Average commit message length in characters */
  avg_commit_message_length: number;
  
  /** Percentage of commits following conventional commits format */
  conventional_commits_ratio: number;
  
  /** Average commits per week */
  commit_velocity_per_week: number;
  
  /** Number of unique authors in last 3 months (optional) */
  unique_authors_3mo?: number;
}

/**
 * Repository activity pattern metrics
 * Analyzes commit distribution over time
 */
export interface ActivePeriodMetrics {
  /** Number of weeks with at least one commit */
  weeks_with_commits: number;
  
  /** Maximum commits in any single week */
  max_commits_in_week: number;
  
  /** Number of "burst" weeks (above average activity) */
  burst_weeks_count: number;
  
  /** Velocity during active weeks only */
  active_velocity: number;
  
  /** Total weeks in tracking period (optional) */
  total_weeks_tracked?: number;
  
  /** Ratio of active weeks to total weeks (optional) */
  active_period_ratio?: number;
}

/**
 * Time-bounded commit metrics
 * Tracks commit activity over specific time windows
 */
export interface TimeBoundedCommits {
  /** Commits in the last 5 days */
  commits_last_5_days: number;
  
  /** Commits in the last 7 days (1 week) */
  commits_last_7_days: number;
  
  /** Commits in the last 30 days (1 month) */
  commits_last_30_days: number;
  
  /** Composite activity score weighted by recency */
  weighted_activity_score: number;
  
  /** Unique authors contributing in last 5 days */
  unique_authors_5d: number;
  
  /** Unique authors contributing in last 7 days */
  unique_authors_7d: number;
  
  /** Unique authors contributing in last 30 days */
  unique_authors_30d: number;
  
  /** Average commits per day (sprint velocity) */
  sprint_velocity_daily: number;
  
  /** Average commits per week (sprint velocity) */
  sprint_velocity_weekly: number;
  
  /** Average commits per month (sprint velocity) */
  sprint_velocity_monthly: number;
}

// ============================================================================
// AGGREGATED REPOSITORY STATISTICS
// ============================================================================

/**
 * Aggregated statistics across all repositories (not just language-specific)
 */
export interface AggregatedRepositoryStats {
  /** Total number of repositories */
  totalRepositories: number;
  
  /** Total stars across all repos */
  totalStars: number;
  
  /** Total forks across all repos */
  totalForks: number;
  
  /** Total open issues across all repos */
  totalIssues: number;
  
  /** Total contributors summed across all repos (not deduplicated) */
  totalContributors: number;
  
  /** Total releases across all repos */
  totalReleases: number;
  
  /** Total AI-assisted commits */
  totalAICommits: number;
  
  /** Total Claude-assisted commits */
  totalClaudeCommits: number;
  
  /** Total recent commits analyzed */
  totalRecentCommits: number;
  
  /** Average activity score across all repos */
  averageActivityScore: number;
  
  /** Average commit velocity per week */
  averageCommitVelocity: number;
  
  /** Average community health score */
  averageCommunityHealth: number;
  
  /** Count of archived repositories */
  archivedCount: number;
  
  /** Count of forked repositories */
  forkCount: number;
  
  /** Repositories active in last 7 days */
  activeThisWeek: number;
  
  /** Repositories active in last 30 days */
  activeThisMonth: number;
  
  /** Most active repository by activity score */
  mostActiveRepo: string;
  
  /** Repository with most contributors */
  mostContributorsRepo: string;
  
  /** Repository with most releases */
  mostReleasesRepo: string;
}

// ============================================================================
// PROCESSED DATA TYPES
// ============================================================================

/**
 * Processed language data ready for visualization
 * Includes calculated percentages and color mapping
 */
export interface LanguageData {
  /** Language name */
  name: string;
  
  /** Total bytes of code */
  bytes: number;
  
  /** Percentage of total codebase (0-100) */
  percentage: number;
  
  /** GitHub language color code */
  color: string;
}

/**
 * Aggregated language statistics across multiple repositories
 */
export interface AggregatedLanguageStats {
  /** Array of language data sorted by bytes (descending) */
  languages: LanguageData[];
  
  /** Total bytes across all languages and repositories */
  totalBytes: number;
  
  /** Number of repositories included in aggregation */
  totalRepositories: number;
  
  /** Number of distinct languages found */
  languageCount: number;
  
  /** Names of top 5 languages by byte count */
  topLanguages: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if object is valid RepositoryMetadata
 */
export function isRepositoryMetadata(obj: unknown): obj is RepositoryMetadata {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const repo = obj as Partial<RepositoryMetadata>;
  
  return (
    typeof repo.name === 'string' &&
    typeof repo.full_name === 'string' &&
    typeof repo.enhanced_metrics === 'object' &&
    repo.enhanced_metrics !== null
  );
}

/**
 * Type guard to check if object contains enhanced metrics
 */
export function hasEnhancedMetrics(repo: RepositoryMetadata): repo is RepositoryMetadata & { enhanced_metrics: EnhancedMetrics } {
  return (
    repo.enhanced_metrics !== undefined &&
    typeof repo.enhanced_metrics.languages_detail === 'object'
  );
}

/**
 * Extract all unique language names from repository metadata array
 */
export type LanguageNames<T extends readonly RepositoryMetadata[]> = {
  [K in keyof T]: T[K] extends RepositoryMetadata 
    ? keyof T[K]['enhanced_metrics']['languages_detail']
    : never;
}[number];

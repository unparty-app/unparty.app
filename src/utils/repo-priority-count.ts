/**
 * Repo priority count — an effort-driven companion to unppp-priority-count.ts.
 * Scores a `public/raw-repo-metadata.json` entry by *recent, real* commit
 * activity instead of config completeness, using GitHub's own
 * `enhanced_metrics.active_period_metrics` and `.time_bounded_commits`.
 *
 * Weights are a first draft — retune the *_WEIGHTS tables below and rerun
 * `npm run priority:debug` to see the effect immediately.
 *
 * Design intent: bias toward recency. A repo with a hot last 5-7 days should
 * outscore one with the same total commits spread evenly over 30 days —
 * "current focus" is the signal this is meant to surface, per gh issue #619.
 */

export interface RepoPriorityCountBreakdown {
  total: number
  activePeriodPoints: number
  timeBoundedPoints: number
}

interface ActivePeriodMetrics {
  weeks_with_commits?: number
  max_commits_in_week?: number
  burst_weeks_count?: number
  total_weeks_tracked?: number
  active_period_ratio?: number
  active_velocity?: number
  [key: string]: number | undefined
}

interface TimeBoundedCommits {
  commits_last_5_days?: number
  commits_last_7_days?: number
  commits_last_30_days?: number
  weighted_activity_score?: number
  unique_authors_5d?: number
  unique_authors_7d?: number
  unique_authors_30d?: number
  sprint_velocity_daily?: number
  sprint_velocity_weekly?: number
  sprint_velocity_monthly?: number
  [key: string]: number | undefined
}

/** Per-key weight applied to `enhanced_metrics.active_period_metrics`. */
const ACTIVE_PERIOD_WEIGHTS: Record<keyof ActivePeriodMetrics, number> = {
  weeks_with_commits: 1,
  max_commits_in_week: 0.5,
  burst_weeks_count: 2,
  total_weeks_tracked: 0.25,
  active_period_ratio: 3,
  active_velocity: 1,
}

/** Per-key weight applied to `enhanced_metrics.time_bounded_commits`.
 *  Shorter windows are weighted higher on purpose — see module docstring. */
const TIME_BOUNDED_WEIGHTS: Record<keyof TimeBoundedCommits, number> = {
  commits_last_5_days: 2,
  commits_last_7_days: 1,
  commits_last_30_days: 0.3,
  weighted_activity_score: 0.05,
  unique_authors_5d: 2,
  unique_authors_7d: 1,
  unique_authors_30d: 0.5,
  sprint_velocity_daily: 3,
  sprint_velocity_weekly: 1,
  sprint_velocity_monthly: 0.3,
}

const weightedSum = <T extends Record<string, number | undefined>>(
  metrics: T | undefined,
  weights: Record<keyof T, number>
): number => {
  if (!metrics) return 0
  return (Object.keys(weights) as (keyof T)[]).reduce((sum, key) => {
    const value = metrics[key]
    return typeof value === 'number' && Number.isFinite(value) ? sum + value * weights[key] : sum
  }, 0)
}

export function getActivePeriodPoints(metrics: ActivePeriodMetrics | undefined): number {
  return Math.round(weightedSum(metrics, ACTIVE_PERIOD_WEIGHTS))
}

export function getTimeBoundedPoints(metrics: TimeBoundedCommits | undefined): number {
  return Math.round(weightedSum(metrics, TIME_BOUNDED_WEIGHTS))
}

/** `entry` is a raw-repo-metadata.json record. Repos with no
 *  `enhanced_metrics` (or no matching repo at all) score 0, not an error. */
export function calculateRepoPriorityCount(entry: Record<string, unknown> | undefined): RepoPriorityCountBreakdown {
  const enhanced = entry?.enhanced_metrics as
    | { active_period_metrics?: ActivePeriodMetrics; time_bounded_commits?: TimeBoundedCommits }
    | undefined

  const activePeriodPoints = getActivePeriodPoints(enhanced?.active_period_metrics)
  const timeBoundedPoints = getTimeBoundedPoints(enhanced?.time_bounded_commits)

  return {
    total: activePeriodPoints + timeBoundedPoints,
    activePeriodPoints,
    timeBoundedPoints,
  }
}

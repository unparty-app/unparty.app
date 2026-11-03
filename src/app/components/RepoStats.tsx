'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from '../contexts/ThemeContext'

import { Users, Zap, Activity, DollarSign, BookOpen, Info, GitCommit, ListChecks, Bot, Clock, Workflow, Gauge } from '@/app/components/icons'
import type { RepositoryMetadata, EnhancedMetrics } from '@/types/repository-metadata'
import { getRepoNameForUnppp, getUnpppForRepoName } from '@/utils/unppp-repo-mapping'
import { analyzeRepositoryHistoryInsights, type RepositoryHistoryInsights } from '@/utils/repo-metadata-averages'
import { getUnpppPriorityData, unpppCostSummaryData } from '@/utils/unpppPriority'
import { calculatePriorityCount, getUrlPoints } from '@/utils/unppp-priority-count'
import { getRepoMetadata } from '@/utils/repoMetadataClient'
import { useAsyncData } from '@/hooks/useFetch'
import { getStoriesByRepo } from '../utils/storyRepoMappings'
import StorySchema, { type Story } from '@/utils/StorySchema'
import storiesManifest from '@/data/storiesManifest.json'
import UnpppsConfig from '@/data/UnpppsConfig.json'
import coverExtensions from '../covers/cover-extensions.json'
import Badge from './Badge'
import ScrollRow from '@/components/HorizontalRow'
import KpiTile, { getKpiConfig } from './KpiTile'
import KpiModal, { type KpiComparison } from './KpiModal'
import LiveUrlPill from './LiveUrlPill'
import UnpppWorkflowDisplay from './UnpppWorkflowDisplay'

interface EffortMetrics {
  totalCommits: number
  weeklyVelocity: number
  totalIssues: number
  contributors: number
  aiCommits: number
  claudeCommits: number
  activeWeeks: number
  activityHealth: number
  recentActivity: string
}

interface ProcessedRepository {
  name: string
  fullName: string
  pushedAt: string
  issues: number
  daysSincePush: number
  enhancedMetrics: EnhancedMetrics
  activity_score: number
}

interface RepoStatsData {
  repositories: ProcessedRepository[]
  effortMetrics: EffortMetrics
  activeUnppps: number
  totalUnppps: number
  historyInsights: RepositoryHistoryInsights
}

interface RepoStatsProps {
  /** Direct repository name (legacy support) */
  repoName?: string
  /** Unppp ID from UnpppsConfig - will be resolved to repo name automatically */
  unpppId?: string
}

const formatMoney = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

/** Fields consumed by the CORE. tab — UnpppsConfig entries are heterogeneous JSON */
interface UnpppCoreConfig {
  id: string
  priority?: number
  category?: string
  startDate?: string
  lastModified?: string
  storyPublished?: boolean
  tagline?: string
}

const formatConfigDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

/** Stories that mention this repo — StoryTable pattern with cover thumbnails, rows link to the story */
function RepoStoriesTable({ repoName, accent }: { repoName: string; accent: string }) {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const storyIds = await getStoriesByRepo(repoName)
        const loaded = await Promise.all(storyIds.map(id => StorySchema.getStory(id)))
        setStories(
          loaded
            .filter((story): story is Story => story !== null && story.metadata.published)
            .sort((a, b) => a.id.localeCompare(b.id))
        )
      } catch (error) {
        console.error('Failed to load stories for repo:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [repoName])

  if (loading) {
    return (
      <div className="py-4">
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>thinking...</span>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="py-4">
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          no stories mention this unppp yet.
        </span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
              <th className="py-3 pl-0 pr-2 text-left sm:pr-4">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  STORY.
                </span>
              </th>
              <th className="py-3 px-2 text-left sm:px-4">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  FOUNDER.
                </span>
              </th>
              <th className="py-3 px-2 text-left sm:px-4">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  CATEGORY.
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
        {stories.map((story) => {
          const coverId = story.id.replace('story-', 'cover-')
          const ext = (coverExtensions as Record<string, string>)[coverId] ?? 'png'
          const storySlug = (storiesManifest.coverIdToSlug as Record<string, string>)[coverId] ?? coverId
          // ?mention= deep-links to the first section referencing this repo
          const storyUrl = `/story/${storySlug}?mention=${encodeURIComponent(repoName)}`

          return (
            <tr
              key={story.id}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                  window.open(storyUrl, '_blank', 'noopener,noreferrer')
                  return
                }
                router.push(storyUrl)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  router.push(storyUrl)
                }
              }}
              tabIndex={0}
              role="link"
              aria-label={`Open story ${story.metadata.title}`}
              className="group cursor-pointer border-b border-gray-200/10 transition-colors duration-200 hover:bg-gray-50/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--foreground)] dark:border-gray-700/10 dark:hover:bg-white/5"
            >
              {/* Story cover + title */}
              <td className="py-3 pl-0 pr-2 sm:pr-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-12 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={`/covers/${coverId}.${ext}`}
                      alt={story.metadata.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
                    {story.metadata.title}
                  </span>
                  <span
                    className="font-google-sans-code text-xs uppercase tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-80 group-focus-visible:opacity-80"
                    style={{ color: accent }}
                  >
                    open →
                  </span>
                </div>
              </td>

              {/* Founder */}
              <td className="py-3 px-2 sm:px-4">
                {story.metadata.authorImage && (
                  <div className="relative size-6 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={story.metadata.authorImage}
                      alt={story.metadata.author}
                      width={24}
                      height={24}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </td>

              {/* Category */}
              <td className="py-3 px-2 sm:px-4">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {story.metadata.category}
                </span>
              </td>
            </tr>
          )
        })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Activity health for a single repo — mirrors the aggregate calculation in fetchRepoStats */
const computeRepoHealth = (repo: RepositoryMetadata): number => {
  const activeRatio = repo.enhanced_metrics?.active_period_metrics?.active_period_ratio || 0
  const daysSincePush = repo.days_since_push || 999
  return activeRatio * (daysSincePush < 7 ? 1 : daysSincePush < 30 ? 0.7 : 0.3)
}

interface MetricRow {
  label: React.ReactNode
  value: React.ReactNode
}

interface MetricSection {
  id: string
  title: string
  icon?: React.ReactNode
  meta?: React.ReactNode
  rows?: MetricRow[]
  /** Custom tab content — rendered instead of the METRIC./VALUE. table */
  content?: React.ReactNode
}

/** Single tabbed table following the StoryTable/UnpppTable pattern —
 *  tab bar with accent underline, one open full-width table per section. */
function TabbedMetricTable({ sections, accent }: { sections: MetricSection[]; accent: string }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const active = sections.find(s => s.id === activeId) ?? sections[0]

  if (!active) return null

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div role="tablist" className="flex items-center gap-4 overflow-x-auto whitespace-nowrap border-b border-gray-200/20 scrollbar-hide sm:gap-6 dark:border-gray-700/20">
        {sections.map(section => {
          const isActive = section.id === active.id
          return (
            <button
              key={section.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(section.id)}
              className="relative -mb-px inline-flex items-center gap-2 py-3 font-google-sans-code text-xs uppercase tracking-wide transition-colors duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--foreground)]"
              style={{ color: isActive ? 'var(--foreground)' : 'var(--text-muted)' }}
            >
              {section.icon}
              {section.title}
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 transition-opacity duration-200"
                style={{ backgroundColor: accent, opacity: isActive ? 1 : 0 }}
              />
            </button>
          )
        })}
        {active.meta && (
          <span className="ml-auto flex-shrink-0 whitespace-nowrap font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {active.meta}
          </span>
        )}
      </div>

      {/* Active section table */}
      <div key={active.id} className="animate-in fade-in overflow-x-auto duration-200">
        {active.content ?? (
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                <th className="py-3 pl-0 pr-2 text-left sm:pr-4">
                  <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    METRIC.
                  </span>
                </th>
                <th className="py-3 px-2 text-left sm:px-4">
                  <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    DEBT.
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(active.rows ?? []).map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200/10 transition-colors duration-200 hover:bg-gray-50/20 dark:border-gray-700/10 dark:hover:bg-white/5">
                  <td className="py-3 pl-0 pr-2 sm:pr-4">
                    <span className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>{row.label}</span>
                  </td>
                  <td className="py-3 px-2 sm:px-4">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const RepoStats: React.FC<RepoStatsProps> = ({ repoName, unpppId }) => {
  const { colorValue } = useTheme()
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null)
  // Unfiltered org-wide dataset, used for KPI modal comparisons and history
  // insights (trends only make sense across all repos)
  const { data: fullData, loading, error } = useAsyncData('raw-repo-metadata', () => getRepoMetadata())
  const allRepos = useMemo(() => fullData ?? [], [fullData])

  // Resolve the actual repo name to use
  const resolvedRepoName = useMemo(() => {
    if (repoName) return repoName
    if (unpppId) return getRepoNameForUnppp(unpppId)
    return null
  }, [repoName, unpppId])

  // Resolve the unppp id for valuation lookup (works from either prop)
  const resolvedUnpppId = useMemo(() => {
    if (unpppId) return unpppId
    if (repoName) return getUnpppForRepoName(repoName)?.id ?? null
    return null
  }, [unpppId, repoName])

  // Valuation KPIs — statically bundled, always available, independent of the fetch below.
  const priorityData = useMemo(() => getUnpppPriorityData(), [])
  const valuationEntry = useMemo(
    () => (resolvedUnpppId ? priorityData.find(p => p.id === resolvedUnpppId) ?? null : null),
    [priorityData, resolvedUnpppId]
  )
  const valuationRank = useMemo(
    () => (valuationEntry ? priorityData.findIndex(p => p.id === resolvedUnpppId) + 1 : null),
    [priorityData, valuationEntry, resolvedUnpppId]
  )
  const costSummary = unpppCostSummaryData.summary

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }, [])

  const data = useMemo<RepoStatsData | null>(() => {
    if (!fullData) return null

    let rawData: RepositoryMetadata[] = fullData

    // Filter by resolved repo name if provided
    if (resolvedRepoName) {
      rawData = rawData.filter(repo => repo.name === resolvedRepoName)

      // If no repos found, it could be a mapping issue
      if (rawData.length === 0) {
        console.warn(`No repository found for: ${resolvedRepoName}`)
      }
    }

    // Calculate effort and organization metrics
    const effortMetrics: EffortMetrics = {
      totalCommits: 0,
      weeklyVelocity: 0,
      totalIssues: 0,
      contributors: 0,
      aiCommits: 0,
      claudeCommits: 0,
      activeWeeks: 0,
      activityHealth: 0,
      recentActivity: ''
    }

    let velocitySum = 0
    let velocityCount = 0
    let healthSum = 0
    let healthCount = 0
    const contributorsSet = new Set<number>()

    rawData.forEach((repo: RepositoryMetadata) => {
      // Commits
      const commits = repo.enhanced_metrics?.commits_analysis?.total_recent_commits || 0
      effortMetrics.totalCommits += commits

      // Weekly velocity
      const velocity = repo.enhanced_metrics?.commits_analysis?.commit_velocity_per_week || 0
      if (velocity > 0) {
        velocitySum += velocity
        velocityCount++
      }

      // Issues
      effortMetrics.totalIssues += repo.issues || 0

      // Contributors (unique count)
      const repoContributors = repo.enhanced_metrics?.contributors_count || 0
      if (repoContributors > 0) {
        contributorsSet.add(repoContributors)
      }

      // AI collaboration
      effortMetrics.aiCommits += repo.enhanced_metrics?.commits_analysis?.ai_coauthor_commits || 0
      effortMetrics.claudeCommits += repo.enhanced_metrics?.commits_analysis?.claude_commits || 0

      // Active weeks
      const weeks = repo.enhanced_metrics?.active_period_metrics?.weeks_with_commits || 0
      effortMetrics.activeWeeks += weeks

      // Activity health (based on active period ratio and days since push)
      const activeRatio = repo.enhanced_metrics?.active_period_metrics?.active_period_ratio || 0
      const daysSincePush = repo.days_since_push || 999
      const repoHealth = activeRatio * (daysSincePush < 7 ? 1 : daysSincePush < 30 ? 0.7 : 0.3)
      if (repoHealth > 0) {
        healthSum += repoHealth
        healthCount++
      }
    })

    // Calculate averages
    effortMetrics.weeklyVelocity = velocityCount > 0 ? Math.round(velocitySum / velocityCount * 10) / 10 : 0
    effortMetrics.contributors = Array.from(contributorsSet).reduce((sum, count) => sum + count, 0)
    effortMetrics.activityHealth = healthCount > 0 ? Math.round((healthSum / healthCount) * 100) : 0

    // Recent activity
    if (rawData.length > 0) {
      const mostRecent = rawData.reduce((prev, curr) =>
        new Date(curr.pushed_at) > new Date(prev.pushed_at) ? curr : prev
      )
      effortMetrics.recentActivity = formatDate(mostRecent.pushed_at)
    }

    // Active unppps (pushed in last 30 days)
    const activeUnppps = rawData.filter(repo => (repo.days_since_push || 999) < 30).length

    const processedData: RepoStatsData = {
      repositories: rawData.map((repo: RepositoryMetadata) => ({
        name: repo.name,
        fullName: repo.full_name,
        pushedAt: repo.pushed_at,
        issues: repo.issues,
        daysSincePush: repo.days_since_push,
        enhancedMetrics: repo.enhanced_metrics,
        activity_score: repo.activity_score
      })),
      effortMetrics,
      activeUnppps,
      totalUnppps: rawData.length,
      // Always org-wide: with the filtered single-repo array every trend
      // bucket read 0 and both outliers were the same repo
      historyInsights: analyzeRepositoryHistoryInsights(fullData),
    }

    return processedData
  }, [fullData, resolvedRepoName, formatDate])

  const selectedKpi = useMemo(() => (selectedKpiId ? getKpiConfig(selectedKpiId) : null), [selectedKpiId])

  // Unppps with similar KPI metrics, shown in the KPI modal
  const comparisons = useMemo<KpiComparison[]>(() => {
    if (!selectedKpiId) return []

    const finalize = (rows: KpiComparison[]): KpiComparison[] => {
      const top = rows.slice(0, 5)
      const current = rows.find(r => r.isCurrent)
      if (current && !top.includes(current)) top.push(current)
      return top
    }

    const fromPriority = (
      sorted: typeof priorityData,
      format: (entry: (typeof priorityData)[number]) => string
    ): KpiComparison[] =>
      finalize(
        sorted.map(entry => ({
          id: entry.id,
          displayName: entry.id,
          value: format(entry),
          isCurrent: entry.id === resolvedUnpppId,
        }))
      )

    const fromRepos = (
      getVal: (repo: RepositoryMetadata) => number,
      format: (repo: RepositoryMetadata) => string
    ): KpiComparison[] =>
      finalize(
        [...allRepos]
          .sort((a, b) => getVal(b) - getVal(a))
          .map(repo => ({
            id: getUnpppForRepoName(repo.name)?.id ?? repo.name,
            displayName: repo.name,
            value: format(repo),
            isCurrent: repo.name === resolvedRepoName,
          }))
      )

    switch (selectedKpiId) {
      case 'value':
      case 'valuation':
        return fromPriority(
          [...priorityData].sort((a, b) => b.polarPrice - a.polarPrice),
          e => formatMoney(e.polarPrice)
        )
      case 'hours':
        return fromPriority(
          [...priorityData].sort((a, b) => b.devHours - a.devHours),
          e => `${e.devHours.toFixed(0)}h`
        )
      case 'confidence':
        return fromPriority(
          [...priorityData].sort((a, b) =>
            a.confidence === b.confidence
              ? b.priorityScore - a.priorityScore
              : a.confidence === 'high' ? -1 : 1
          ),
          e => e.confidence
        )
      case 'active':
        return fromRepos(r => -(r.days_since_push || 999), r => formatDate(r.pushed_at))
      case 'commits':
        return fromRepos(
          r => r.enhanced_metrics?.commits_analysis?.total_recent_commits || 0,
          r => `${r.enhanced_metrics?.commits_analysis?.total_recent_commits || 0}`
        )
      case 'issues':
        return fromRepos(r => r.issues || 0, r => `${r.issues || 0}`)
      case 'builders':
        return fromRepos(
          r => r.enhanced_metrics?.contributors_count || 0,
          r => `${r.enhanced_metrics?.contributors_count || 0}`
        )
      case 'ai': {
        const pct = (r: RepositoryMetadata) => {
          const total = r.enhanced_metrics?.commits_analysis?.total_recent_commits || 0
          if (total === 0) return 0
          const assisted =
            (r.enhanced_metrics?.commits_analysis?.ai_coauthor_commits || 0) +
            (r.enhanced_metrics?.commits_analysis?.claude_commits || 0)
          return Math.round((assisted / total) * 100)
        }
        return fromRepos(pct, r => `${pct(r)}%`)
      }
      case 'health':
        return fromRepos(
          r => computeRepoHealth(r),
          r => `${Math.round(computeRepoHealth(r) * 100)}%`
        )
      default:
        return []
    }
  }, [selectedKpiId, allRepos, priorityData, resolvedUnpppId, resolvedRepoName, formatDate])

  const getHealthColor = (health: number) => {
    if (health >= 70) return '#22c55e' // green
    if (health >= 40) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="flex items-center">
          <div className="size-3 animate-pulse rounded-full" style={{ backgroundColor: colorValue }} />
          <span className="ml-2 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>thinking...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="flex items-center">
          <div className="size-3 rounded-full bg-red-500" />
          <span className="ml-2 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>BUILD DATA UNAVAILABLE</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { effortMetrics, activeUnppps, totalUnppps, historyInsights } = data
  const aiPct = effortMetrics.totalCommits > 0
    ? Math.round(((effortMetrics.claudeCommits + effortMetrics.aiCommits) / effortMetrics.totalCommits) * 100)
    : 0

  // KPI tile factory — color/label/definition come from unparty-kpi.json
  const kpiTile = (id: string, icon: React.ReactNode, value: React.ReactNode, caption?: React.ReactNode) => {
    const kpi = getKpiConfig(id) ?? { id, label: `${id.toUpperCase()}.`, metricLabel: `${id.toUpperCase()}.`, color: colorValue, definition: '' }
    return <KpiTile key={id} kpi={kpi} icon={icon} value={value} caption={caption} onClick={() => setSelectedKpiId(id)} />
  }

  // Value tiles come first — the KPIs that actually drive the /valuation number.
  const tiles: React.ReactNode[] = []

  if (valuationEntry) {
    tiles.push(
      kpiTile(
        'value',
        <DollarSign size={14} />,
        formatMoney(valuationEntry.polarPrice),
        <span className="flex items-center gap-1.5">
          rank #{valuationRank} of {priorityData.length}
          <Badge variant="header" size="sm" style={{ borderColor: 'var(--background)', color: 'var(--background)' }}>
            {valuationEntry.confidence}
          </Badge>
        </span>
      ),
      kpiTile('hours', <Clock size={14} />, `${valuationEntry.devHours.toFixed(0)}h`, 'measured effort')
    )
  } else {
    tiles.push(
      kpiTile('valuation', <DollarSign size={14} />, formatMoney(costSummary.total_polar_price), `${costSummary.unppp_count} unppps priced`),
      kpiTile('confidence', <Clock size={14} />, `${costSummary.high_confidence_count}/${costSummary.unppp_count}`, 'high confidence'),
      kpiTile(
        'active',
        <Zap size={14} />,
        <>
          {activeUnppps}
          <span className="ml-1 text-2xl opacity-60">/{totalUnppps}</span>
        </>,
        'last 30d'
      )
    )
  }

  tiles.push(
    kpiTile('commits', <GitCommit size={14} />, effortMetrics.totalCommits.toLocaleString(), `${effortMetrics.weeklyVelocity}/week`),
    kpiTile('issues', <ListChecks size={14} />, effortMetrics.totalIssues, 'scope of work'),
    kpiTile('builders', <Users size={14} />, effortMetrics.contributors, 'unique')
  )

  if (effortMetrics.claudeCommits > 0 || effortMetrics.aiCommits > 0) {
    tiles.push(kpiTile('ai', <Bot size={14} />, `${aiPct}%`, 'of commits assisted'))
  }

  tiles.push(kpiTile('health', <Activity size={14} />, `${effortMetrics.activityHealth}%`, 'activity health'))

  const showLlm = effortMetrics.claudeCommits > 0 || effortMetrics.aiCommits > 0

  const organizationRows: MetricRow[] = [
    {
      label: 'Active development weeks',
      value: <span className="font-vt323 text-sm" style={{ color: colorValue }}>{effortMetrics.activeWeeks}</span>,
    },
    {
      label: 'Recent.',
      value: <span className="font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>{effortMetrics.recentActivity}</span>,
    },
    {
      label: 'Activity.',
      value: (
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: getHealthColor(effortMetrics.activityHealth) }} />
          <span className="font-vt323 text-sm" style={{ color: getHealthColor(effortMetrics.activityHealth) }}>
            {effortMetrics.activityHealth}%
          </span>
        </span>
      ),
    },
  ]

  const llmRows: MetricRow[] = []
  if (effortMetrics.claudeCommits > 0) {
    llmRows.push({
      label: 'Claude Code',
      value: <span className="font-vt323 text-sm" style={{ color: colorValue }}>{effortMetrics.claudeCommits} commits</span>,
    })
  }
  if (effortMetrics.aiCommits > 0) {
    llmRows.push({
      label: 'Other AI Tools',
      value: <span className="font-vt323 text-sm" style={{ color: colorValue }}>{effortMetrics.aiCommits} commits</span>,
    })
  }
  llmRows.push({
    label: 'AI-assisted work',
    value: <span className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>{aiPct}%</span>,
  })

  const historyRows: MetricRow[] = [
    { label: 'No movement', value: <span className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>{historyInsights.stagnantRepos.length}</span> },
    { label: 'Recent spikes', value: <span className="font-vt323 text-sm" style={{ color: colorValue }}>{historyInsights.spikingRepos.length}</span> },
    { label: 'Accelerating', value: <span className="font-vt323 text-sm" style={{ color: '#22c55e' }}>{historyInsights.acceleratingRepos.length}</span> },
    { label: 'Cooling', value: <span className="font-vt323 text-sm" style={{ color: '#f59e0b' }}>{historyInsights.coolingRepos.length}</span> },
    { label: 'High outlier', value: <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>{historyInsights.highestActivityRepo || 'N/A'}</span> },
    { label: 'Low outlier', value: <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>{historyInsights.lowestActivityRepo || 'N/A'}</span> },
  ]
  if (historyInsights.effortClusters[0]) {
    historyRows.push({
      label: 'Most connected by effort',
      value: (
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
          {historyInsights.effortClusters[0].label}
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {historyInsights.effortClusters[0].repositories.slice(0, 3).join(', ')}
            {historyInsights.effortClusters[0].repositories.length > 3 ? '…' : ''}
          </span>
        </span>
      ),
    })
  }

  // CORE. tab — unppp identity metadata (moved from AboutComponent)
  const unpppConfigRaw = resolvedUnpppId
    ? UnpppsConfig.unppps.find(u => u.id === resolvedUnpppId)
    : undefined
  const unpppConfig = unpppConfigRaw as UnpppCoreConfig | undefined
  // Dynamic priority — replaces the hardcoded UnpppsConfig priority field:
  // URL tier (unparty=4 / TestFlight=3 / vercel=2 / other=1) + core-repo bonus + 1 per completed config key
  const priorityCount = unpppConfigRaw
    ? calculatePriorityCount(unpppConfigRaw as unknown as Record<string, unknown>)
    : null

  const coreRows: MetricRow[] = []
  if (unpppConfig) {
    coreRows.push({
      label: 'ID',
      value: <span className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>{unpppConfig.id}</span>,
    })
    if (priorityCount) {
      coreRows.push({
        label: 'Priority',
        value: (
          <span className="inline-flex items-center gap-2">
            <span className="font-vt323 text-sm tabular-nums" style={{ color: colorValue }}>{priorityCount.total}</span>
            <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
              url +{priorityCount.urlPoints}{priorityCount.corePoints > 0 && ` · core +${priorityCount.corePoints}`} · keys {priorityCount.completedKeys}/{priorityCount.expectedKeys}
            </span>
            {priorityCount.urlPoints === 4 && <span className="text-xs" title="Live on unparty.app">⭐</span>}
          </span>
        ),
      })
    }
    if (unpppConfig.category) {
      coreRows.push({
        label: 'Category',
        value: <span className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>{unpppConfig.category}</span>,
      })
    }
    if (unpppConfig.startDate) {
      coreRows.push({
        label: 'Started',
        value: <span className="font-vt323 text-sm tabular-nums" style={{ color: 'var(--foreground)' }}>{formatConfigDate(unpppConfig.startDate)}</span>,
      })
    }
    if (unpppConfig.lastModified && unpppConfig.lastModified !== 'null') {
      coreRows.push({
        label: 'Modified',
        value: <span className="font-vt323 text-sm tabular-nums" style={{ color: 'var(--foreground)' }}>{formatConfigDate(unpppConfig.lastModified)}</span>,
      })
    }
    coreRows.push({
      label: 'Status',
      value: (
        <span className={`font-vt323 text-sm ${unpppConfig.storyPublished ? 'text-green-400' : 'text-yellow-400'}`}>
          {unpppConfig.storyPublished ? '✓ Published' : '○ Unpublished'}
        </span>
      ),
    })
    if (unpppConfig.tagline) {
      coreRows.push({
        label: 'Tag',
        value: <span className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>{unpppConfig.tagline}</span>,
      })
    }
    // Distribution link — TestFlight / live unparty.app pill
    const unpppUrl = (unpppConfigRaw as Record<string, unknown>).url
    if (typeof unpppUrl === 'string' && getUrlPoints(unpppUrl) >= 3) {
      coreRows.push({
        label: 'URL',
        value: <LiveUrlPill url={unpppUrl} />,
      })
    }
  }

  // MOMENTUM. tab — time-bounded commits: current investment, not history.
  // Scoped repos in single-repo mode, org-wide totals otherwise.
  const momentum = data.repositories.reduce(
    (acc, repo) => {
      const tb = repo.enhancedMetrics?.time_bounded_commits
      const ap = repo.enhancedMetrics?.active_period_metrics
      acc.last5d += tb?.commits_last_5_days ?? 0
      acc.last7d += tb?.commits_last_7_days ?? 0
      acc.last30d += tb?.commits_last_30_days ?? 0
      acc.weeklySprint += tb?.sprint_velocity_weekly ?? 0
      acc.bestWeek = Math.max(acc.bestWeek, ap?.max_commits_in_week ?? 0)
      acc.burstWeeks += ap?.burst_weeks_count ?? 0
      return acc
    },
    { last5d: 0, last7d: 0, last30d: 0, weeklySprint: 0, bestWeek: 0, burstWeeks: 0 }
  )

  const momentumRows: MetricRow[] = [
    { label: 'Commits, last 5 days', value: <span className="font-vt323 text-sm" style={{ color: colorValue }}>{momentum.last5d}</span> },
    { label: 'Commits, last 7 days', value: <span className="font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>{momentum.last7d}</span> },
    { label: 'Commits, last 30 days', value: <span className="font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>{momentum.last30d}</span> },
    { label: 'Sprint velocity', value: <span className="font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>{momentum.weeklySprint.toFixed(1)}/week</span> },
    { label: 'Best week ever', value: <span className="font-vt323 text-sm" style={{ color: colorValue }}>{momentum.bestWeek} commits</span> },
    { label: 'Burst weeks', value: <span className="font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>{momentum.burstWeeks}</span> },
  ]

  // AUTOMATION. meta — workflow health summary for the scoped repo
  const workflowMetrics = resolvedRepoName
    ? allRepos.find(r => r.name === resolvedRepoName)?.workflow_metrics
    : undefined

  return (
    <div className="w-full">
      {/* Header - transparency focused; Banner pill recipe (soft 40-alpha border) */}
      <div className="mb-8">
        <div className="mb-4 flex w-full flex-wrap items-center gap-3 rounded-2xl border px-4 py-2 sm:w-auto sm:rounded-full" style={{ borderColor: `${colorValue}40`, backgroundColor: `${colorValue}10` }}>
          <div className="flex min-w-0 items-start">
            <div className="h-4 w-px flex-shrink-0" style={{ backgroundColor: colorValue, opacity: 0.3 }} />
            <span className="font-vt323 text-sm opacity-70" style={{ color: 'var(--foreground)' }}>
              {resolvedRepoName ? 'EFFORT.' : 'HOW DOES UNPARTY BUILD? ACTIVELY.'}
            </span>
          </div>
          <Link
            href="/valuation"
            className="font-google-sans-code text-xs font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
            style={{ color: colorValue }}
          >
            how is this priced? →
          </Link>
        </div>
      </div>

      {/* KPI tiles - unppp-style cards */}
      <ScrollRow items={tiles} maxItems={tiles.length} />

      {/* Tabbed metric table - StoryTable/UnpppTable pattern */}
      <div className="mt-8">
        <TabbedMetricTable
          accent={colorValue}
          sections={[
            ...(coreRows.length > 0
              ? [{ id: 'core', title: 'CORE.', icon: <Info size={12} />, rows: coreRows }]
              : []),
            { id: 'organization', title: 'DEV.', icon: <Activity size={12} />, rows: organizationRows },
            { id: 'momentum', title: 'MOMENTUM.', icon: <Gauge size={12} />, rows: momentumRows },
            ...(showLlm ? [{ id: 'llm', title: 'LLM.', icon: <Bot size={12} />, rows: llmRows }] : []),
            {
              id: 'history',
              title: 'HISTORY.',
              icon: <GitCommit size={12} />,
              meta: `${historyInsights.totalRepositories} REPOS.`,
              rows: historyRows,
            },
            ...(resolvedUnpppId
              ? [{
                  id: 'automation',
                  title: 'AUTOMATION.',
                  icon: <Workflow size={12} />,
                  meta: workflowMetrics
                    ? `${workflowMetrics.active_count} ACTIVE. · ${workflowMetrics.passing_count} PASSING. · ${workflowMetrics.failing_count} FAILING.`
                    : undefined,
                  content: <UnpppWorkflowDisplay unpppId={resolvedUnpppId} />,
                }]
              : []),
            ...(resolvedRepoName
              ? [{
                  id: 'stories',
                  title: 'STORIES.',
                  icon: <BookOpen size={12} />,
                  content: <RepoStoriesTable repoName={resolvedRepoName} accent={colorValue} />,
                }]
              : []),
          ]}
        />
      </div>

      {/* Definition section - matches PageHeader pattern */}
      <div className="mt-8 flex items-baseline gap-4 py-2">
        <h2 className="whitespace-nowrap font-google-sans-code text-sm font-bold" style={{ color: 'var(--foreground)' }}>
          EFFORT (n)
        </h2>
        <p className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          THE MEASURE OF WORK REQUIRED TO TRANSFORM IDEAS INTO REALITY.
        </p>
      </div>

      {/* KPI definition + similar-unppps modal */}
      <KpiModal kpi={selectedKpi} comparisons={comparisons} onClose={() => setSelectedKpiId(null)} />
    </div>
  )
}

export default RepoStats

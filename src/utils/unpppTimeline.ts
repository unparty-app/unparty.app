// Client-safe — no server-only imports. Joins the org's timeline/relational
// data sources into one per-unppp shape for EffortVisualization's disco ball.
// Sibling to unpppPriority.ts (same static-JSON-import convention).

import unpppTimeData from '../../unppp-repo-time.json'
import costData from '../../unparty-polar-unppp-cost-estimate.json'
import repoMetadata from '../../public/raw-repo-metadata.json'
import unpppScores from '../../public/data/unppp-scores.json'
import coverColors from '../app/covers/cover-colors.json'
import UnpppsConfig from '../data/UnpppsConfig.json'
import UnpppTypesConfig from '../data/UnpppTypesConfig.json'
import { getUnpppPriorityData } from './unpppPriority'
import type { RepositoryMetadata } from '@/types/repository-metadata'

// ─── Source shapes (minimal — only the fields this module reads) ────────────

interface RepoTimeEntry {
  repo_id: string
  total_hours: number
  hours_budget?: number
  commit_count: number
  session_count: number
  contributor_count: number
  utilization_rate: number
  status: string
  date_range?: { first_commit: string; last_commit: string }
}

interface CostEntry {
  id: string
  name: string
  confidence: 'high' | 'low'
  total_hours: number
  price_breakdown: { polar_price: number }
}

interface ScoreEntry {
  id: string
  type?: string
  velocity_trend?: 'increasing' | 'decreasing' | 'stable'
  standards_score?: number
  commits_per_month?: number
}

interface RepoMetaEntry {
  name: string
  enhanced_metrics?: {
    commits_analysis?: { unique_authors?: number }
  }
}

interface UnpppConfigEntry {
  id: string
  name: string
  cover?: string
  color?: string
  tagline?: string
  description?: string
  debt?: number
  featured?: boolean
  votableFeature?: boolean
  startDate?: string
  storyTitle?: string
  storySubtitle?: string
  storyDescription?: string
}

// ─── Public types ─────────────────────────────────────────────────────────

export type UnpppType = 'app' | 'agent' | 'service' | 'assistant' | 'library' | 'framework' | 'tool' | 'bot'
export type VelocityTrend = 'increasing' | 'decreasing' | 'stable'

export interface ResolvedColors {
  baseColor: string
  /** Null means: derive an accent from baseColor (e.g. THREE.Color.offsetHSL) — this module has no `three` dependency. */
  accentColor: string | null
  source: 'cover' | 'config' | 'fallback'
}

export interface UnpppTimelineEntry {
  id: string
  displayName: string
  tagline: string
  description: string
  storyTitle: string
  storySubtitle: string
  storyDescription: string
  cover?: string
  configColor: string
  colors: ResolvedColors
  type: UnpppType | null
  debt: number
  featured: boolean
  confidence: 'high' | 'low'
  totalHours: number
  /** Allocated hours budget from unppp-repo-time.json — provenance display alongside totalHours. */
  hoursBudget: number
  commitCount: number
  sessionCount: number
  contributorCount: number
  utilizationRate: number
  polarPrice: number
  hoursShare: number
  commitsPerMonth: number | null
  velocityTrend: VelocityTrend | null
  standardsScore: number | null
  firstCommitMs: number | null
  lastCommitMs: number | null
  anchorTimeMs: number
  isPlaceholder: boolean
  priorityScore: number
  /** Rank by canonical priorityScore over the priced set; 0 = unranked (not in the cost estimate). */
  priorityRank: number
  /** Effort-independent priority (price/activity/velocity) — the demand axis effort is measured against. */
  demandScore: number
  /** Rank by demandScore over the priced set; 0 = unranked. */
  demandRank: number
  /** Rank by totalHours over the priced set; 0 = unranked. */
  supplyRank: number
  /** demandRank − supplyRank: positive = over-invested (effort outranks demand), negative = under-invested. 0 when unranked. */
  investmentDelta: number
  t: number
  /** Demand tier (0 = top/highest demand … NUM_DEMAND_TIERS-1; NUM_DEMAND_TIERS = bottom band for unranked/placeholders). */
  tierIndex: number
  phi: number
  theta: number
}

export interface OrgProvenance {
  totalCommits: number
  totalSessions: number
  totalHours: number
  totalHoursBudget: number
  /** YYYY-MM-DD of the repo-time analysis run — the "as of" for every measured number. */
  analysisDate: string
}

export interface OverlapEdge {
  aId: string
  bId: string
  overlapDays: number
  weight: number
}

// ─── Raw repo metadata (already bundled by the static import above) ────────

/** Same data as `/raw-repo-metadata.json` — exposed so consumers that need
 *  full per-repo records (e.g. EffortVisualization's hover detail) can read
 *  it from here instead of an extra runtime fetch of a file already in this
 *  module's chunk. */
export const RAW_REPO_METADATA = repoMetadata as unknown as RepositoryMetadata[]

// ─── Constants ────────────────────────────────────────────────────────────

/** The org's true first-repo date (src/app/theunpartyapp/repo-metadata-reference.md: "872 days since 2024-02-29"). */
export const ORG_EPOCH_MS = Date.parse('2024-02-29T00:00:00Z')

const TYPE_IDS = UnpppTypesConfig.types.map(t => t.id) as UnpppType[]
/** Latitude = demand: priced unppps split into quintiles of demandRank (tier 0 = top of ball = highest demand). */
export const NUM_DEMAND_TIERS = 5
const NUM_BANDS = NUM_DEMAND_TIERS + 1 // +1 = bottom band for unranked (unpriced) entries and placeholders
const MIN_THETA_GAP = (2 * Math.PI) / 60

/** Org-wide measurement provenance — the source citation for every effort number. */
export const ORG_PROVENANCE: OrgProvenance = {
  totalCommits: unpppTimeData.metadata.total_commits,
  totalSessions: unpppTimeData.metadata.total_sessions,
  totalHours: unpppTimeData.metadata.total_hours,
  totalHoursBudget: unpppTimeData.metadata.total_hours_budget,
  analysisDate: unpppTimeData.metadata.analysis_date.slice(0, 10),
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// ─── Color resolution ─────────────────────────────────────────────────────

function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function resolveUnpppColors(
  cover: string | undefined,
  configColor: string | undefined,
  fallbackHex: string
): ResolvedColors {
  const swatches = cover ? (coverColors as Record<string, string[]>)[cover] : undefined

  if (swatches && swatches.length > 1) {
    const base = swatches[0]
    const baseLum = hexLuminance(base)
    let accent = swatches[1]
    let maxDelta = -1
    for (const s of swatches.slice(1)) {
      const delta = Math.abs(hexLuminance(s) - baseLum)
      if (delta > maxDelta) {
        maxDelta = delta
        accent = s
      }
    }
    return { baseColor: base, accentColor: accent, source: 'cover' }
  }

  if (configColor) {
    return { baseColor: configColor, accentColor: null, source: 'config' }
  }

  return { baseColor: fallbackHex, accentColor: null, source: 'fallback' }
}

// ─── Main join ────────────────────────────────────────────────────────────

export function getUnpppTimelineData(): UnpppTimelineEntry[] {
  const timeByRepoId = new Map<string, RepoTimeEntry>(
    (unpppTimeData.repositories as RepoTimeEntry[]).map(r => [r.repo_id, r])
  )
  const metaByName = new Map<string, RepoMetaEntry>((repoMetadata as RepoMetaEntry[]).map(r => [r.name, r]))
  const scoreById = new Map<string, ScoreEntry>((unpppScores.scores as ScoreEntry[]).map(s => [s.id, s]))
  const priorityById = new Map(getUnpppPriorityData().map(p => [p.id, p]))
  const costEntries = costData.unppps as CostEntry[]

  const numBands = NUM_BANDS

  // Pass 1: everything except phi/theta (needs anchor times resolved first).
  const partial = (UnpppsConfig.unppps as UnpppConfigEntry[]).map(config => {
    const cost = costEntries.find(c => c.id === config.id)
    const time = timeByRepoId.get(config.id)
    const meta = metaByName.get(config.id)
    const score = scoreById.get(config.id)
    const priority = priorityById.get(config.id)

    const totalHours = time?.total_hours ?? cost?.total_hours ?? 0
    const confidence: 'high' | 'low' = cost?.confidence ?? (time ? 'high' : 'low')
    const isPlaceholder = confidence === 'low' && totalHours === 0

    const firstCommitMs = time?.date_range?.first_commit ? Date.parse(time.date_range.first_commit) : null
    const lastCommitMs = time?.date_range?.last_commit ? Date.parse(time.date_range.last_commit) : null
    const anchorTimeMs = firstCommitMs ?? (config.startDate ? Date.parse(config.startDate) : null) ?? ORG_EPOCH_MS

    const rawType = score?.type
    const type: UnpppType | null = rawType && (TYPE_IDS as string[]).includes(rawType) ? (rawType as UnpppType) : null

    const configColor = config.color ?? '#F9C22E'

    return {
      id: config.id,
      displayName: config.name,
      tagline: config.tagline ?? '',
      description: config.description ?? '',
      storyTitle: config.storyTitle ?? '',
      storySubtitle: config.storySubtitle ?? '',
      storyDescription: config.storyDescription ?? '',
      cover: config.cover,
      configColor,
      colors: resolveUnpppColors(config.cover, config.color, configColor),
      type,
      debt: config.debt ?? 0,
      featured: config.featured ?? false,
      confidence,
      totalHours,
      hoursBudget: time?.hours_budget ?? 0,
      commitCount: time?.commit_count ?? 0,
      sessionCount: time?.session_count ?? 0,
      contributorCount: time?.contributor_count ?? meta?.enhanced_metrics?.commits_analysis?.unique_authors ?? 0,
      utilizationRate: time?.utilization_rate ?? 0,
      polarPrice: cost?.price_breakdown.polar_price ?? 0,
      hoursShare: costData.summary.total_dev_hours > 0 ? totalHours / costData.summary.total_dev_hours : 0,
      commitsPerMonth: score?.commits_per_month ?? null,
      velocityTrend: score?.velocity_trend ?? null,
      standardsScore: score?.standards_score ?? null,
      firstCommitMs,
      lastCommitMs,
      anchorTimeMs,
      isPlaceholder,
      priorityScore: priority?.priorityScore ?? 0,
      demandScore: priority?.demandScore ?? 0,
      isPriced: priorityById.has(config.id),
    }
  })

  const spanEndCandidates = partial.map(e => e.lastCommitMs ?? 0).filter(v => v > 0)
  const orgSpanEndMs = spanEndCandidates.length > 0 ? Math.max(...spanEndCandidates) : ORG_EPOCH_MS + 1

  // Pass 2: t per entry, then ranks over the priced set (matches RepoStats'
  // "rank #X of {priced}" denominator — placeholders/unpriced stay unranked at 0).
  const withT = partial.map(e => ({
    ...e,
    t: clamp((e.anchorTimeMs - ORG_EPOCH_MS) / (orgSpanEndMs - ORG_EPOCH_MS), 0, 1),
  }))

  const priced = withT.filter(e => e.isPriced)
  const pricedCount = priced.length
  const rankBy = (get: (e: (typeof withT)[number]) => number) =>
    new Map(
      [...priced]
        .sort((a, b) => get(b) - get(a) || a.id.localeCompare(b.id))
        .map((e, i) => [e.id, i + 1])
    )
  const priorityRankById = rankBy(e => e.priorityScore)
  const demandRankById = rankBy(e => e.demandScore)
  const supplyRankById = rankBy(e => e.totalHours)

  // Latitude: quintiles of demandRank (tier 0 = top = highest demand);
  // unranked entries and placeholders sit in the extra bottom band.
  const tierFor = (e: (typeof withT)[number]): number => {
    const demandRank = demandRankById.get(e.id)
    if (!demandRank || e.isPlaceholder || pricedCount === 0) return NUM_DEMAND_TIERS
    return Math.min(NUM_DEMAND_TIERS - 1, Math.floor(((demandRank - 1) * NUM_DEMAND_TIERS) / pricedCount))
  }
  const tierById = new Map(withT.map(e => [e.id, tierFor(e)]))

  // Deterministic theta collision pass within each tier band.
  const byTier = new Map<number, (typeof withT)[number][]>()
  withT.forEach(e => {
    const tier = tierById.get(e.id)!
    const bucket = byTier.get(tier) ?? []
    bucket.push(e)
    byTier.set(tier, bucket)
  })

  const thetaById = new Map<string, number>()
  byTier.forEach(bucket => {
    bucket.sort((a, b) => a.anchorTimeMs - b.anchorTimeMs)
    let prevTheta = -Infinity
    bucket.forEach(e => {
      let theta = e.t * 2 * Math.PI
      if (theta - prevTheta < MIN_THETA_GAP) {
        theta = prevTheta + MIN_THETA_GAP
      }
      thetaById.set(e.id, theta)
      prevTheta = theta
    })
  })

  return withT.map(({ isPriced: _isPriced, ...e }) => {
    const demandRank = demandRankById.get(e.id) ?? 0
    const supplyRank = supplyRankById.get(e.id) ?? 0
    const tierIndex = tierById.get(e.id)!
    return {
      ...e,
      priorityRank: priorityRankById.get(e.id) ?? 0,
      demandRank,
      supplyRank,
      investmentDelta: demandRank > 0 && supplyRank > 0 ? demandRank - supplyRank : 0,
      tierIndex,
      theta: thetaById.get(e.id) ?? e.t * 2 * Math.PI,
      phi: ((tierIndex + 0.5) / numBands) * Math.PI,
    }
  })
}

// ─── Temporal overlap edges ─────────────────────────────────────────────────

export function computeTemporalOverlaps(
  entries: UnpppTimelineEntry[],
  opts?: { minOverlapDays?: number; topKPerNode?: number }
): OverlapEdge[] {
  const minOverlapDays = opts?.minOverlapDays ?? 14
  const topK = opts?.topKPerNode ?? 3
  const timed = entries.filter(e => e.firstCommitMs !== null && e.lastCommitMs !== null && !e.isPlaceholder)

  const candidatesByNode = new Map<string, OverlapEdge[]>()

  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i]
      const b = timed[j]
      const overlapStart = Math.max(a.firstCommitMs!, b.firstCommitMs!)
      const overlapEnd = Math.min(a.lastCommitMs!, b.lastCommitMs!)
      if (overlapEnd <= overlapStart) continue
      const overlapDays = (overlapEnd - overlapStart) / 86_400_000
      if (overlapDays < minOverlapDays) continue

      const edge: OverlapEdge = { aId: a.id, bId: b.id, overlapDays, weight: 0 }
      candidatesByNode.set(a.id, [...(candidatesByNode.get(a.id) ?? []), edge])
      candidatesByNode.set(b.id, [...(candidatesByNode.get(b.id) ?? []), edge])
    }
  }

  const kept = new Map<string, OverlapEdge>()
  candidatesByNode.forEach(edges => {
    const top = [...edges].sort((x, y) => y.overlapDays - x.overlapDays).slice(0, topK)
    top.forEach(edge => {
      const key = [edge.aId, edge.bId].sort().join('|')
      kept.set(key, edge)
    })
  })

  const result = [...kept.values()]
  const maxOverlap = result.reduce((max, e) => Math.max(max, e.overlapDays), 0)
  return result.map(e => ({ ...e, weight: maxOverlap > 0 ? e.overlapDays / maxOverlap : 0 }))
}

export { UnpppTypesConfig }

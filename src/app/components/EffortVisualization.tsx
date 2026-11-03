'use client'

import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line, Environment } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useTheme } from '../contexts/ThemeContext'
import type { RepositoryMetadata } from '@/types/repository-metadata'
import { getUnpppForRepoName } from '@/utils/unppp-repo-mapping'
import {
  getUnpppTimelineData,
  computeTemporalOverlaps,
  ORG_EPOCH_MS,
  ORG_PROVENANCE,
  RAW_REPO_METADATA,
} from '@/utils/unpppTimeline'
import type { UnpppTimelineEntry, OverlapEdge } from '@/utils/unpppTimeline'
import { getKpiConfig } from './KpiTile'
import type { KpiConfig } from './KpiTile'
import Badge from './Badge'

// ============================================================================
// INTERFACES
// ============================================================================

interface EffortVisualizationProps {
  /** Unppp ID to filter to specific repo */
  unpppId?: string
  /** Direct repository name (legacy support) */
  repoName?: string
  /** Filter to a set of repos (e.g., a founders category). Pass a memoized array. */
  repoNames?: string[]
  /** Pre-loaded metadata; when provided, skips the internal fetch */
  data?: RepositoryMetadata[]
  /** Container height */
  height?: string
  /** KPI lens active on mount (facet size measure). Default 'hours'. */
  defaultLens?: LensId
  /** Animation speed multiplier (0 = static) */
  rotationSpeed?: number
  /** Enable orbit controls */
  enableControls?: boolean
  /** Additional CSS classes */
  className?: string
}

interface FacetVisual {
  entry: UnpppTimelineEntry
  size: number
  color: string
  opacity: number
  interactive: boolean
  /** investmentDelta ring style; null = aligned/unranked (no ring) */
  deltaStyle: { color: string; opacity: number } | null
}

// ============================================================================
// DELTA RING — diverging encoding for effort-vs-demand mismatch.
// Endpoints are the dataviz-skill diverging pair (blue↔red), six-checks
// validated against this app's surfaces (#ededed light / #0A0A0A dark):
// CVD ΔE 21.6 light / 19.2 dark, contrast ≥ 3:1 both modes. Sign is also
// carried redundantly by latitude mismatch and HUD text, never color alone.
// ============================================================================

/** |investmentDelta| ≤ this many ranks counts as aligned — no ring. */
const DELTA_ALIGNED_THRESHOLD = 2

const DELTA_COLORS = {
  light: { over: '#2a78d6', under: '#e34948' },
  dark: { over: '#3987e5', under: '#e66767' },
}

function getDeltaStyle(
  entry: UnpppTimelineEntry,
  maxAbsDelta: number,
  dark: boolean
): FacetVisual['deltaStyle'] {
  const delta = entry.investmentDelta
  if (entry.isPlaceholder || entry.demandRank === 0 || Math.abs(delta) <= DELTA_ALIGNED_THRESHOLD) return null
  const pole = DELTA_COLORS[dark ? 'dark' : 'light']
  return {
    color: delta > 0 ? pole.over : pole.under,
    opacity: 0.35 + 0.65 * clamp(Math.abs(delta) / Math.max(1, maxAbsDelta), 0, 1),
  }
}

function deltaLabel(delta: number): string {
  if (delta > DELTA_ALIGNED_THRESHOLD) return `+${delta} over-invested`
  if (delta < -DELTA_ALIGNED_THRESHOLD) return `${delta} under-invested`
  return 'aligned'
}

function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () =>
      setDark(root.classList.contains('dark') || (!root.classList.contains('light') && media.matches))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    media.addEventListener('change', update)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', update)
    }
  }, [])
  return dark
}

// ============================================================================
// HELPERS
// ============================================================================

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const shadeByRecency = (hex: string, recency: number): string => {
  const color = new THREE.Color(hex)
  color.multiplyScalar(0.7 + recency * 0.3)
  return '#' + color.getHexString()
}

/** AI-attributed commits for a repo — max of the two overlapping signals, conservative. */
const aiCommitsFor = (repo: RepositoryMetadata): number => {
  const ca = repo.enhanced_metrics?.commits_analysis
  return Math.max(ca?.ai_coauthor_commits ?? 0, ca?.claude_commits ?? 0)
}

function aiRatioFor(entry: UnpppTimelineEntry, repoMetaByName: Map<string, RepositoryMetadata>): number {
  const repo = repoMetaByName.get(entry.id)
  const ca = repo?.enhanced_metrics?.commits_analysis
  if (!ca || !ca.total_recent_commits) return 0
  return clamp(aiCommitsFor(repo!) / ca.total_recent_commits, 0, 1)
}

function sizeFromValue(value: number, max: number): number {
  if (value <= 0) return 0.15
  return clamp(0.15 + (Math.log10(value + 1) / Math.log10(max + 1)) * 0.55, 0.15, 0.7)
}

const recencyOf = (entry: UnpppTimelineEntry): number => {
  const daysSincePush = entry.lastCommitMs ? (Date.now() - entry.lastCommitMs) / 86_400_000 : 999
  return clamp(1 - daysSincePush / 180, 0, 1)
}

// ============================================================================
// KPI LENSES — each lens is a facet-size measure wearing its KPI's color/label/
// definition from unparty-kpi.json (the same vocabulary as RepoStats tiles).
// KPI color owns chrome only (chips, citation, HUD labels); facets keep their
// unppp identity color.
// ============================================================================

type LensId = 'hours' | 'value' | 'commits' | 'builders' | 'ai' | 'health' | 'active'

interface LensContext {
  maxHours: number
  maxPrice: number
  maxCommits: number
  maxContributors: number
  repoMetaByName: Map<string, RepositoryMetadata>
}

interface LensDef {
  id: LensId
  kpi: KpiConfig
  size: (entry: UnpppTimelineEntry, ctx: LensContext) => number
  readout: (entry: UnpppTimelineEntry, ctx: LensContext) => string
  /** Raw metric — ranks the target against every other unppp on this measure. */
  value: (entry: UnpppTimelineEntry, ctx: LensContext) => number
}

/** Lenses whose metric sums meaningfully across the org — these get a "% of org" share readout. */
const ADDITIVE_LENSES: ReadonlySet<LensId> = new Set(['hours', 'value', 'commits', 'builders'])

const lensKpi = (id: string): KpiConfig =>
  getKpiConfig(id) ?? { id, label: `${id.toUpperCase()}.`, metricLabel: `${id.toUpperCase()}.`, color: '#F9C22E', definition: '' }

const LENSES: LensDef[] = [
  {
    id: 'hours',
    kpi: lensKpi('hours'),
    size: (e, ctx) => sizeFromValue(e.totalHours, ctx.maxHours),
    readout: e => `${e.totalHours.toFixed(0)}h measured`,
    value: e => e.totalHours,
  },
  {
    id: 'value',
    kpi: lensKpi('value'),
    size: (e, ctx) => sizeFromValue(e.polarPrice, ctx.maxPrice),
    readout: e => formatMoney(e.polarPrice),
    value: e => e.polarPrice,
  },
  {
    id: 'commits',
    kpi: lensKpi('commits'),
    size: (e, ctx) => sizeFromValue(e.commitCount, ctx.maxCommits),
    readout: e => `${e.commitCount} commits`,
    value: e => e.commitCount,
  },
  {
    id: 'builders',
    kpi: lensKpi('builders'),
    size: (e, ctx) => sizeFromValue(e.contributorCount, ctx.maxContributors),
    readout: e => `${e.contributorCount} builders`,
    value: e => e.contributorCount,
  },
  {
    id: 'ai',
    kpi: lensKpi('ai'),
    size: (e, ctx) => clamp(0.15 + aiRatioFor(e, ctx.repoMetaByName) * 0.55, 0.15, 0.7),
    readout: (e, ctx) => `${Math.round(aiRatioFor(e, ctx.repoMetaByName) * 100)}% AI-assisted`,
    value: (e, ctx) => aiRatioFor(e, ctx.repoMetaByName),
  },
  {
    id: 'health',
    kpi: lensKpi('health'),
    size: e => clamp(0.15 + (e.standardsScore ?? 0) * 0.55, 0.15, 0.7),
    readout: e => (e.standardsScore != null ? `${Math.round(e.standardsScore * 100)}% standards` : 'unscored'),
    value: e => e.standardsScore ?? 0,
  },
  {
    id: 'active',
    kpi: lensKpi('active'),
    size: e => 0.15 + recencyOf(e) * 0.55,
    readout: e =>
      e.lastCommitMs ? `${Math.max(0, Math.round((Date.now() - e.lastCommitMs) / 86_400_000))}d since push` : 'no push data',
    value: e => recencyOf(e),
  },
]

interface MetricLine {
  label: string
  detail: string
}

/** Per-repo detail lines for the HUD secondary readout — trimmed from the original six effort metrics. */
function getRepoMetricLines(repo: RepositoryMetadata): MetricLine[] {
  const lines: MetricLine[] = []
  const ca = repo.enhanced_metrics?.commits_analysis
  const tbc = repo.enhanced_metrics?.time_bounded_commits
  const wf = repo.workflow_metrics
  const analyzed = ca?.total_recent_commits ?? 0
  const ai = aiCommitsFor(repo)
  const human = Math.max(0, analyzed - ai)

  if (human > 0) lines.push({ label: 'HUMAN', detail: `${human} human-authored of ${analyzed} analyzed` })
  if (ai > 0) lines.push({ label: 'AI', detail: `${ca?.ai_coauthor_commits ?? 0} co-authored · ${ca?.claude_commits ?? 0} claude` })
  const releases = repo.enhanced_metrics?.releases_count ?? 0
  if (releases > 0) lines.push({ label: 'SHIPPED', detail: `${releases} releases` })
  const commits30d = tbc?.commits_last_30_days ?? 0
  if (commits30d > 0)
    lines.push({ label: 'MOMENTUM', detail: `${commits30d} commits/30d · ${(tbc?.sprint_velocity_daily ?? 0).toFixed(1)}/day` })
  if ((wf?.active_count ?? 0) > 0) lines.push({ label: 'AUTOMATION', detail: `${wf?.active_count} active CI · ${wf?.passing_count} passing` })
  const languages = repo.enhanced_metrics?.languages_count ?? 0
  if (languages > 0) lines.push({ label: 'SCOPE', detail: `${languages} langs · primary ${repo.language || 'unknown'}` })

  return lines
}

function formatDate(ms: number | null): string {
  if (!ms) return '—'
  return new Date(ms).toISOString().slice(0, 10)
}

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

// ============================================================================
// SPHERICAL GEOMETRY — shared radii
// ============================================================================

const BASE_RADIUS = 2.5
const SKIN_RADIUS = 2.85
const FACET_RADIUS = SKIN_RADIUS + 0.2
const FACET_TARGET_OFFSET = 0.35

function sphericalToVector3(phi: number, theta: number, radius: number): THREE.Vector3 {
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// ============================================================================
// SKIN LAYER — the literal disco-ball mirror-tile texture, chrome only
// ============================================================================

const SKIN_ROWS = 14
const SKIN_COLS = 28

function SkinLayer({ color }: { color: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const count = SKIN_ROWS * SKIN_COLS

  useEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    let i = 0
    for (let r = 0; r < SKIN_ROWS; r++) {
      const phi = ((r + 0.5) / SKIN_ROWS) * Math.PI
      for (let c = 0; c < SKIN_COLS; c++) {
        const theta = (2 * Math.PI * c) / SKIN_COLS
        const pos = sphericalToVector3(phi, theta, SKIN_RADIUS)
        dummy.position.copy(pos)
        dummy.lookAt(0, 0, 0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        i++
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial color={color} metalness={1} roughness={0.1} />
    </instancedMesh>
  )
}

// ============================================================================
// IDENTITY FACET — one per unppp
// ============================================================================

interface IdentityFacetProps {
  visual: FacetVisual
  isTarget: boolean
  hasTargets: boolean
  dimmed: boolean
  hovered: boolean
  seed: number
  onHover: (id: string | null) => void
  onClick: (id: string) => void
  geometry: THREE.SphereGeometry
  ringGeometry: THREE.TorusGeometry
}

function IdentityFacet({ visual, isTarget, hasTargets, dimmed, hovered, seed, onHover, onClick, geometry, ringGeometry }: IdentityFacetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { entry, size, color, opacity, deltaStyle } = visual

  const position = useMemo(() => {
    const radius = FACET_RADIUS + (isTarget && hasTargets ? FACET_TARGET_OFFSET : 0)
    return sphericalToVector3(entry.phi, entry.theta, radius)
  }, [entry.phi, entry.theta, isTarget, hasTargets])

  // Orient the delta ring's plane perpendicular to the radial direction so it
  // reads as a halo around the facet from outside the ball.
  const ringQuaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize()),
    [position]
  )

  useFrame(state => {
    if (!meshRef.current) return
    const pulse = Math.sin(state.clock.elapsedTime * 1.4 + seed) * 0.04 + 0.96
    const hoverScale = hovered ? 1.35 : 1
    meshRef.current.scale.setScalar(size * pulse * hoverScale)
  })

  const finalOpacity = dimmed ? Math.min(opacity, 0.15) : opacity
  const isDim = dimmed || finalOpacity < 1

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      onPointerOver={visual.interactive ? () => onHover(entry.id) : undefined}
      onPointerOut={visual.interactive ? () => onHover(null) : undefined}
      onClick={visual.interactive ? () => onClick(entry.id) : undefined}
    >
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.4}
        transparent={isDim}
        opacity={finalOpacity}
        emissive={isDim ? '#000000' : color}
        emissiveIntensity={isDim ? 0 : hovered ? 0.6 : 0.25}
      />
      {deltaStyle && !dimmed && (
        <mesh geometry={ringGeometry} quaternion={ringQuaternion}>
          <meshBasicMaterial color={deltaStyle.color} transparent opacity={deltaStyle.opacity} />
        </mesh>
      )}
    </mesh>
  )
}

// ============================================================================
// OVERLAP EDGES — "built together" relationship lines
// ============================================================================

function OverlapEdges({
  edges,
  positions,
  themeColor,
  selectedId,
}: {
  edges: OverlapEdge[]
  positions: Map<string, THREE.Vector3>
  themeColor: string
  selectedId: string | null
}) {
  // Ambient edges were noise at legible counts — only the selected facet's
  // "built together" links render, at opacities that actually read.
  if (!selectedId) return null
  return (
    <>
      {edges.map(edge => {
        if (edge.aId !== selectedId && edge.bId !== selectedId) return null
        const a = positions.get(edge.aId)
        const b = positions.get(edge.bId)
        if (!a || !b) return null
        const opacity = edge.weight > 0.66 ? 0.55 : edge.weight > 0.33 ? 0.4 : 0.28
        return (
          <Line
            key={`${edge.aId}|${edge.bId}`}
            points={[
              [a.x, a.y, a.z],
              [b.x, b.y, b.z],
            ]}
            color={themeColor}
            lineWidth={1}
            transparent
            opacity={opacity}
          />
        )
      })}
    </>
  )
}

// ============================================================================
// CAMERA FOCUS — nudges OrbitControls' target toward a highlighted facet
// ============================================================================

function CameraFocus({ target, controlsRef }: { target: THREE.Vector3 | null; controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  useFrame((_state, delta) => {
    if (!target || !controlsRef.current) return
    controlsRef.current.target.lerp(target, Math.min(1, delta * 1.5))
    controlsRef.current.update()
  })
  return null
}

// ============================================================================
// LIGHTS
// ============================================================================

function Lights({ color }: { color: string }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} color={color} castShadow />
      <spotLight position={[-10, 10, 10]} angle={0.3} penumbra={1} intensity={1.5} color={color} />
      <spotLight position={[0, -10, 0]} angle={0.4} penumbra={1} intensity={1} color="#ffffff" />
    </>
  )
}

// ============================================================================
// BALL — the rotating group: skin + facets + edges + core sphere
// ============================================================================

interface BallProps {
  facetVisuals: FacetVisual[]
  edges: OverlapEdge[]
  positions: Map<string, THREE.Vector3>
  rotationSpeed: number
  themeColor: string
  skinColor: string
  targetIds: Set<string>
  selectedId: string | null
  hoveredId: string | null
  onHover: (id: string | null) => void
  onClick: (id: string) => void
}

function Ball({
  facetVisuals,
  edges,
  positions,
  rotationSpeed,
  themeColor,
  skinColor,
  targetIds,
  selectedId,
  hoveredId,
  onHover,
  onClick,
}: BallProps) {
  const groupRef = useRef<THREE.Group>(null)
  const facetGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), [])
  useEffect(() => () => facetGeometry.dispose(), [facetGeometry])
  // Delta ring shared by every facet: radius 1.3× the unit facet sphere (0.5),
  // thin tube — scales with the facet via parent-mesh scale.
  const ringGeometry = useMemo(() => new THREE.TorusGeometry(0.65, 0.05, 8, 32), [])
  useEffect(() => () => ringGeometry.dispose(), [ringGeometry])
  const hasTargets = targetIds.size > 0

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[BASE_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={themeColor}
          transparent
          opacity={0.9}
          emissive={themeColor}
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      <SkinLayer color={skinColor} />

      <OverlapEdges edges={edges} positions={positions} themeColor={themeColor} selectedId={selectedId} />

      {facetVisuals.map((visual, i) => {
        const isTarget = hasTargets && targetIds.has(visual.entry.id)
        const dimmed = hasTargets && !isTarget
        return (
          <IdentityFacet
            key={visual.entry.id}
            visual={visual}
            isTarget={isTarget}
            hasTargets={hasTargets}
            dimmed={dimmed}
            hovered={hoveredId === visual.entry.id}
            seed={i * 0.7}
            onHover={onHover}
            onClick={onClick}
            geometry={facetGeometry}
            ringGeometry={ringGeometry}
          />
        )
      })}
    </group>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EffortVisualization({
  unpppId,
  repoName,
  repoNames,
  data: providedData,
  height = '500px',
  defaultLens = 'hours',
  rotationSpeed = 0.2,
  enableControls = true,
  className = '',
}: EffortVisualizationProps) {
  const { colorValue } = useTheme()
  const dark = useIsDarkMode()

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [lensId, setLensId] = useState<LensId>(defaultLens)
  const [selectedUnppp, setSelectedUnppp] = useState<string | null>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  // A lost WebGL context (GPU driver reset, tab backgrounding, too many
  // contexts on a long scroll page) never recovers on its own — bumping this
  // key forces R3F to tear down and recreate the Canvas/context from scratch.
  const [canvasEpoch, setCanvasEpoch] = useState(0)

  // Timeline/identity data is statically bundled (see unpppTimeline.ts) — always
  // available immediately.
  const timelineData = useMemo(() => getUnpppTimelineData(), [])
  const entryById = useMemo(() => new Map(timelineData.map(e => [e.id, e])), [timelineData])
  const edges = useMemo(() => computeTemporalOverlaps(timelineData), [timelineData])

  const positions = useMemo(() => {
    const map = new Map<string, THREE.Vector3>()
    timelineData.forEach(e => map.set(e.id, sphericalToVector3(e.phi, e.theta, FACET_RADIUS)))
    return map
  }, [timelineData])

  const orgSpanEndMs = useMemo(() => {
    const vals = timelineData.map(e => e.lastCommitMs ?? 0).filter(v => v > 0)
    return vals.length ? Math.max(...vals) : ORG_EPOCH_MS + 1
  }, [timelineData])

  // repoData is a progressive enhancement — HUD/story secondary stats and the
  // collaboration-mode AI tint only. The ball itself never waits on this.
  // RAW_REPO_METADATA is already bundled into this chunk via unpppTimeline's
  // static import, so no fetch is needed unless a caller passes its own data.
  const repoData = useMemo(() => providedData ?? RAW_REPO_METADATA, [providedData])

  const repoMetaByName = useMemo(() => new Map(repoData.map(r => [r.name, r])), [repoData])

  const lensCtx: LensContext = useMemo(
    () => ({
      maxHours: Math.max(1, ...timelineData.map(e => e.totalHours)),
      maxPrice: Math.max(1, ...timelineData.map(e => e.polarPrice)),
      maxCommits: Math.max(1, ...timelineData.map(e => e.commitCount)),
      maxContributors: Math.max(1, ...timelineData.map(e => e.contributorCount)),
      repoMetaByName,
    }),
    [timelineData, repoMetaByName]
  )

  const activeLens = useMemo(() => LENSES.find(l => l.id === lensId) ?? LENSES[0], [lensId])
  const pricedCount = useMemo(() => timelineData.filter(e => e.priorityRank > 0).length, [timelineData])
  const maxAbsDelta = useMemo(
    () => Math.max(1, ...timelineData.map(e => Math.abs(e.investmentDelta))),
    [timelineData]
  )

  const facetVisuals: FacetVisual[] = useMemo(() => {
    return timelineData.map(entry => {
      if (entry.isPlaceholder) {
        return { entry, size: 0.12, color: dark ? '#4a4a48' : '#b0aea6', opacity: 0.2, interactive: false, deltaStyle: null }
      }
      const size = activeLens.size(entry, lensCtx)
      const color = shadeByRecency(entry.colors.baseColor, recencyOf(entry))
      // Low measurement confidence reads as a dimmer facet (the existing
      // opacity<1 dim path) — trust is visible, not swallowed.
      const opacity = entry.confidence === 'low' ? 0.55 : 1
      return { entry, size, color, opacity, interactive: true, deltaStyle: getDeltaStyle(entry, maxAbsDelta, dark) }
    })
  }, [timelineData, activeLens, lensCtx, maxAbsDelta, dark])

  // Resolve which unppp(s) the unpppId/repoName/repoNames props target.
  const targetIds = useMemo(() => {
    const ids = new Set<string>()
    if (unpppId) ids.add(unpppId)
    if (repoName) {
      const cfg = getUnpppForRepoName(repoName)
      if (cfg) ids.add(cfg.id)
    }
    if (repoNames && repoNames.length > 0) {
      repoNames.forEach(rn => {
        const cfg = getUnpppForRepoName(rn)
        if (cfg) ids.add(cfg.id)
      })
    }
    return ids
  }, [unpppId, repoName, repoNames])

  const singleTargetId = useMemo(() => {
    if (unpppId && targetIds.has(unpppId)) return unpppId
    if (repoName) {
      const cfg = getUnpppForRepoName(repoName)
      if (cfg) return cfg.id
    }
    return null
  }, [unpppId, repoName, targetIds])

  // Select the page's own unppp whenever it changes (adjusting state during
  // render on a prop change rather than in an effect)
  const [selectionTarget, setSelectionTarget] = useState<string | null>(null)
  if (selectionTarget !== singleTargetId) {
    setSelectionTarget(singleTargetId)
    if (singleTargetId) setSelectedUnppp(singleTargetId)
  }

  const focusTarget = singleTargetId ? positions.get(singleTargetId) ?? null : null

  // Single-target comparison: the whole point of a per-unppp page is THIS
  // unppp against the org, so rank it on every lens and share it on the
  // additive ones. Without this, every unppp page renders the same ball.
  const targetEntry = singleTargetId ? entryById.get(singleTargetId) ?? null : null
  const comparable = useMemo(() => timelineData.filter(e => !e.isPlaceholder), [timelineData])
  const targetLensRanks = useMemo(() => {
    if (!targetEntry || targetEntry.isPlaceholder) return null
    const ranks = new Map<LensId, number>()
    for (const lens of LENSES) {
      const sorted = [...comparable].sort(
        (a, b) => lens.value(b, lensCtx) - lens.value(a, lensCtx) || a.id.localeCompare(b.id)
      )
      const idx = sorted.findIndex(e => e.id === targetEntry.id)
      if (idx >= 0) ranks.set(lens.id, idx + 1)
    }
    return ranks
  }, [targetEntry, comparable, lensCtx])
  const targetOrgShare = useMemo(() => {
    if (!targetEntry || !ADDITIVE_LENSES.has(activeLens.id)) return null
    const total = comparable.reduce((sum, e) => sum + activeLens.value(e, lensCtx), 0)
    if (total <= 0) return null
    return Math.round((activeLens.value(targetEntry, lensCtx) / total) * 1000) / 10
  }, [targetEntry, comparable, activeLens, lensCtx])

  const hoveredEntry = hoveredId ? entryById.get(hoveredId) ?? null : null
  const hoveredRepo = hoveredId ? repoMetaByName.get(hoveredId) ?? null : null
  const selectedEntry = selectedUnppp ? entryById.get(selectedUnppp) ?? null : null

  const footerNote = useMemo(() => {
    if (selectedEntry) {
      const overlapCount = edges.filter(e => e.aId === selectedEntry.id || e.bId === selectedEntry.id).length
      const alignment =
        selectedEntry.demandRank > 0
          ? `SUPPLY #${selectedEntry.supplyRank} VS DEMAND #${selectedEntry.demandRank} (${deltaLabel(selectedEntry.investmentDelta).toUpperCase()}) · `
          : ''
      return `${selectedEntry.displayName.toUpperCase()} — ${alignment}${selectedEntry.totalHours.toFixed(0)}H · ${selectedEntry.commitCount} COMMITS · PRIORITY #${selectedEntry.priorityRank || '—'} OF ${pricedCount} · ${overlapCount} CONCURRENT-BUILD LINKS.`
    }
    const real = timelineData.filter(e => !e.isPlaceholder)
    const months = Math.max(1, Math.round((orgSpanEndMs - ORG_EPOCH_MS) / (1000 * 60 * 60 * 24 * 30.44)))
    return `${months} MONTHS. ${real.length} UNPPPS. ${Math.round(ORG_PROVENANCE.totalHours).toLocaleString('en-US')}H MEASURED OF ${ORG_PROVENANCE.totalHoursBudget.toLocaleString('en-US')}H BUDGETED. LATITUDE = DEMAND TIER (TOP = HIGHEST). ROTATION = WHEN IT STARTED. SIZE = ${activeLens.kpi.metricLabel} RING = EFFORT VS DEMAND MISMATCH.`
  }, [selectedEntry, timelineData, edges, orgSpanEndMs, pricedCount, activeLens])

  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8" style={{ height }}>
        <div className="font-google-sans-code">no unppp timeline data found here. hold your complaint, we will get to it.</div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Target-vs-org standing — Banner-style byline row (avatar dot · name ·
          lens pill · readout · spacer · standing), not a floating overlay. */}
      {targetEntry && targetLensRanks && (
        <div className="w-full border-b border-black/[0.09] dark:border-white/[0.09]">
          <div className="flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full border-2"
              style={{ borderColor: targetEntry.colors.baseColor, backgroundColor: 'var(--background)' }}
            >
              <div className="size-3 rounded-full" style={{ backgroundColor: targetEntry.colors.baseColor }} />
            </div>

            <span
              className="min-w-0 shrink truncate font-vt323 text-base font-bold leading-none tracking-tight sm:text-lg"
              style={{ color: targetEntry.colors.baseColor }}
            >
              {targetEntry.displayName}
            </span>

            <span
              className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 font-vt323 text-xs font-bold uppercase tracking-wide"
              style={{
                backgroundColor: `${activeLens.kpi.color}20`,
                borderColor: `${activeLens.kpi.color}40`,
                color: activeLens.kpi.color,
              }}
            >
              {activeLens.kpi.metricLabel}
            </span>

            <span className="hidden min-w-0 shrink truncate font-google-sans-code text-xs md:block" style={{ color: 'var(--text-muted)' }}>
              {activeLens.readout(targetEntry, lensCtx)}
            </span>

            <div className="flex-1" />

            <span className="shrink-0 font-vt323 text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
              #{targetLensRanks.get(activeLens.id) ?? '—'} of {comparable.length}
              {targetOrgShare != null && (
                <span style={{ color: 'var(--text-muted)' }}> · {targetOrgShare}% of org</span>
              )}
            </span>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-xl" style={{ height }}>
        <Canvas
          key={canvasEpoch}
          camera={{ position: [0, 0, 10], fov: 50 }}
          dpr={[1, 1.75]}
          onCreated={({ gl }) => {
            const el = gl.domElement
            const handleLost = (e: Event) => {
              e.preventDefault()
              console.warn('EffortVisualization: WebGL context lost, remounting canvas')
              setCanvasEpoch(v => v + 1)
            }
            el.addEventListener('webglcontextlost', handleLost, { once: true })
          }}
        >
          <Lights color={colorValue} />
          <Ball
            facetVisuals={facetVisuals}
            edges={edges}
            positions={positions}
            rotationSpeed={rotationSpeed}
            themeColor={colorValue}
            skinColor={dark ? '#2a2a28' : '#d8d6cd'}
            targetIds={targetIds}
            selectedId={selectedUnppp}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onClick={id => setSelectedUnppp(prev => (prev === id ? null : id))}
          />
          <CameraFocus target={focusTarget} controlsRef={controlsRef} />
          <Environment preset="night" />

          {enableControls && (
            <OrbitControls
              ref={controlsRef}
              enableZoom={true}
              enablePan={true}
              minDistance={5}
              maxDistance={15}
              autoRotate={true}
              autoRotateSpeed={0.5}
            />
          )}
        </Canvas>

        {hoveredEntry && (
          <div
            className="pointer-events-none absolute bottom-4 left-4 max-w-xs rounded-lg border px-4 py-3 backdrop-blur-sm"
            style={{ backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)', borderColor: `${colorValue}66` }}
          >
            <div className="mb-1 flex items-center gap-2">
              <div className="size-2 shrink-0 rounded-full" style={{ backgroundColor: hoveredEntry.colors.baseColor }} />
              <span className="font-google-sans-code text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--foreground)' }}>
                {hoveredEntry.displayName}
              </span>
              {hoveredEntry.type && (
                <span className="font-google-sans-code text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  {hoveredEntry.type}
                </span>
              )}
            </div>
            <div className="font-vt323 text-base" style={{ color: 'var(--foreground)' }}>
              {hoveredEntry.tagline || hoveredEntry.description}
            </div>
            <div className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
              {hoveredEntry.totalHours.toFixed(0)}h · {hoveredEntry.commitCount} commits · {formatDate(hoveredEntry.firstCommitMs)}→{formatDate(hoveredEntry.lastCommitMs)}
            </div>
            <div className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
              {formatMoney(hoveredEntry.polarPrice)} debt
              {hoveredEntry.priorityRank > 0 && ` · priority #${hoveredEntry.priorityRank} of ${pricedCount}`}
              {hoveredEntry.confidence === 'low' && ' · low confidence'}
            </div>
            {hoveredEntry.demandRank > 0 && (
              <div className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                demand #{hoveredEntry.demandRank} · supply #{hoveredEntry.supplyRank} · {deltaLabel(hoveredEntry.investmentDelta)}
              </div>
            )}
            <div className="font-vt323 text-sm">
              <span style={{ color: activeLens.kpi.color }}>{activeLens.kpi.metricLabel}</span>{' '}
              <span style={{ color: 'var(--foreground)' }}>{activeLens.readout(hoveredEntry, lensCtx)}</span>
            </div>
            {hoveredRepo &&
              getRepoMetricLines(hoveredRepo)
                .slice(0, 2)
                .map(line => (
                  <div key={line.label} className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {line.label}: {line.detail}
                  </div>
                ))}
          </div>
        )}

        {selectedEntry && (
          <div
            className="absolute bottom-0 left-0 right-0 animate-in fade-in slide-in-from-bottom-4 duration-200 vh-card-elevated rounded-b-xl border-t p-5"
            style={{ backgroundColor: 'var(--background)', borderColor: `${selectedEntry.colors.baseColor}40` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="size-2 shrink-0 rounded-full" style={{ backgroundColor: selectedEntry.colors.baseColor }} />
                  <span className="font-google-sans-code text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--foreground)' }}>
                    {selectedEntry.displayName}
                  </span>
                </div>
                <div className="font-vt323 text-4xl" style={{ color: 'var(--foreground)' }}>
                  {selectedEntry.storyTitle || selectedEntry.tagline}
                </div>
                <div className="font-vt323 text-lg" style={{ color: 'var(--text-muted)' }}>
                  {selectedEntry.storySubtitle}
                </div>
                <p className="font-google-sans-code mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selectedEntry.storyDescription || selectedEntry.description}
                </p>
                {selectedEntry.demandRank > 0 && (
                  <p className="font-google-sans-code mt-2 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                    supply #{selectedEntry.supplyRank} · demand #{selectedEntry.demandRank} ·{' '}
                    <span
                      style={{
                        color:
                          Math.abs(selectedEntry.investmentDelta) > DELTA_ALIGNED_THRESHOLD
                            ? DELTA_COLORS[dark ? 'dark' : 'light'][selectedEntry.investmentDelta > 0 ? 'over' : 'under']
                            : 'var(--foreground)',
                      }}
                    >
                      {deltaLabel(selectedEntry.investmentDelta)}
                    </span>{' '}
                    · official priority #{selectedEntry.priorityRank} of {pricedCount}
                  </p>
                )}
                <p className="font-google-sans-code mt-1 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                  {selectedEntry.commitCount} commits · {selectedEntry.sessionCount} sessions ·{' '}
                  {selectedEntry.totalHours.toFixed(0)}h
                  {selectedEntry.hoursBudget > 0 &&
                    ` of ${selectedEntry.hoursBudget.toLocaleString('en-US')}h budget · ${selectedEntry.utilizationRate}% utilization`}
                </p>
              </div>

              <button
                onClick={() => setSelectedUnppp(null)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', backgroundColor: 'transparent' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--background-highlight)'
                  e.currentTarget.style.color = 'var(--foreground)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
                aria-label="Close story panel"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI lens chips — same vocabulary/colors as the RepoStats tiles. A lens
          re-measures facet SIZE; facet color stays each unppp's identity. On a
          targeted page each chip also carries the target's rank on that measure,
          so the chip row is this unppp's scoreboard against the org. */}
      <div className="flex flex-wrap gap-2 px-4">
        {LENSES.map(lens => {
          const isActive = lens.id === lensId
          const rank = targetLensRanks?.get(lens.id)
          return (
            <button key={lens.id} onClick={() => setLensId(lens.id)} title={lens.kpi.definition}>
              <Badge
                variant="primary"
                size="sm"
                style={
                  isActive
                    ? { borderColor: lens.kpi.color, backgroundColor: lens.kpi.color, color: '#fff' }
                    : { borderColor: lens.kpi.color, backgroundColor: 'transparent', color: lens.kpi.color }
                }
              >
                {lens.kpi.label}
                {rank != null && ` #${rank}`}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Source citation — the active measure's definition plus where every
          number comes from. Effort shown without provenance is just a claim. */}
      <p className="font-google-sans-code px-4 text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: activeLens.kpi.color }}>{activeLens.kpi.label}</span>{' '}
        {activeLens.kpi.definition}
        {' — '}
        {ORG_PROVENANCE.totalCommits.toLocaleString('en-US')} commits ·{' '}
        {ORG_PROVENANCE.totalSessions.toLocaleString('en-US')} sessions ·{' '}
        {Math.round(ORG_PROVENANCE.totalHours).toLocaleString('en-US')}h measured · as of {ORG_PROVENANCE.analysisDate}
      </p>

      <div className="rounded-lg border p-4" style={{ borderColor: `${colorValue}30` }}>
        <p className="font-vt323 text-xs" style={{ color: 'var(--text-muted)' }}>
          {footerNote}
        </p>
      </div>
    </div>
  )
}

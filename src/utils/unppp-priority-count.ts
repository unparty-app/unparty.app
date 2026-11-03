/**
 * Dynamic unppp priority count — replaces the hardcoded `priority` field
 * in UnpppsConfig.json with a score derived from shipped-ness and config
 * completeness.
 *
 * URL tier (highest matching tier only):
 *   4 — live on an unparty domain
 *   3 — TestFlight distribution
 *   2 — vercel deployment
 *   1 — any other URL
 *
 * Plus 1 point per expected UnpppsConfig key with a meaningful value.
 *
 * Plus a flat core bonus if the id is one of the repos confirmed to sit at
 * the center of the org's actual cross-repo architecture (see gh issue #621):
 * theunpartyapp, theunpartyapi, theunpartybuilder, theunpartycore,
 * theunpartycrawler, theunpartyrunway.
 */

export interface PriorityCountBreakdown {
  total: number
  urlPoints: number
  keyPoints: number
  corePoints: number
  productPoints: number
  completedKeys: number
  expectedKeys: number
}

/** Repos confirmed (gh issue #621) to be the wired core of the architecture —
 *  not just named "core", but load-bearing: story/thought API, RAG index,
 *  classifier pipeline, and cost/ROI tracking all live here. */
const CORE_UNPPPS = [
  'theunpartyapp',
  'theunpartyapi',
  'theunpartybuilder',
  'theunpartycore',
  'theunpartycrawler',
  'theunpartyrunway',
] as const

const CORE_BONUS = 5

const PRODUCT_UNPPPS = [
  'theunpartyunppp',
  'theunpartycharette'
]

const PRODUCT_BONUS = 4

/** Keys that represent real configuration effort. Excludes identity (id),
 *  infra artifacts (eTag), the legacy hardcoded priority, and url (scored via tiers). */
const EXPECTED_KEYS = [
  'name',
  'description',
  'color',
  'category',
  'cover',
  'endpoint',
  'tagline',
  'debt',
  'startDate',
  'lastModified',
  'media',
  'storyTitle',
  'storySubtitle',
  'storyDescription',
  'storyAuthor',
  'storyBuilder',
  'storyCategory',
  'storyPublished',
  'storySong',
  'storySongArtist',
  'polarProductId',
  'votableFeature',
  'playlist',
  'featured',
  'core',
] as const

/** A key counts only when its value is meaningful — config normalization
 *  writes literal 'null' strings for missing values. */
const hasValue = (v: unknown): boolean => {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') {
    const trimmed = v.trim()
    return trimmed !== '' && trimmed !== 'null'
  }
  if (Array.isArray(v)) return v.length > 0
  return true
}

export function getUrlPoints(url: unknown): number {
  if (typeof url !== 'string' || !hasValue(url)) return 0
  const u = url.toLowerCase()
  if (u.includes('unparty.app')) return 4
  if (u.includes('testflight.apple.com')) return 3
  if (u.includes('vercel.app')) return 2
  return 1
}

export function getCorePoints(id: unknown): number {
  if (typeof id !== 'string' || !hasValue(id)) return 0
  const u = id.toLowerCase()
  return CORE_UNPPPS.some(core => u.includes(core)) ? CORE_BONUS : 0
}

export function getProductPoints(id: unknown) : number {
  if (typeof id !== 'string' || !hasValue(id)) return 0
  const u = id.toLowerCase()
  return PRODUCT_UNPPPS.some(product => u.includes(product)) ? PRODUCT_BONUS : 0
}

export function calculatePriorityCount(entry: Record<string, unknown>): PriorityCountBreakdown {
  const urlPoints = getUrlPoints(entry.url)
  const corePoints = getCorePoints(entry.id)
  const productPoints = getProductPoints(entry.id)
  const completedKeys = EXPECTED_KEYS.filter(key => hasValue(entry[key])).length

  return {
    total: urlPoints + corePoints + productPoints + completedKeys,
    urlPoints,
    keyPoints: completedKeys,
    corePoints,
    productPoints,
    completedKeys,
    expectedKeys: EXPECTED_KEYS.length,
  }
}

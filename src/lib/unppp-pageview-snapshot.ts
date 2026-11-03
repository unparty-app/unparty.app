import UnpppsConfig from '@/data/UnpppsConfig.json'
import { VercelAnalyticsQueries } from '@/lib/vercel-analytics-queries'

/**
 * Trailing-window pageview counts per unppp id, snapshotted from
 * VercelPageview (populated by the analytics drain, /api/analytics/vercel).
 * Shared by scripts/generate-unppp-pageviews.ts (CLI) and
 * src/app/api/cron/snapshot-unppp-pageviews/route.ts (Vercel Cron) so the
 * two can't compute this differently.
 *
 * Each unppp's `id` field IS its route (e.g. `{ id: 'theunpartyapi' }` lives
 * at /theunpartyapi) — path → unppp mapping is an exact match, no lookup
 * table needed. Paths that don't match any unppp id (most site traffic —
 * homepage, articles, stories, etc.) are summed separately and reported but
 * dropped from the per-unppp output.
 */

export interface UnpppPageviewSnapshot {
  generated_at: string
  window_days: number
  total_pageviews: number
  pageviews: { id: string; views: number }[]
}

export async function computeUnpppPageviewSnapshot(windowDays = 30): Promise<UnpppPageviewSnapshot> {
  const now = new Date()
  const startTime = new Date(now)
  startTime.setDate(startTime.getDate() - windowDays)

  const byPath = await VercelAnalyticsQueries.getPageviewsByPath(startTime, now)

  const validIds = new Set(UnpppsConfig.unppps.map(u => u.id))
  const pageviews: { id: string; views: number }[] = []
  let matchedTotal = 0

  for (const { path, views } of byPath) {
    const id = path.split('?')[0].replace(/^\//, '').replace(/\/$/, '')
    if (validIds.has(id)) {
      pageviews.push({ id, views })
      matchedTotal += views
    }
  }

  pageviews.sort((a, b) => b.views - a.views)

  return {
    generated_at: now.toISOString(),
    window_days: windowDays,
    total_pageviews: matchedTotal,
    pageviews,
  }
}

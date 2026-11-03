import { GA4Queries } from '@/lib/ga-queries';
import { VercelAnalyticsQueries } from '@/lib/vercel-analytics-queries';
import { contentWindow, monthKey, type ContentPage } from '@/lib/content-performance';
import type { ConnectStats, ContentType } from '@/types/BuildStatus';

/**
 * Snapshot wrapper combining VercelAnalyticsQueries (first-party pageviews)
 * and GA4Queries (organic-search sessions) for /article/* and /story/*, for
 * the Connect baseline/current files — see src/lib/snapshot-pr.ts and
 * src/app/api/cron/snapshot-connect/route.ts.
 *
 * GA is treated as optional here: if GA4 credentials aren't configured (or
 * the API call fails for any reason), that source reads 0 rather than
 * failing the whole snapshot — Vercel pageviews alone are still a useful
 * signal. See src/lib/ga-queries.ts's own logging for the specific cause
 * when this happens; it's not re-logged here to avoid duplicate noise.
 */

const CONTENT_TYPES: ContentType[] = ['story', 'article'];
const WINDOW_DAYS = 30;

/**
 * One calendar month of articles and stories (#664): what the drain counted
 * and GA's organic sessions. The drain keeps 30 days, so each day's run
 * rewrites this month so far; the month's last run is its final number, and
 * earlier months stay as they were.
 */
export interface ConnectMonth {
  month: string;
  views: Record<ContentType, number>;
  search: Record<ContentType, number>;
  ga: Record<ContentType, number>;
  top: ContentPage[];
  next: { to: string; count: number }[];
}

export interface ConnectSnapshot {
  generated_at: string;
  window_days: number;
  stats: ConnectStats;
  // Oldest first
  months?: ConnectMonth[];
}

/** `previous`: the committed snapshot, whose earlier months carry over */
export async function computeConnectSnapshot(previous?: ConnectSnapshot | null): Promise<ConnectSnapshot> {
  const now = new Date();
  const startTime = new Date(now);
  startTime.setDate(startTime.getDate() - WINDOW_DAYS);

  const vercelByPath = await VercelAnalyticsQueries.getPageviewsByPath(startTime, now);

  const stats = {} as ConnectStats;

  for (const type of CONTENT_TYPES) {
    const prefix = `/${type}/`;
    const vercelViews = vercelByPath
      .filter((r) => r.path.startsWith(prefix))
      .reduce((sum, r) => sum + r.views, 0);

    const gaSessions = await GA4Queries.getOrganicTrafficSummary(startTime, now, prefix)
      .then((s) => s.sessions)
      .catch(() => 0);

    stats[type] = { vercel: vercelViews, ga: gaSessions };
  }

  // This month so far (no further back than the drain keeps)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const from = monthStart > startTime ? monthStart : startTime;
  const window = await contentWindow(from, now, 5);
  const ga = {} as Record<ContentType, number>;
  for (const type of CONTENT_TYPES) {
    ga[type] = await GA4Queries.getOrganicTrafficSummary(from, now, `/${type}/`)
      .then((s) => s.sessions)
      .catch(() => 0);
  }
  const month: ConnectMonth = { month: monthKey(now), views: window.views, search: window.search, ga, top: window.top, next: window.next };
  const months = [...(previous?.months ?? []).filter((m) => m.month !== month.month), month].sort((a, b) => a.month.localeCompare(b.month));

  return { generated_at: now.toISOString(), window_days: WINDOW_DAYS, stats, months };
}

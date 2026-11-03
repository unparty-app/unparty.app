import { prisma } from '@/lib/prisma';
import type { ContentType } from '@/types/BuildStatus';

/**
 * How articles and stories are read (#664), from the site's own analytics
 * drain (VercelPageview, kept 30 days): views, the views that came from a
 * search engine, which pages lead, and where a reader who arrived from search
 * went next. Shared by /admin/observability (src/lib/observability.ts) and the
 * monthly history in the connect snapshot (src/lib/connect-snapshot.ts), so
 * both count the same way.
 */

export const CONTENT_TYPES: ContentType[] = ['article', 'story'];

// A visit whose referrer is a search engine's results
const SEARCH_REFERRER = /^https?:\/\/([a-z0-9-]+\.)*(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|startpage|qwant|search\.brave)\.[a-z.]+(\/|$)/i;

export const isSearchReferrer = (referrer: string | null | undefined) => !!referrer && SEARCH_REFERRER.test(referrer);

// /article/some-slug/read?x=1 → /article/some-slug
export const contentPath = (path: string) => path.split('?')[0].replace(/\/read\/?$/, '').replace(/\/$/, '');

export const typeOf = (path: string): ContentType | null => CONTENT_TYPES.find((t) => path.startsWith(`/${t}/`)) ?? null;

// Where a reader went next, by section: /article, /story, /founders, …
const section = (path: string) => `/${path.split('?')[0].split('/').filter(Boolean)[0] ?? ''}`;

export interface ContentPage {
  path: string;
  views: number;
  search: number;
}

export interface ContentWindow {
  views: Record<ContentType, number>;
  search: Record<ContentType, number>;
  top: ContentPage[];
  // After arriving on an article or story from search: the section of the
  // next page in the same session, or "left" when there was none
  next: { to: string; count: number }[];
}

/** A drain pageview, as much of it as the counting needs */
export interface PageviewRow {
  path: string;
  referrer: string | null;
  sessionId: bigint;
  timestamp: bigint;
}

const zero = (): Record<ContentType, number> => ({ article: 0, story: 0 });

/**
 * The counting, over every pageview of a window (all paths, so a search
 * reader's next page is already in hand)
 */
export function contentFromRows(rows: PageviewRow[], topN = 10): ContentWindow {
  const views = zero();
  const search = zero();
  const pages = new Map<string, ContentPage>();
  const landings: PageviewRow[] = [];
  const bySession = new Map<bigint, PageviewRow[]>();

  for (const row of rows) {
    bySession.set(row.sessionId, [...(bySession.get(row.sessionId) ?? []), row]);
    const path = contentPath(row.path);
    const type = typeOf(path);
    if (!type) continue;
    const fromSearch = isSearchReferrer(row.referrer);
    views[type] += 1;
    const page = pages.get(path) ?? { path, views: 0, search: 0 };
    page.views += 1;
    if (fromSearch) {
      search[type] += 1;
      page.search += 1;
      landings.push(row);
    }
    pages.set(path, page);
  }

  // Each search landing's next page in its session
  const next = new Map<string, number>();
  for (const landing of landings) {
    const after = (bySession.get(landing.sessionId) ?? [])
      .filter((v) => v.timestamp > landing.timestamp)
      .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))[0];
    const to = after ? section(after.path) : 'left';
    next.set(to, (next.get(to) ?? 0) + 1);
  }

  return {
    views,
    search,
    top: [...pages.values()].sort((a, b) => b.views - a.views || b.search - a.search).slice(0, topN),
    next: [...next.entries()].map(([to, count]) => ({ to, count })).sort((a, b) => b.count - a.count),
  };
}

export async function contentWindow(start: Date, end: Date, topN = 10): Promise<ContentWindow> {
  const rows = await prisma.vercelPageview.findMany({
    where: { timestamp: { gte: BigInt(start.getTime()), lte: BigInt(end.getTime()) } },
    select: { path: true, referrer: true, sessionId: true, timestamp: true },
    take: 100_000,
  });
  return contentFromRows(rows, topN);
}

/** "2026-10": the month a date falls in, in UTC */
export const monthKey = (date: Date) => date.toISOString().slice(0, 7);

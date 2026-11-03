import { prisma } from '@/lib/prisma';
import { contentFromRows, contentPath, typeOf, type ContentWindow } from '@/lib/content-performance';
import { getPublishedEditorialArticles } from '@/app/constants/editorial-articles/registry';
import { resolveCoverSrc } from '@/app/utils/coverPath';
import StorySchema from '@/utils/StorySchema';
import storiesManifest from '@/data/storiesManifest.json';
import articleCovers from '@/data/articleCoversManifest.json';

/**
 * What /admin/observability shows, from one read of the drain for the window:
 * who came and when (a count per hour or day, for the ink line), the pages
 * they read, how articles and stories did (content-performance), where they
 * came from and on what, and the events the site sent. One query for the
 * pageviews and one for the events, so the modal waits on a single answer.
 */

export const RANGES = { '24h': { buckets: 24, unit: 'hour' }, '7d': { buckets: 7, unit: 'day' }, '30d': { buckets: 30, unit: 'day' } } as const;
export type Range = keyof typeof RANGES;
export const isRange = (value: string | null): value is Range => !!value && value in RANGES;

const HOUR_MS = 60 * 60 * 1000;
const UNIT_MS = { hour: HOUR_MS, day: 24 * HOUR_MS };

/** A page as the modal shows it: its title and cover, not its path */
export interface ShownPage {
  path: string;
  title: string;
  cover: string | null;
  views: number;
  search?: number;
}

export interface Share {
  name: string;
  count: number;
}

export interface Observability {
  range: Range;
  start: string;
  end: string;
  unit: 'hour' | 'day';
  visitors: number;
  pageviews: number;
  buckets: number[];
  top: ShownPage[];
  content: Omit<ContentWindow, 'top'> & { top: ShownPage[] };
  countries: Share[];
  devices: Share[];
  events: Share[];
}

const slugToCover = (articleCovers as { slugToCover: Record<string, string> }).slugToCover;
const slugToCoverId = storiesManifest.slugToCoverId as Record<string, string>;

/** Titles and covers for paths: articles and stories by their own, the rest by their path */
export async function shownPages<T extends { path: string; views: number; search?: number }>(pages: T[]): Promise<ShownPage[]> {
  const articles = new Map(getPublishedEditorialArticles().map((a) => [a.slug, a]));
  return Promise.all(
    pages.map(async (page) => {
      const path = contentPath(page.path) || '/';
      const slug = path.split('/')[2] ?? '';
      const base = { path, views: page.views, ...(page.search !== undefined && { search: page.search }) };
      if (typeOf(path) === 'article') {
        const article = articles.get(slug);
        return { ...base, title: article?.title ?? slug, cover: slugToCover[slug] ?? null };
      }
      if (typeOf(path) === 'story') {
        const coverId = slugToCoverId[slug];
        const story = coverId ? await StorySchema.getStoryByCoverId(coverId).catch(() => null) : null;
        return { ...base, title: story?.metadata.title ?? slug, cover: coverId ? resolveCoverSrc(coverId) : null };
      }
      return { ...base, title: path === '/' ? 'home' : path, cover: null };
    })
  );
}

// The biggest few by count, the rest as one "other"
function shares(values: (string | null)[], keep: number): Share[] {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  const sorted = [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const rest = sorted.slice(keep).reduce((n, s) => n + s.count, 0);
  return rest ? [...sorted.slice(0, keep), { name: 'other', count: rest }] : sorted;
}

export async function readObservability(range: Range, now = new Date()): Promise<Observability> {
  const { buckets: count, unit } = RANGES[range];
  const end = now.getTime();
  const start = end - count * UNIT_MS[unit];
  const timestamp = { gte: BigInt(start), lte: BigInt(end) };

  const [rows, events] = await Promise.all([
    prisma.vercelPageview.findMany({
      where: { timestamp },
      select: { path: true, referrer: true, sessionId: true, deviceId: true, timestamp: true, country: true, deviceType: true },
      take: 100_000,
    }),
    prisma.vercelEvent.groupBy({ by: ['eventName'], _count: { eventName: true }, where: { timestamp }, orderBy: { _count: { eventName: 'desc' } } }),
  ]);

  const buckets = Array.from({ length: count }, () => 0);
  const byPath = new Map<string, number>();
  for (const row of rows) {
    const index = Math.min(count - 1, Math.floor((Number(row.timestamp) - start) / UNIT_MS[unit]));
    if (index >= 0) buckets[index] += 1;
    const path = contentPath(row.path) || '/';
    byPath.set(path, (byPath.get(path) ?? 0) + 1);
  }

  const content = contentFromRows(rows, 5);
  const [top, contentTop] = await Promise.all([
    shownPages([...byPath.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 5)),
    shownPages(content.top),
  ]);

  return {
    range,
    start: new Date(start).toISOString(),
    end: now.toISOString(),
    unit,
    visitors: new Set(rows.map((r) => r.deviceId)).size,
    pageviews: rows.length,
    buckets,
    top,
    content: { ...content, top: contentTop },
    countries: shares(rows.map((r) => r.country), 4),
    devices: shares(rows.map((r) => r.deviceType), 3),
    events: events.map((e) => ({ name: e.eventName, count: e._count.eventName })),
  };
}

import { RECEIVES_BUILDS } from '@/lib/builds';
import fs from 'fs';
import path from 'path';
import type { MetadataRoute } from 'next';
import { getPublishedEditorialArticles } from '@/app/constants/editorial-articles/registry';
import { getPublishedVideoEntries } from '@/app/constants/video-registry';
import { SITE_URL } from '@/app/constants/organization';
import StorySchema from '@/utils/StorySchema';
import storiesManifest from '@/data/storiesManifest.json';
import { FAQ_PUBLISHED } from '@/lib/faq';
import { HUB_TYPES } from '@/lib/type-hub';

/**
 * Single source of truth for "every real, indexable route in this app" —
 * consumed by src/app/sitemap.ts (what we tell Google/social platforms
 * exists) and scripts/validate-og-tags.ts (confirms each one actually has
 * correct OG/Twitter tags + JSON-LD). Previously sitemap.ts computed this
 * itself and og-validation.yml maintained a second, hand-written, drifting
 * list — extracted so there's exactly one place that knows what counts as
 * a real page.
 */

export type SiteRouteType = 'static' | 'showcase' | 'article' | 'story' | 'video';

export interface SiteRoute {
  route: string; // e.g. '/article/some-slug' — no BASE_URL prefix
  type: SiteRouteType;
  lastModified?: Date;
  // Video sitemap entries (video routes only) — thumbnail_loc/content_loc
  // must be absolute per Google's protocol, unlike `route` above.
  videos?: MetadataRoute.Sitemap[number]['videos'];
}

// Core sections worth indexing (test/debug and auth-gated pages excluded).
const STATIC_ROUTES = [
  '',
  '/article',
  '/about',
  '/books',
  '/covers',
  '/unppp',
  '/status',
  '/founders',
  '/releases',
  '/privacy',
  '/terms',
  // The FAQ only once its answers are published (src/data/FaqConfig.json)
  ...(FAQ_PUBLISHED ? ['/faq'] : []),
  // The builds unparty.app has been told about (#589); a copy has none
  ...(RECEIVES_BUILDS ? ['/builds'] : []),
];

/**
 * Showcase pages (/theunparty*) discovered from the app directory at build
 * time — this route is statically generated, so fs only runs during `next
 * build` where the source tree exists.
 */
function getShowcaseRoutes(): string[] {
  try {
    const appDir = path.join(process.cwd(), 'src', 'app');
    return fs
      .readdirSync(appDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name.startsWith('theunparty') &&
          fs.existsSync(path.join(appDir, entry.name, 'page.tsx'))
      )
      .map((entry) => `/${entry.name}`);
  } catch {
    return [];
  }
}

/**
 * Individual /story/[slug] routes. Dates come from markdown frontmatter
 * (`updated-at` preferred, falls back to `date`).
 */
async function getStoryRoutes(): Promise<SiteRoute[]> {
  const slugToCoverId = storiesManifest.slugToCoverId as Record<string, string>;

  return Promise.all(
    storiesManifest.published.map(async (slug): Promise<SiteRoute> => {
      const coverId = slugToCoverId[slug];
      const story = coverId ? await StorySchema.getStoryByCoverId(coverId) : null;
      const lastModDate = story?.metadata['updated-at'] || story?.metadata.date;

      return {
        route: `/story/${slug}`,
        type: 'story',
        lastModified: lastModDate ? new Date(lastModDate) : undefined,
      };
    })
  );
}

/**
 * ISO 8601 duration ('PT1M33S', the VideoObject JSON-LD format video-
 * registry entries store) -> whole seconds, the plain integer Google's
 * video sitemap protocol wants for <video:duration>. Two different formats
 * for the same value — never pass the ISO string through directly.
 */
function isoDurationToSeconds(iso: string): number | undefined {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return undefined;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

/**
 * Individual /watch/[slug] video routes (#956). One video per route — each
 * lives on its own dedicated watch page, not attached as a secondary video
 * on the UNPPP page it's ambient-looped on, since that page is exactly what
 * *doesn't* qualify as a Google "watch page" (see the #956 audit).
 */
function getVideoRoutes(): SiteRoute[] {
  return getPublishedVideoEntries().map((video): SiteRoute => ({
    route: `/watch/${video.slug}`,
    type: 'video',
    videos: [
      {
        title: video.title,
        description: video.description,
        thumbnail_loc: `${SITE_URL}${video.thumbnailUrl}`,
        content_loc: `${SITE_URL}${video.contentUrl}`,
        ...(video.duration && { duration: isoDurationToSeconds(video.duration) }),
        ...(video.uploadDate && { publication_date: video.uploadDate }),
      },
    ],
  }));
}

export async function getAllSiteRoutes(): Promise<SiteRoute[]> {
  const staticRoutes: SiteRoute[] = STATIC_ROUTES.map((route) => ({ route, type: 'static' }));
  const showcaseRoutes: SiteRoute[] = getShowcaseRoutes().map((route) => ({ route, type: 'showcase' }));
  // A hub per kind of build (/unppp/app, /unppp/agent, …)
  const hubRoutes: SiteRoute[] = HUB_TYPES.map((type) => ({ route: `/unppp/${type}`, type: 'static' }));

  const articleRoutes: SiteRoute[] = getPublishedEditorialArticles().map((article) => ({
    route: `/article/${article.slug}`,
    type: 'article',
    lastModified: new Date(article.updated || article.date),
  }));

  const storyRoutes = await getStoryRoutes();
  const videoRoutes = getVideoRoutes();

  return [...staticRoutes, ...hubRoutes, ...showcaseRoutes, ...articleRoutes, ...storyRoutes, ...videoRoutes];
}

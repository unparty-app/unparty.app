/**
 * Utility functions for generating Open Graph metadata
 * 
 * Use generatePageMetadata() for standard pages
 * Use generateArticleMetadata() for editorial article pages
 * Use ogImageUrl() anywhere else a page builds its own metadata
 */

// Types only: LinkPreview imports ogImageUrl in the browser, which must not
// pull in the article registry
import type { Metadata } from 'next';
import type { EditorialArticle } from '@/app/constants/editorial-articles';
import type { VideoRegistryEntry } from '@/app/constants/video-registry/types';
import { SITE_URL, SITE_TITLE } from '@/app/constants/organization';

/**
 * The link preview (/api/og) for any page. Leave out author and the image is
 * the founder's (FoundersConfig); leave out the cover and the picture is the
 * site's brand colors. `cover` takes what an article's `cover` does: a bare
 * coverId, a filename in public/covers, or a list (its first is used).
 */
export function ogImageUrl(options: {
  title: string;
  subtitle?: string;
  author?: string;
  authorImage?: string;
  category?: string;
  cover?: string | string[] | null;
}, baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || SITE_URL): string {
  const url = new URL('/api/og', baseUrl);
  url.searchParams.set('title', options.title);
  if (options.subtitle) url.searchParams.set('subtitle', options.subtitle);
  if (options.author) url.searchParams.set('author', options.author);
  if (options.authorImage) url.searchParams.set('authorImage', options.authorImage);
  if (options.category) url.searchParams.set('category', options.category);
  const cover = Array.isArray(options.cover) ? options.cover[0] : options.cover;
  if (cover) url.searchParams.set('coverId', cover);
  return url.toString();
}

/**
 * Generate OG metadata for any page
 * 
 * @param options - Page metadata options
 * @param options.title - Page title
 * @param options.description - Page description
 * @param options.coverId - Cover ID (none: the site's brand colors)
 * @param options.category - Category badge text (defaults to 'APP')
 * @param options.author - Author name (defaults to the founder)
 * @param options.subtitle - Optional subtitle
 * @param options.path - The page's path ('/founders'): its og:url and canonical URL
 * 
 * @example
 * ```tsx
 * // In any page.tsx
 * import { generatePageMetadata } from '@/app/utils/ogMetadata';
 * 
 * export const metadata = generatePageMetadata({
 *   title: 'theunpartycloud',
 *   description: 'Machine learning tools and creative resources',
 *   category: 'TOOLS',
 *   coverId: 'cover-015', // optional
 * });
 * ```
 */
export function generatePageMetadata(options: {
  title: string;
  description: string;
  coverId?: string;
  category?: string;
  author?: string;
  subtitle?: string;
  path?: string;
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || SITE_URL;
  const ogImage = ogImageUrl({
    title: options.title,
    subtitle: options.subtitle,
    author: options.author,
    category: options.category || 'APP',
    cover: options.coverId,
  }, baseUrl);
  const pageUrl = options.path ? `${baseUrl}${options.path}` : baseUrl;
  
  return {
    title: options.title,
    description: options.description,
    // A page that names its path is its own canonical URL (search engines
    // index it there, not at a copy with query strings)
    ...(options.path !== undefined && { alternates: { canonical: pageUrl } }),

    openGraph: {
      title: options.title,
      description: options.description,
      type: 'website',
      url: pageUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${options.title} | ${SITE_TITLE}`,
        },
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
      images: [ogImage],
    },
  };
}

/**
 * Generate OG image URL for an article
 */
export function getOGImageUrl(article: EditorialArticle, baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || SITE_URL): string {
  return ogImageUrl({
    title: article.title,
    subtitle: article.subtitle,
    author: article.author,
    authorImage: article.authorImage,
    category: article.category,
    // The article's own cover; else one its sections show; else the brand colors
    cover: article.cover ?? extractCoverIdFromArticle(article),
  }, baseUrl);
}

/**
 * Generate complete metadata for an article page
 */
export function generateArticleMetadata(article: EditorialArticle): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || SITE_URL;
  const ogImageUrl = getOGImageUrl(article, baseUrl);
  const pageUrl = `${baseUrl}/article/${article.slug}`;
  // In search results: its own title when two articles share a heading
  const title = article.seoTitle ?? article.title;

  return {
    title,
    description: article.description,
    authors: [{ name: article.author }],
    alternates: { canonical: pageUrl },

    openGraph: {
      title,
      description: article.description,
      type: 'article',
      url: pageUrl,
      publishedTime: article.date,
      modifiedTime: article.updated,
      authors: [article.author],
      tags: article.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${article.title} - ${article.author}`,
        },
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description: article.description,
      images: [ogImageUrl],
      creator: `@${article.author}`,
    },
  };
}

/**
 * Generate complete metadata for a /watch/[slug] video page. Canonical is
 * self-referencing (unlike /article/[slug]/read, which canonicalizes back to
 * its parent article) — the whole point of a watch page is to be its own
 * indexable entity, not an alternate view of something else. See #956.
 */
export function generateVideoMetadata(video: VideoRegistryEntry): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || SITE_URL;
  const pageUrl = `${baseUrl}/watch/${video.slug}`;
  const thumbnailUrl = video.thumbnailUrl ? `${baseUrl}${video.thumbnailUrl}` : undefined;
  const videoUrl = `${baseUrl}${video.contentUrl}`;

  // Its own title in search results, apart from the article the video
  // often shares a name with
  const title = `${video.title} (video)`;

  return {
    title,
    description: video.description,
    alternates: { canonical: pageUrl },

    openGraph: {
      title,
      description: video.description,
      type: 'video.other',
      url: pageUrl,
      ...(thumbnailUrl && { images: [{ url: thumbnailUrl, width: 1200, height: 630, alt: video.title }] }),
      videos: [{ url: videoUrl }],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description: video.description,
      ...(thumbnailUrl && { images: [thumbnailUrl] }),
    },
  };
}

/**
 * Extract cover ID from article data
 * Looks for cover references in sections or uses default
 */
function extractCoverIdFromArticle(article: EditorialArticle): string | null {
  // Check if article has a coverId property (would need to add this to interface)
  if ('coverId' in article) {
    return (article as EditorialArticle & { coverId?: string }).coverId || null;
  }
  
  // Look for image sections that reference covers
  for (const section of article.sections) {
    if (section.type === 'image' && section.content?.startsWith('/covers/cover-')) {
      const match = section.content.match(/cover-(\d+)/);
      if (match) {
        return `cover-${match[1]}`;
      }
    }
  }

  return null;
}

/**
 * Example usage in a page file:
 * 
 * // src/app/articles/font/page.tsx
 * import { generateArticleMetadata } from '@/app/utils/ogMetadata';
 * import { FONT_ARTICLE } from '@/app/constants/editorial-articles';
 * import EditorialArticle from '@/app/components/editorial/EditorialArticle';
 * 
 * export const metadata = generateArticleMetadata(FONT_ARTICLE);
 * 
 * export default function FontArticlePage() {
 *   return <EditorialArticle article={FONT_ARTICLE} coverId="cover-034" />;
 * }
 */

export const exampleUsage = `
// Add coverId to your article constant
export const FONT_ARTICLE: EditorialArticle & { coverId: string } = {
  slug: 'Font',
  title: 'the future is creative.',
  subtitle: 'Complete each step to delete @unparty and create your first @party.',
  description: 'Starting with a font provided me with consistent environment and technical challenges.',
  category: '🎒',
  date: '2024-04-23',
  updated: '2025-02-03',
  published: true,
  author: 'your name',
  coverId: 'cover-034', // Add this line
  // ... sections
};
`;

/**
 * schema.org Article JSON-LD builder, shared by /article/[slug] and
 * /story/[slug] — both render an EditorialArticle, so both qualify for the
 * same structured data. See:
 * https://developers.google.com/search/docs/appearance/structured-data/article
 */

import { EditorialArticle } from '@/app/constants/editorial-articles/types';
import { VideoRegistryEntry } from '@/app/constants/video-registry/types';
import { getAuthorDisplayName, getAuthorSameAs } from '@/app/constants/authors';
import { FOUNDER } from '@/app/constants/organization';
import {
  SITE_NAME,
  SITE_URL,
  ORGANIZATION_LOGO,
  ORGANIZATION_DESCRIPTION,
  ORGANIZATION_SAME_AS,
} from '@/app/constants/organization';
import { getOGImageUrl } from './ogMetadata';
import { withResolvedCovers } from './articleCovers';

export function generateArticleJsonLd(rawArticle: EditorialArticle, pageUrl: string): Record<string, unknown> {
  const article = withResolvedCovers(rawArticle);
  const authorName = getAuthorDisplayName(article.author);
  const authorUrl = article.authorPage ? `${SITE_URL}${article.authorPage}` : undefined;
  const authorSameAs = getAuthorSameAs(article.author);

  const images = Array.from(
    new Set(
      [
        article.coverImage ? `${SITE_URL}${article.coverImage}` : undefined,
        getOGImageUrl(article, SITE_URL),
      ].filter((url): url is string => Boolean(url))
    )
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: images,
    datePublished: new Date(article.date).toISOString(),
    dateModified: new Date(article.updated || article.date).toISOString(),
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
      ...(authorSameAs && { sameAs: authorSameAs }),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: ORGANIZATION_LOGO.url,
        width: ORGANIZATION_LOGO.width,
        height: ORGANIZATION_LOGO.height,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };
}

/**
 * schema.org VideoObject JSON-LD for /watch/[slug] pages (#956). This markup
 * alone doesn't make Google treat the page as a "watch page" — that's a
 * prominence/rendering requirement, not a markup one — but a page that *is*
 * one still needs this to surface in video rich results.
 * `uploadDate`/`duration` come from src/data/videoMetadata.json (ffprobe +
 * git history, see #956) and are omitted (not emitted empty) for any entry
 * that script hasn't run against yet — Google requires uploadDate for the
 * video rich result, so a gap here means that entry's asset needs probing,
 * not that the field is meant to stay empty.
 */
export function generateVideoJsonLd(video: VideoRegistryEntry, pageUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    contentUrl: `${SITE_URL}${video.contentUrl}`,
    embedUrl: pageUrl,
    ...(video.thumbnailUrl && { thumbnailUrl: [`${SITE_URL}${video.thumbnailUrl}`] }),
    ...(video.uploadDate && { uploadDate: video.uploadDate }),
    ...(video.duration && { duration: video.duration }),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: ORGANIZATION_LOGO.url,
        width: ORGANIZATION_LOGO.width,
        height: ORGANIZATION_LOGO.height,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };
}

/**
 * schema.org BreadcrumbList JSON-LD. Every entry but the last should be a
 * real, navigable URL — Google requires breadcrumb links to resolve, so this
 * intentionally doesn't include a "category" node (article/story categories
 * are display labels, not real listing routes). The last item (current page)
 * omits `item` per Google's example markup.
 */
export function generateBreadcrumbJsonLd(items: { name: string; url?: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

/**
 * schema.org Organization JSON-LD for the homepage — the sameAs links are
 * what let Google associate the site with its other official profiles,
 * which is what Knowledge Panel / logo-in-search eligibility actually rests
 * on. See: https://developers.google.com/search/docs/appearance/structured-data/organization
 */
export function generateOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: ORGANIZATION_DESCRIPTION,
    logo: {
      '@type': 'ImageObject',
      url: ORGANIZATION_LOGO.url,
      width: ORGANIZATION_LOGO.width,
      height: ORGANIZATION_LOGO.height,
    },
    sameAs: ORGANIZATION_SAME_AS,
    founder: {
      '@type': 'Person',
      name: FOUNDER.name,
      url: `${SITE_URL}/founders`,
      sameAs: [],
    },
  };
}

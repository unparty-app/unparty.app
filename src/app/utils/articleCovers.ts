import type { EditorialArticle } from '../constants/editorial-articles/types';
import { resolveCoverSrc } from './coverPath';

/**
 * Turns an article's `cover` (string or array, the same shorthand MD frontmatter
 * takes) into the coverImage/coverImages fields the renderers read. An article
 * that already sets coverImage is returned untouched, as is one with no cover.
 */
export function withResolvedCovers<T extends Pick<EditorialArticle, 'title' | 'cover' | 'coverImage' | 'coverImages' | 'coverAlt'>>(article: T): T {
  if (article.coverImage || !article.cover) return article;
  const covers = ([] as string[]).concat(article.cover).filter(Boolean).map(resolveCoverSrc);
  if (!covers.length) return article;
  return {
    ...article,
    // coverImage is always the first photo, so single-cover consumers keep working
    coverImage: covers[0],
    coverImages: covers.length > 1 ? covers : article.coverImages,
    coverAlt: article.coverAlt || article.title,
  };
}

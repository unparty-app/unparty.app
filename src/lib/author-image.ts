import { FOUNDER } from '@/app/constants/organization';

/**
 * The picture beside an article's or story's byline: its own `authorImage`
 * when someone else wrote it, otherwise the site owner's avatar
 * (FoundersConfig `founder.image`, set from /admin → Your avatar). So an
 * article the owner writes needs no image of its own, and a new avatar
 * reaches every byline at once. A bare file name ("avatar.png") is served
 * from public/, so it gets a leading slash; a URL stays as it is.
 */
export function authorImageOf(authorImage?: string | null): string | undefined {
  const image = authorImage?.trim() || FOUNDER.image?.trim();
  if (!image) return undefined;
  return image.startsWith('/') || /^https?:\/\//.test(image) ? image : `/${image}`;
}

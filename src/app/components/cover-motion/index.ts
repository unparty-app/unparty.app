import type { ComponentType } from 'react';
import type { CoverMotionName } from './names';
import WordmarkCover from './WordmarkCover';
import ZinniaTiltCover from './ZinniaTiltCover';
import LoveGathersCover from './LoveGathersCover';

export type { CoverMotionName, CoverStyleName } from './names';
export { default as StyledCover } from './StyledCover';

/**
 * Live animated article covers, drawn in the browser instead of rendered to a
 * video: for transparent artwork that has to sit on the light or dark page
 * background (a video can't be transparent everywhere), or a photo whose
 * motion is only a camera move over the image already loaded (no new file). Each one renders the
 * same full-bleed frame as ArticleCoverImage, and holds still for visitors who
 * ask for reduced motion. For covers that can be a video, use
 * scripts/cover-motion instead.
 */
export const COVER_MOTIONS: Record<CoverMotionName, ComponentType<{ alt: string }>> = {
  'unparty-wordmark': WordmarkCover,
  'zinnia-tilt': ZinniaTiltCover,
  'love-gathers': LoveGathersCover,
};

/**
 * Covers that play their motion wherever they are an article's cover, with no
 * `coverMotion` on the article. A stopgap until the cover convention settles:
 * delete a line to send that cover back to a still. An article's own
 * `coverMotion` still wins.
 */
const COVER_IMAGE_MOTIONS: Record<string, CoverMotionName> = {
  '/covers/cover-008.png': 'zinnia-tilt',
};

export const motionForCover = (coverImage?: string): CoverMotionName | undefined =>
  coverImage ? COVER_IMAGE_MOTIONS[coverImage] : undefined;

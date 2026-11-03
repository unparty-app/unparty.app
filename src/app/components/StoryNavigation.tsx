'use client';

import { usePathname, useRouter } from 'next/navigation';
import { CircleArrowLeft, CircleArrowRight } from './icons';
import storiesManifest from '@/data/storiesManifest.json';
import { resolveCoverSrc } from '../utils/coverPath';
import PageNeighbors, { type Neighbor } from './PageNeighbors';

const STORY_ROUTES = storiesManifest.published.map(coverId => `/story/${coverId}`);

// A story as a neighbor: its name (its slug, the way stories title themselves:
// DEPEND.) and its cover
function storyNeighbor(route: string | undefined): Neighbor | undefined {
  if (!route) return undefined;
  const slug = route.replace('/story/', '');
  const coverId = (storiesManifest.slugToCoverId as Record<string, string>)[slug];
  return { href: route, name: `${slug.toUpperCase()}.`, cover: coverId ? resolveCoverSrc(coverId) : undefined };
}

export default function StoryNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname.startsWith('/story/')) return null;

  const currentIndex = STORY_ROUTES.findIndex(r => r === pathname);
  if (currentIndex === -1) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < STORY_ROUTES.length - 1;

  return (
    <>
    <PageNeighbors
      previous={storyNeighbor(hasPrev ? STORY_ROUTES[currentIndex - 1] : undefined)}
      next={storyNeighbor(hasNext ? STORY_ROUTES[currentIndex + 1] : undefined)}
      kind="story"
    />
    <div className="page-navigation">
      <button
        onClick={() => hasPrev && router.push(STORY_ROUTES[currentIndex - 1])}
        disabled={!hasPrev}
        className="page-navigation-arrow page-navigation-arrow--left"
        aria-label="Previous story"
      >
        <CircleArrowLeft className="page-navigation-arrow__icon" strokeWidth={1} themed />
      </button>
      <button
        onClick={() => hasNext && router.push(STORY_ROUTES[currentIndex + 1])}
        disabled={!hasNext}
        className="page-navigation-arrow page-navigation-arrow--right"
        aria-label="Next story"
      >
        <CircleArrowRight className="page-navigation-arrow__icon" strokeWidth={1} themed />
      </button>
    </div>
    </>
  );
}

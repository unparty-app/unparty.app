'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CircleArrowLeft, CircleArrowRight } from './icons';
import { getPortfolio } from '@/lib/component-portfolio';

// Drafts preview on npm run dev, so they're walkable there; in production
// only published component articles are
const DEV = process.env.NODE_ENV === 'development';

// The component articles (MAKE.), in portfolio order: the same order as
// /build's ALL. tab
const COMPONENT_ROUTES = getPortfolio()
  .filter((item) => item.home && item.home.category === 'MAKE.' && (item.home.published || DEV))
  .map((item) => ({ href: `/article/${item.home!.slug}`, label: item.label }));

/**
 * Previous / next between component articles, the way StoryNavigation walks
 * the stories and PageNavigation the unppp pages: the same fixed arrows,
 * shown only on a component's home article (category MAKE.). A SETUP. or
 * brand article that also presents a component keeps its own context.
 */
export default function ComponentNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentIndex = COMPONENT_ROUTES.findIndex((r) => r.href === pathname);
  const prev = currentIndex > 0 ? COMPONENT_ROUTES[currentIndex - 1] : null;
  const next = currentIndex !== -1 && currentIndex < COMPONENT_ROUTES.length - 1 ? COMPONENT_ROUTES[currentIndex + 1] : null;

  useEffect(() => {
    if (prev) router.prefetch(prev.href);
    if (next) router.prefetch(next.href);
  }, [prev, next, router]);

  if (currentIndex === -1) return null;

  return (
    <div className="page-navigation">
      <button
        onClick={() => prev && router.push(prev.href)}
        disabled={!prev}
        className="page-navigation-arrow page-navigation-arrow--left"
        aria-label={prev ? `Previous component: ${prev.label}` : 'Previous component'}
        title={prev?.label}
      >
        <CircleArrowLeft className="page-navigation-arrow__icon" strokeWidth={1} themed />
      </button>
      <button
        onClick={() => next && router.push(next.href)}
        disabled={!next}
        className="page-navigation-arrow page-navigation-arrow--right"
        aria-label={next ? `Next component: ${next.label}` : 'Next component'}
        title={next?.label}
      >
        <CircleArrowRight className="page-navigation-arrow__icon" strokeWidth={1} themed />
      </button>
    </div>
  );
}

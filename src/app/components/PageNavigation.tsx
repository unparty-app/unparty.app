"use client";

import { useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CircleArrowLeft, CircleArrowRight } from './icons';
import { getEnrichedUnpppConfig } from '../../utils/unpppPriority';
import { resolveCoverSrc } from '../utils/coverPath';
import PageNeighbors, { type Neighbor } from './PageNeighbors';
import { findProjectById } from '@/lib/projects';

// Routes ordered by dynamic priority rank (ascending: rank 1 first)
const UNPPPS = getEnrichedUnpppConfig();
const routeOf = (id: string) => (id === 'theunpartyapp' ? '/' : `/${id}`);
const PAGE_ROUTES = UNPPPS.map((unppp) => routeOf(unppp.id));

// Each unppp page as a neighbor: its name (the owner's, from FoundersConfig,
// when they give one), cover and color
const usable = (v: unknown) => (typeof v === 'string' && v && v !== 'null' ? v : undefined);
const UNPPP_NEIGHBORS: Record<string, Omit<Neighbor, 'href'>> = Object.fromEntries(
  UNPPPS.map((u) => [routeOf(u.id), { name: findProjectById(u.id)?.name ?? usable(u.name) ?? u.id, cover: usable(u.cover) ? resolveCoverSrc(u.cover as string) : undefined, color: usable(u.color) ?? null }])
);

interface PageNavigationProps {
  className?: string;
  /** The pages to step through, in order (default: the unppp pages by priority).
   *  /party/problem/[id] passes the owner's problems */
  routes?: string[];
  /** What each route is called, for the in-page neighbors (default: the unppps' names) */
  labels?: Record<string, string>;
  /** What one page is, for screen readers ("project", "problem") */
  kind?: string;
}

export default function PageNavigation({ className = '', routes = PAGE_ROUTES, labels, kind = 'project' }: PageNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derived directly from pathname on every render, not synced through
  // state+effect — the old `useState(0)` default meant a hard reload
  // landing on the last unppp briefly reported hasNext=true (index 0's
  // shape) until an effect corrected it a tick later.
  const currentIndex = useMemo(
    () => routes.findIndex(route => route === pathname),
    [pathname, routes]
  );

  // Set right before router.push() in navigateToPrevious/Next; consumed by
  // the pathname effect below so the page-top scroll only fires for
  // arrow-driven navigation, not every route change in the app.
  const pendingScrollRef = useRef(false);

  // Fires exactly when the route actually changes, not a guessed delay —
  // #page-top now lives on the persistent <main> in the root layout, so its
  // position doesn't depend on the new page's data having loaded yet, and
  // there's nothing left to race.
  useEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;

    requestAnimationFrame(() => {
      const pageTop = document.getElementById('page-top');
      const targetTop = pageTop
        ? pageTop.getBoundingClientRect().top + window.scrollY - 20
        : 0;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    });
  }, [pathname]);

  useEffect(() => {
    if (currentIndex === -1) return;

    const adjacentRoutes = [
      routes[currentIndex - 1],
      routes[currentIndex + 1],
    ].filter((route): route is string => Boolean(route));

    adjacentRoutes.forEach(route => {
      router.prefetch(route);
    });
  }, [currentIndex, router, routes]);

  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      pendingScrollRef.current = true;
      router.push(routes[currentIndex - 1]);
    }
  };

  const navigateToNext = () => {
    if (currentIndex < routes.length - 1) {
      pendingScrollRef.current = true;
      router.push(routes[currentIndex + 1]);
    }
  };

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < routes.length - 1;

  // Don't render if the current route isn't a tracked unppp page, or on admin/auth pages
  if (currentIndex === -1 || pathname.startsWith('/admin') || pathname.startsWith('/sign-')) {
    return null;
  }

  const neighbor = (route: string | undefined): Neighbor | undefined =>
    route ? { href: route, ...(UNPPP_NEIGHBORS[route] ?? {}), name: labels?.[route] ?? UNPPP_NEIGHBORS[route]?.name ?? route } : undefined;

  return (
    <>
    <PageNeighbors previous={neighbor(hasPrevious ? routes[currentIndex - 1] : undefined)} next={neighbor(hasNext ? routes[currentIndex + 1] : undefined)} kind={kind} />
    <div className={`page-navigation ${className}`}>
      <button
        onClick={navigateToPrevious}
        disabled={!hasPrevious}
        className="page-navigation-arrow page-navigation-arrow--left"
        aria-label="Previous page"
      >
        <CircleArrowLeft className="page-navigation-arrow__icon" strokeWidth={1} themed />
      </button>

      <button
        onClick={navigateToNext}
        disabled={!hasNext}
        className="page-navigation-arrow page-navigation-arrow--right"
        aria-label="Next page"
      >
        <CircleArrowRight className="page-navigation-arrow__icon" strokeWidth={1} themed />
      </button>
    </div>
    </>
  );
}

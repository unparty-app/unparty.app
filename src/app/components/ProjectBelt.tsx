'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../contexts/ThemeContext';
import { useInView } from '../hooks/useInView';
import BuyPill, { BuildYoursPill } from './BuyPill';
import ActionPill from './build-yours/ActionPill';
import { BUILD_YOURS_DONE } from './build-yours/BuildYours';
import { AppWindow, Hammer, Package, Play, type HandDrawnIconComponent } from './icons';
import type { BeltItem, ProjectBelt as ProjectBeltData } from '@/lib/project-belt';

// Only once the releases pill is tapped: it brings the component registry
const ReleasesModal = dynamic(() => import('./ReleasesModal'), { ssr: false });

/**
 * ProjectBelt - what a visitor can do next, as a row of pills in "build
 * yours"'s hand, floating at the end of a project page (in the footer's
 * frame) or under a type hub's cover: try the component a release ships,
 * open what it has released (ReleasesModal: try each, then take it into your
 * own repo), price yours (the real figure), then build yours. Each pill is the Fab's
 * ask made into another action (ActionPill); once the row is seen, their
 * icons pop in and their verbs write on, one pill after another.
 *
 * Left-aligned and unruled, like a ScrollRow. When the pills don't fit (a
 * phone), the row becomes a conveyor: it drifts in a loop, slow enough to
 * read, fading at its edges, and stops while hovered, focused or touched.
 * With reduced motion it never moves; it scrolls by swipe instead.
 *
 * `fill` sits it in its parent's frame instead of the footer's (a type hub,
 * whose page is already full-bleed); `color` gives it the page's own color.
 */

const ICON: Record<BeltItem['kind'], HandDrawnIconComponent> = { live: AppWindow, try: Play, price: Hammer, releases: Package };
// Conveyor speed, in pixels a second
const SPEED = 28;
// Between pills, and between the conveyor's two copies
const GAP = 12;
// Each pill's pen starts this long after the last one's
const STAGGER_MS = 350;

export default function ProjectBelt({
  belt,
  fill = false,
  className = 'mt-10',
  label = 'what to do next',
  color,
}: {
  belt: ProjectBeltData;
  fill?: boolean;
  className?: string;
  // What the row is, for screen readers
  label?: string;
  // The page's own color (a type hub's); else the theme's
  color?: string;
}) {
  const { colorValue: themeColor } = useTheme();
  const colorValue = color ?? themeColor;
  const [rootRef, seen] = useInView<HTMLElement>();
  const frameRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [setWidth, setSetWidth] = useState(0);
  const [held, setHeld] = useState(false);
  const [still, setStill] = useState(false);
  const [releasesOpen, setReleasesOpen] = useState(false);

  // Whether one set of pills fits the frame: if not, it runs as a conveyor
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const set = setRef.current;
    if (!frame || !set) return;
    const measure = () => {
      setSetWidth(set.scrollWidth);
      setOverflows(set.scrollWidth > frame.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(set);
    return () => observer.disconnect();
  }, [belt]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setStill(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Nothing to offer but the ask: the Fab already makes it
  if (belt.items.length === 0) return null;

  const pills = [
    ...belt.items.map((item, i) => (
      <ActionPill
        key={item.href}
        verb={item.verb}
        note={item.note}
        {...(item.kind === 'releases' && belt.releases?.length ? { onClick: () => setReleasesOpen(true) } : { href: item.href })}
        icon={ICON[item.kind]}
        color={colorValue}
        label={item.label}
        delayMs={250 + i * STAGGER_MS}
      />
    )),
    ...(belt.polarProductId ? [<BuyPill key="ask" polarProductId={belt.polarProductId} />] : belt.ask ? [<BuildYoursPill key="ask" />] : []),
  ];
  const moving = overflows && !still;

  return (
    <section
      ref={rootRef}
      aria-label={label}
      className={`build-yours ${fill ? 'w-full' : 'w-screen mx-[calc(50%-50vw)]'} ${className}`}
      data-paused={!seen || undefined}
    >
      <div className={fill ? 'w-full' : 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'}>
        {/* On a project page, clear of its prev/next arrows at either side
            (PageNavigation); a hub has none, so it lines up with the hub */}
        <div
          ref={frameRef}
          className={`belt relative py-2 ${fill ? '' : 'md:mx-14'} ${moving ? 'overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]' : 'no-scrollbar overflow-x-auto'}`}
          data-held={held || undefined}
          onPointerDown={(e) => e.pointerType !== 'mouse' && setHeld((h) => !h)}
          style={BUILD_YOURS_DONE}
        >
          <div
            className="flex w-max"
            style={moving ? ({ ['--belt-shift' as string]: `-${setWidth}px`, ['--belt-time' as string]: `${setWidth / SPEED}s` }) : undefined}
          >
            <div ref={setRef} className={`flex w-max items-center ${moving ? 'belt-track' : ''}`} style={{ gap: GAP, paddingRight: moving ? GAP : 0 }}>
              {pills}
            </div>
            {/* The second copy keeps the loop seamless; it's only for the eye */}
            {moving && (
              <div aria-hidden inert className="belt-track flex w-max items-center" style={{ gap: GAP, paddingRight: GAP }}>
                {pills}
              </div>
            )}
          </div>
        </div>
      </div>
      {releasesOpen && belt.releases && <ReleasesModal releases={belt.releases} color={color} onClose={() => setReleasesOpen(false)} />}
    </section>
  );
}

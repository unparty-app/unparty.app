'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import EditorialSection from './EditorialSection';
import { EditorialSection as EditorialSectionType } from '../../constants/editorial-articles';
import { useHydrated } from '@/hooks/useHydrated';
import { readPinLine } from '../../utils/pinLine';

// Fallback for the height of the site's persistent fixed chrome (the Header
// inside layout.tsx's #site-chrome wrapper; the Banner is a bottom dock now)
// until it can be measured. The real height varies (the header wraps on
// narrow screens), so the live value comes from a ResizeObserver on
// #site-chrome.
const FALLBACK_TOP_OFFSET = 72;

// How far down the viewport a hero's sentinel can still be and count as
// "reached" — larger than the chrome offset so the hero snaps into the pinned
// slot while its natural position is still well below the header, instead
// of waiting until it's about to scroll under it. Clamped to a fraction of
// the viewport at measure time so short/mobile viewports don't activate
// heroes half a screen early.
const HERO_ACTIVATE_DISTANCE = 400;

export interface SectionGroup {
  hero: EditorialSectionType | null;
  body: EditorialSectionType[];
}

/**
 * Splits a flat section list into hero-led groups: each `hero` section starts
 * a new group, and every non-hero section until the next hero belongs to it.
 * Content before the first hero (rare) becomes a leading group with hero: null.
 */
export function groupSectionsByHero(sections: EditorialSectionType[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let current: SectionGroup = { hero: null, body: [] };

  for (const section of sections) {
    if (section.type === 'hero') {
      if (current.hero || current.body.length > 0) groups.push(current);
      current = { hero: section, body: [] };
    } else {
      current.body.push(section);
    }
  }
  if (current.hero || current.body.length > 0) groups.push(current);

  return groups;
}

interface StickyHeroStackProps {
  groups: SectionGroup[];
  articleSlug?: string;
  visibleSections: Set<string>;
  registerSectionRef: (id: string, el: HTMLDivElement | null) => void;
}

/**
 * Renders hero sections pinned below the fixed site header while the rest of
 * the article scrolls underneath. When a later hero's sentinel reaches the
 * same line, it crossfades in and takes over the pinned slot; once the
 * article scrolls past the last hero's content, the pinned slot fades out.
 *
 * Positioning is real fixed positioning (JS-driven activation), not
 * `position: sticky` — an IntersectionObserver tracks which hero's sentinel
 * has crossed the header line, and a single fixed slot crossfades between
 * each hero's content via opacity transitions.
 */
const StickyHeroStack: React.FC<StickyHeroStackProps> = ({
  groups,
  articleSlug,
  visibleSections,
  registerSectionRef,
}) => {
  const heroGroups = groups.filter(
    (g): g is SectionGroup & { hero: EditorialSectionType } => !!g.hero
  );
  const [activeHeroId, setActiveHeroId] = useState<string | null>(null);
  // Drives the first hero's in-flow visibility on its own, independent of
  // the activation/look-ahead timing below — that logic decides when the
  // *pinned* display should crossfade in, which is deliberately early
  // (HERO_ACTIVATE_DISTANCE) so it doesn't lag behind a fast scroll. Tying
  // the in-flow hero's disappearance to that same look-ahead left both
  // visible together while the fade-in was still catching up. This instead
  // just asks "has the user scrolled at all" — the in-flow copy drops the
  // instant scrolling starts, no anticipation needed.
  const [hasScrolled, setHasScrolled] = useState(false);
  const mounted = useHydrated();
  const [topOffset, setTopOffset] = useState(FALLBACK_TOP_OFFSET);
  const sentinelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const displayRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const endSentinelRef = useRef<HTMLDivElement>(null);

  const heroIdsKey = heroGroups.map((g) => g.hero.id).join(',');

  // Portal target (document.body) isn't available until after mount.

  // Track the fixed chrome's real height. Hardcoding it breaks on small
  // screens: the header's flex content wraps past 64px.
  // With a sticky cover the pin line is the cover band's bottom instead
  // (readPinLine), re-read on every scroll frame in measure() below.
  useEffect(() => {
    const chrome = document.getElementById('site-chrome');
    if (!chrome) return;

    const update = () => {
      const line = readPinLine();
      if (line > 0) setTopOffset(line);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(chrome);
    return () => observer.disconnect();
  }, []);

  // Direct measurement on scroll (rAF-throttled), rather than
  // IntersectionObserver — a handful of sentinels is cheap to measure
  // directly, and avoids the rootMargin footguns of building a precise
  // "trigger line" (percentage margins resolve against root height, not
  // pixels, which produces an inverted/degenerate rect for a thin line).
  useEffect(() => {
    if (heroGroups.length === 0) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      // At scrollY 0 a hero's sentinel can already read within
      // HERO_ACTIVATE_DISTANCE purely because the header above it is short
      // (e.g. a compact byline with no cover image) — not because the user
      // scrolled anywhere. Only honor the look-ahead buffer once there's
      // been actual scroll; otherwise require the sentinel to have truly
      // reached the pin line, so a short header never gets covered by its
      // own first hero on initial, unscrolled load.
      const scrolled = window.scrollY > 0;
      setHasScrolled(scrolled);
      // The sticky cover band shrinks while the reader scrolls, so the pin
      // line moves: read it fresh each frame (state only feeds the display)
      const pinLine = readPinLine();
      setTopOffset((prev) => (Math.round(prev) === Math.round(pinLine) ? prev : pinLine));
      // Never let the look-ahead exceed ~a third of the viewport (mobile
      // screens are shorter than HERO_ACTIVATE_DISTANCE is generous), but
      // never let it shrink below the pin line itself.
      const activateDistance = Math.max(
        pinLine,
        Math.min(HERO_ACTIVATE_DISTANCE, window.innerHeight * 0.35)
      );
      let active: string | null = null;
      for (const group of heroGroups) {
        const el = sentinelRefs.current.get(group.hero.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        // Reached once its content does the bottom of the pinned slot: a jump
        // (OutlineRail, a ?mention= link) lands its first lines just below
        // the pinned headline, which a tall cover band can push past the
        // look-ahead
        const pinnedHeight = displayRefs.current.get(group.hero.id)?.getBoundingClientRect().height ?? 0;
        if (top <= pinLine || (scrolled && top <= Math.max(activateDistance, pinLine + pinnedHeight))) {
          active = group.hero.id;
        }
      }
      // Release the pinned slot once the end-of-content sentinel has scrolled
      // up far enough to clear the currently-displayed hero's own rendered
      // height — not just the header offset — so a short trailing footer
      // never sits underneath an still-pinned hero.
      if (active && endSentinelRef.current) {
        const displayEl = displayRefs.current.get(active);
        const heroHeight = displayEl?.getBoundingClientRect().height ?? 0;
        if (endSentinelRef.current.getBoundingClientRect().top <= pinLine + heroHeight) {
          active = null;
        }
      }
      setActiveHeroId(active);
      // Publish the pinned hero's bottom as --hero-line, so sticky parts of
      // a section (GoalBudget's goal) stop below it instead of under it
      const root = document.documentElement;
      const activeHeight = active ? displayRefs.current.get(active)?.getBoundingClientRect().height ?? 0 : 0;
      if (active && activeHeight) root.style.setProperty('--hero-line', `${Math.round(pinLine + activeHeight)}px`);
      else root.style.removeProperty('--hero-line');
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    // Layout shifts (e.g. the header's cover image finishing loading) move
    // the sentinels without any scroll/resize event firing — a sentinel that
    // briefly measured above the pin line pre-load would otherwise stay
    // falsely active. Re-measure whenever the document's height changes.
    const resizeObserver = new ResizeObserver(onScrollOrResize);
    resizeObserver.observe(document.documentElement);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      resizeObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.style.removeProperty('--hero-line');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroIdsKey]);

  // Fixed crossfading hero display, pinned below the site header. Portaled
  // to document.body — ancestors (e.g. .page-transition-wrapper) carry a
  // persistent CSS transform, which re-anchors `position: fixed` to that
  // ancestor instead of the viewport even though the transform is visually
  // an identity matrix. Same workaround OutlineRail.tsx uses.
  const heroDisplay = mounted && heroGroups.length > 0
    ? createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 z-30"
          style={{ top: `${topOffset}px` }}
        >
          {/* Inactive layers flip to visibility:hidden after the fade so
              their backdrop-blur stops compositing; only the active layer
              re-enables pointer events so links in a pinned hero work
              without opacity-0 layers swallowing clicks. */}
          {heroGroups.map((group) => (
            <div
              key={group.hero.id}
              ref={(el) => {
                if (el) displayRefs.current.set(group.hero.id, el);
                else displayRefs.current.delete(group.hero.id);
              }}
              data-hero-display={group.hero.id}
              className={`absolute inset-x-0 top-0 ${
                activeHeroId === group.hero.id
                  ? 'pointer-events-auto visible opacity-100 [transition:opacity_700ms_ease-out]'
                  : 'invisible opacity-0 [transition:opacity_700ms_ease-out,visibility_0s_700ms]'
              }`}
            >
              <div className="bg-background/95 backdrop-blur-sm">
                <EditorialSection section={group.hero} isVisible articleSlug={articleSlug} />
              </div>
            </div>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {heroDisplay}

      {/* In-flow: a hero sentinel (scrollspy anchor + activation line) + body sections */}
      {groups.map((group, gi) => {
        const hero = group.hero;
        // The first hero renders visibly in its natural in-flow spot
        // (right under the article cover) only at the very top of the
        // page, so load never shows a blank gap waiting for scroll. It
        // drops the instant any scroll happens (hasScrolled), rather
        // than waiting for the pinned display's own activation — that
        // activation deliberately fires early (HERO_ACTIVATE_DISTANCE
        // look-ahead) and fades in over 700ms, so tying the in-flow
        // copy's disappearance to it left both visible together during
        // the fade.
        //
        // Every other hero only ever appears via the pinned crossfade, so
        // its in-flow copy takes no height: it used to reserve the hero's
        // full height (~150px) as blank space, which read as a gap around
        // any short section between two heroes. The copy stays in the DOM
        // (sr-only, aria-hidden) so the heading text is in the server HTML;
        // OutlineRail adds the pinned hero's height when it jumps here.
        // Only a hero that opens the article (nothing before it) can show in
        // flow at the top; one further down (the homepage's) is never on
        // screen unscrolled, so it collapses like the rest
        const isFirstHero = !!hero && gi === 0;
        const showInFlow = isFirstHero && !hasScrolled && activeHeroId !== hero?.id;
        return (
          <React.Fragment key={hero?.id ?? `body-${gi}`}>
            {hero && (
              <div
                ref={(el) => {
                  registerSectionRef(hero.id, el);
                  if (el) sentinelRefs.current.set(hero.id, el);
                  else sentinelRefs.current.delete(hero.id);
                }}
                data-hero-sentinel={hero.id}
                data-section-id={hero.id}
                className={showInFlow ? 'relative' : 'invisible relative'}
                aria-hidden={showInFlow ? undefined : 'true'}
              >
                {isFirstHero ? (
                  <EditorialSection section={hero} isVisible articleSlug={articleSlug} />
                ) : (
                  <div className="sr-only">
                    <EditorialSection section={hero} isVisible articleSlug={articleSlug} />
                  </div>
                )}
              </div>
            )}
            {group.body.map((section) => (
              <div
                key={section.id}
                ref={(el) => registerSectionRef(section.id, el)}
                data-section-id={section.id}
                className="relative"
              >
                <EditorialSection
                  section={section}
                  isVisible={visibleSections.has(section.id)}
                  articleSlug={articleSlug}
                />
              </div>
            ))}
          </React.Fragment>
        );
      })}
      <div ref={endSentinelRef} data-hero-end-sentinel aria-hidden="true" />
    </>
  );
};

export default StickyHeroStack;

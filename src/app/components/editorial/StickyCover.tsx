'use client';

import React, { useEffect, useRef } from 'react';

// Height the cover shrinks to once pinned, CSS px (phones / wider)
const BAND = { phone: 100, wide: 160 };
// How far the cover tucks under the frosted header: slightly above half of it
const TUCK = 0.58;
// Space between the cover and the article, as the header's mb-16 gave it
const GAP = 64;
// Below this viewport height (a phone in landscape) the cover just scrolls away
const MIN_VIEWPORT = 520;

/**
 * Pins an article's cover under the frosted header and shrinks it to a band
 * as the reader scrolls, so the cover stays present for the whole read while
 * the text scrolls underneath it.
 *
 * - It scrolls up until it tucks under the header by ~58% of the header's
 *   height (the header's blur shows it through), then sticks there.
 * - Over the first (full - band) px of scroll its frame (.image-container-cover)
 *   eases from its natural 16:9 height down to the band. The wrapper's bottom
 *   margin grows by exactly as much, so nothing below moves in the document:
 *   the text keeps scrolling 1:1 and simply passes under the cover.
 * - The band's bottom is published as --pin-line (utils/pinLine.ts), so pinned
 *   headlines (StickyHeroStack) and outline jumps (OutlineRail) land below it.
 *
 * Every cover treatment works inside: photos and videos are object-cover, the
 * live motions size from their container. A cover that should not resize as
 * the band shrinks (a WebGL canvas reallocates and flickers on every resize)
 * can size a stage to --cover-full, the natural height published here, and
 * let the band crop it. A
 * photo row (no frame) and short viewports render as a plain, unpinned cover;
 * it only pins once this has measured the frame, so the server render and
 * first paint are the ordinary cover.
 */
const StickyCover: React.FC<{
  children: React.ReactNode;
  // The band it shrinks to, CSS px; a cover with words in it (a type hub) needs room for them
  band?: { phone: number; wide: number };
  // A cover whose height is its own content (a type hub, not a photo sized to
  // the frame): measure again whenever that content resizes
  contentSized?: boolean;
}> = ({ children, band: bandSize = BAND, contentSized = false }) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = wrap?.querySelector<HTMLElement>('.image-container-cover');
    const chrome = document.getElementById('site-chrome');
    const root = document.documentElement;
    // A photo row has no frame to shrink: it stays a plain, unpinned cover
    if (!wrap || !frame) return;

    let full = 0;
    let band = 0;
    let top = 0;
    let enabled = false;
    let raf = 0;

    const apply = () => {
      raf = 0;
      if (!enabled) return;
      const span = Math.max(full - band, 1);
      const p = Math.min(Math.max(window.scrollY / span, 0), 1);
      const h = full - (full - band) * p;
      frame.style.height = `${h}px`;
      // Past halfway to the band, for covers that hide what won't fit (a type hub's definition)
      frame.toggleAttribute('data-shrunk', p > 0.5);
      wrap.style.marginBottom = `${GAP + (full - h)}px`;
      root.style.setProperty('--pin-line', `${top + h}px`);
    };

    const measure = () => {
      // Natural size first: drop our overrides, read the frame's own 16:9 height
      frame.style.height = '';
      frame.style.maxHeight = '';
      frame.style.aspectRatio = '';
      enabled = window.innerHeight >= MIN_VIEWPORT;
      if (!enabled) {
        wrap.style.position = '';
        wrap.style.marginBottom = `${GAP}px`;
        root.style.removeProperty('--pin-line');
        return;
      }
      full = frame.getBoundingClientRect().height;
      // The cover's full height, for covers that keep their composition at
      // full size and let the band crop it (ZinniaTiltCover's stage)
      wrap.style.setProperty('--cover-full', `${full}px`);
      band = Math.min(window.innerWidth < 640 ? bandSize.phone : bandSize.wide, full);
      const chromeH = chrome?.offsetHeight ?? 72;
      top = Math.round(chromeH * (1 - TUCK));
      wrap.style.position = 'sticky';
      wrap.style.top = `${top}px`;
      frame.style.aspectRatio = 'auto';
      frame.style.maxHeight = 'none';
      apply();
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    if (chrome) ro.observe(chrome);
    // A cover with content in it (a type hub) measures again once its fonts
    // and styles settle, rather than keeping a height read too early
    const content = contentSized ? frame.firstElementChild : null;
    if (content) ro.observe(content);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty('--pin-line');
    };
  }, [bandSize.phone, bandSize.wide, contentSized]);

  return (
    <div
      ref={wrapRef}
      data-sticky-cover
      className="relative z-40"
      style={{ marginBottom: GAP }}
    >
      {children}
    </div>
  );
};

export default StickyCover;

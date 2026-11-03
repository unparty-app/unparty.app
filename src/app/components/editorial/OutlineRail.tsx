'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { readPinLine } from '../../utils/pinLine';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { EditorialSection } from '../../constants/editorial-articles/types';
import { deriveOutlineEntries } from './outlineEntries';
import { useHydrated } from '@/hooks/useHydrated';
import { iconByName } from '../icons/byName';

// Fallback until the real chrome height is measured (see the ResizeObserver
// effect below) - hardcoding it breaks on small screens where the header
// wraps past 64px. Matches StickyHeroStack's FALLBACK_TOP_OFFSET, which this component
// shares an ancestor and ("fixed inset-x-0 top-0" chrome) with.
const FALLBACK_TOP_OFFSET = 72;

interface OutlineRailProps {
  sections: EditorialSection[];
  sectionRefs: React.RefObject<Map<string, HTMLDivElement>>;
}

/**
 * OutlineRail — floating scrollspy outline for stories and articles.
 * At rest: a slim column of tick marks at the right edge, anchored above
 * viewport center (clear of the StoryNavigation arrows at exact center).
 * Hover/tap expands a labeled outline; clicking an entry jumps to it.
 */
const OutlineRail: React.FC<OutlineRailProps> = ({ sections, sectionRefs }) => {
  const { colorValue } = useTheme();
  const entries = useMemo(() => deriveOutlineEntries(sections), [sections]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const mounted = useHydrated();
  const containerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [topOffset, setTopOffset] = useState(FALLBACK_TOP_OFFSET);
  // Escape while the cursor rests on the rail: the panel unmounts, the cursor
  // lands back on the toggle and mouseenter refires — suppress hover-expand
  // until the pointer actually leaves the rail.
  const hoverSuppressed = useRef(false);
  const hasEntries = entries.length >= 2;

  // Track the fixed chrome's real height, same as StickyHeroStack.
  useEffect(() => {
    const chrome = document.getElementById('site-chrome');
    if (!chrome) return;

    const update = () => {
      const height = chrome.offsetHeight;
      if (height > 0) setTopOffset(height);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(chrome);
    return () => observer.disconnect();
  }, []);

  // Scrollspy — separate observer from EditorialArticle's fade-in observer.
  // The "band" spans from under the fixed header to 40% viewport height;
  // active = last outline section (document order) overlapping the band.
  // When the band is empty (long body between headings), the previous
  // active entry is kept — that heading still governs what's being read.
  useEffect(() => {
    if (!hasEntries) return;

    const els = entries
      .map((e) => sectionRefs.current?.get(e.id))
      .filter((el): el is HTMLDivElement => !!el);

    const intersecting = new Set<string>();
    let isInitialCallback = true;
    const observer = new IntersectionObserver(
      (obsEntries) => {
        for (const oe of obsEntries) {
          const id = oe.target.getAttribute('data-section-id');
          if (!id) continue;
          if (oe.isIntersecting) intersecting.add(id);
          else intersecting.delete(id);
        }
        // Active = topmost outline entry (document order) inside the band —
        // the section whose content sits at the reading position.
        const inBand = entries.find((entry) => intersecting.has(entry.id));
        if (inBand) {
          setActiveId(inBand.id);
        } else if (isInitialCallback) {
          // The observer reports every section right after observe(); if
          // none is in the band (loading mid-page inside a long section),
          // pick the last heading above the reading position.
          const initial = [...entries].reverse().find((e) => {
            const el = sectionRefs.current?.get(e.id);
            return el && el.getBoundingClientRect().top <= window.innerHeight * 0.4;
          });
          setActiveId(initial?.id ?? entries[0].id);
        }
        isInitialCallback = false;
      },
      { rootMargin: `-${topOffset}px 0px -60% 0px`, threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));

    // Bottom-of-page: the last entry may never reach the band
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
          setActiveId(entries[entries.length - 1].id);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [entries, sectionRefs, hasEntries, topOffset]);

  // Outside tap + Escape collapse
  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hoverSuppressed.current = true;
        setExpanded(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expanded]);

  if (!hasEntries || !mounted) return null;

  const jumpTo = (id: string) => {
    const el = sectionRefs.current?.get(id);
    if (!el) return;
    // A later hero's in-flow sentinel takes no height (StickyHeroStack), so
    // land it above the header by the pinned hero's height: the section's
    // first lines then sit just below the pinned hero instead of under it
    const heroId = el.getAttribute('data-hero-sentinel');
    const pinned = heroId ? document.querySelector(`[data-hero-display="${CSS.escape(heroId)}"]`) : null;
    const pinnedHeight = pinned && el.offsetHeight === 0 ? pinned.getBoundingClientRect().height : 0;
    // Land below the sticky cover band when there is one (readPinLine)
    const top = el.getBoundingClientRect().top + window.scrollY - readPinLine(topOffset) - pinnedHeight;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    setActiveId(id);
    setExpanded(false);
  };

  // Portal to body: ancestors carry persistent transforms (page-transition
  // animation fill), which would re-anchor position:fixed to the article.
  return createPortal(
    <nav
      ref={containerRef}
      aria-label="Article outline"
      className="fixed bottom-[calc(50%+40px)] right-3 z-40 md:right-5"
      // Hover-expand only on devices that hover — on touch, the tap's
      // synthetic mouseenter would expand and the click would toggle it
      // straight back closed.
      onMouseEnter={() => {
        if (window.matchMedia('(hover: hover)').matches && !hoverSuppressed.current) {
          setExpanded(true);
        }
      }}
      onMouseLeave={() => {
        if (window.matchMedia('(hover: hover)').matches) {
          hoverSuppressed.current = false;
          setExpanded(false);
        }
      }}
    >
      {/* Rest state: tick marks */}
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={expanded}
        aria-controls="outline-rail-panel"
        aria-label="Article outline"
        onClick={() => setExpanded((v) => !v)}
        className="-m-2 flex flex-col items-end gap-[7px] p-2"
      >
        {entries.map((entry) => (
          <span
            key={entry.id}
            aria-hidden="true"
            className={`block h-[2px] w-5 origin-right rounded-full transition-transform duration-200 motion-reduce:transition-none ${
              entry.id === activeId
                ? 'scale-x-100'
                : entry.depth === 0
                  ? 'scale-x-[0.55]'
                  : entry.depth === 1
                    ? 'scale-x-[0.4]'
                    : 'scale-x-[0.3]'
            }`}
            style={{
              backgroundColor: entry.id === activeId ? colorValue : 'var(--text-muted)',
              opacity: entry.id === activeId ? 1 : 0.35,
            }}
          />
        ))}
      </button>

      {/* Expanded outline panel */}
      {expanded && (
        <div
          id="outline-rail-panel"
          className="widget-panel-enter absolute bottom-0 right-0 max-h-[calc(50vh-120px)] w-64 max-w-[calc(100vw-4rem)] overflow-y-auto rounded-xl border p-2 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: `${colorValue}66`,
            boxShadow: 'var(--depth-floating)',
          }}
        >
          {entries.map((entry) => {
            const Icon = iconByName(entry.icon);
            return (
              <button
                key={entry.id}
                type="button"
                aria-current={entry.id === activeId ? 'true' : undefined}
                onClick={() => jumpTo(entry.id)}
                className="block w-full truncate rounded-md px-3 py-2 text-left font-google-sans-code text-xs transition-colors hover:bg-background-highlight motion-reduce:transition-none"
                style={{
                  paddingLeft: `${12 + entry.depth * 12}px`,
                  color: entry.id === activeId ? colorValue : 'var(--text-muted)',
                  fontWeight: entry.id === activeId ? 700 : 400,
                }}
              >
                {Icon && <Icon size={16} className="mr-2 inline-block align-[-3px]" />}
                {entry.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>,
    document.body
  );
};

export default OutlineRail;

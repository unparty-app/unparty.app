'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { UNPPP_NAV_ITEMS } from '../constants/unpppNav';
import { SITE_PAGES, SPACES, type PageNav } from '../constants/pageNav';
import { FOUNDER_PROJECTS } from '../constants/organization';
import { getTypeCounts } from '../utils/unpppDataAdapter';
import { useTrayAnchor } from '../hooks/useTrayAnchor';
import { useHydrated } from '@/hooks/useHydrated';

/**
 * WidgetDock-style tray for the unppp nav pills, anchored to the Header next
 * to the adaptive logo dropdown. The pills lived in the always-visible Banner
 * bar; the Banner now carries the active article's byline instead, so the
 * nav collapsed into this on-demand tray.
 *
 * The expanded tray portals to document.body with viewport coordinates —
 * .navbar-container carries a perspective transform that re-anchors
 * absolutely/fixed-positioned descendants, the same reason the Header's
 * breadcrumb dropdown portals (Header.tsx).
 *
 * After the types, the owner's spaces (party, admin) always have a place. Until
 * the owner has a project (FoundersConfig `projects`), the site's own pages
 * (founders, about, build, connect) stand in for the types.
 */
const UnpppNavTray = () => {
  const { colorValue } = useTheme();
  const pathname = usePathname();
  const typeCounts = getTypeCounts();
  const [expanded, setExpanded] = useState(false);
  // Portal target (document.body) isn't available until hydrated
  const mounted = useHydrated();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const anchor = useTrayAnchor(toggleRef, expanded);

  // Outside click closes
  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        trayRef.current && !trayRef.current.contains(target) &&
        toggleRef.current && !toggleRef.current.contains(target)
      ) {
        setExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [expanded]);

  // Escape closes and refocuses the trigger
  useEffect(() => {
    if (!expanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpanded(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expanded]);

  const pillBase = [
    'inline-flex shrink-0 items-center gap-0 rounded-full',
    'border',
    'border-[var(--theme-color)]',
    'px-2.5 py-1.5 text-xs font-vt323 uppercase tracking-wide',
    'transition-all duration-200',
    'sm:px-3 sm:py-2 sm:text-sm',
  ].join(' ');

  // A named page's pill; `order` staggers it in with the others
  const pagePill = (page: PageNav, order: number) => {
    const Icon = page.icon;
    const isActive = pathname === page.href || pathname.startsWith(`${page.href}/`);
    return (
      <Link
        key={page.href}
        href={page.href}
        tabIndex={expanded ? 0 : -1}
        onClick={() => setExpanded(false)}
        className={`${pillBase} shadow-md backdrop-blur-md ${isActive ? '' : 'hover:bg-[var(--theme-color)]/5'}`}
        style={{
          backgroundColor: isActive ? colorValue : 'var(--background)',
          color: isActive ? '#000' : 'var(--foreground)',
          '--theme-color': colorValue,
          transitionDelay: expanded ? `${order * 30}ms` : '0ms',
        } as React.CSSProperties}
      >
        <Icon className="size-3 sm:size-3.5" style={{ color: isActive ? '#000' : colorValue }} />
        <div className="mx-1.5 h-3 w-px sm:mx-2" style={{ backgroundColor: colorValue, opacity: 0.3 }} />
        <span>{page.label}.</span>
      </Link>
    );
  };

  const hasProjects = FOUNDER_PROJECTS.length > 0;

  const tray = mounted
    ? createPortal(
        <div
          ref={trayRef}
          id="unppp-nav-tray"
          role="group"
          aria-label="unppp navigation"
          className={`fixed flex flex-col items-start gap-2 transition-[opacity,transform,visibility] duration-200 ease-out ${
            expanded ? 'visible scale-100 opacity-100' : 'invisible -translate-y-2 scale-95 opacity-0'
          }`}
          style={{ top: '4rem', left: anchor?.left ?? 16, zIndex: 9999 }}
        >
          {!hasProjects && SITE_PAGES.map(pagePill)}
          {hasProjects && UNPPP_NAV_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const count = typeCounts[item.category] || 0;
            const href = `/unppp/${item.category}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            // Show pill only if there are repositories of this type
            if (count === 0) return null;

            return (
              <Link
                key={item.category}
                href={href}
                tabIndex={expanded ? 0 : -1}
                onClick={() => setExpanded(false)}
                className={`${pillBase} shadow-md backdrop-blur-md ${isActive ? '' : 'hover:bg-[var(--theme-color)]/5'}`}
                style={{
                  backgroundColor: isActive ? colorValue : 'var(--background)',
                  color: isActive ? '#000' : 'var(--foreground)',
                  '--theme-color': colorValue,
                  transitionDelay: expanded ? `${i * 30}ms` : '0ms',
                } as React.CSSProperties}
              >
                <Icon className="size-3 sm:size-3.5" style={{ color: isActive ? '#000' : colorValue }} />
                <div className="mx-1.5 h-3 w-px sm:mx-2" style={{ backgroundColor: colorValue, opacity: 0.3 }} />
                <span>{item.label}</span>
                <div className="mx-1.5 h-3 w-px sm:mx-2" style={{ backgroundColor: colorValue, opacity: 0.3 }} />
                <span className="font-vt323 opacity-70">{count}</span>
              </Link>
            );
          })}
          {/* The owner's spaces, always here: a hairline, then party and admin */}
          <div className="my-0.5 h-px w-10" style={{ backgroundColor: colorValue, opacity: 0.4 }} aria-hidden="true" />
          {SPACES.map((space, i) => pagePill(space, (hasProjects ? UNPPP_NAV_ITEMS.length : SITE_PAGES.length) + i))}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={toggleRef}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="unppp-nav-tray"
        aria-label={expanded ? 'Close unppp navigation' : 'Open unppp navigation'}
        className="flex size-12 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
        style={{ backgroundColor: colorValue }}
      >
        <Image
          src="/icon-peace.webp"
          alt=""
          width={32}
          height={32}
          className={`size-8 rounded-full object-cover transition-transform duration-200 motion-reduce:transition-none ${expanded ? 'rotate-45' : ''}`}
        />
      </button>

      {tray}
    </>
  );
};

export default UnpppNavTray;

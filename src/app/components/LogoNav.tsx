'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useSmartNavigation } from '../hooks/useSmartNavigation';
import { useTrayAnchor } from '../hooks/useTrayAnchor';
import UnpppCircle from './UnpppCircle';
import { useHydrated } from '@/hooks/useHydrated';

/**
 * Fish logo trigger + recent-pages tray, built to the same WidgetDock-style
 * pattern as UnpppNavTray: a circular toggle button that portals a floating
 * pill list to document.body (see UnpppNavTray.tsx for why the portal is
 * needed — .navbar-container's perspective transform re-anchors fixed
 * descendants otherwise).
 */

const LogoNav = () => {
  const { colorValue } = useTheme();
  const router = useRouter();
  const smartNav = useSmartNavigation();
  const [expanded, setExpanded] = useState(false);
  const mounted = useHydrated();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const anchor = useTrayAnchor(toggleRef, expanded);

  // Portal target (document.body) isn't available until after mount.

  // Outside click closes
  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        navRef.current && !navRef.current.contains(target) &&
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

  const handleNavigate = (pathname: string) => {
    router.push(pathname);
    setExpanded(false);
  };

  const nav = mounted
    ? createPortal(
        <div
          ref={navRef}
          id="unparty-logo-nav"
          role="group"
          aria-label="recent pages"
          className={`fixed flex flex-col items-end gap-2 transition-[opacity,transform,visibility] duration-200 ease-out ${
            expanded ? 'visible scale-100 opacity-100' : 'invisible -translate-y-2 scale-95 opacity-0'
          }`}
          style={{ top: '4rem', right: anchor?.rightOffset ?? 16, zIndex: 9999 }}
        >
          {smartNav.menuItems.map((item, i) => {
            const isActive = item.isCurrentPage;

            return (
              <button
                key={item.pathname}
                tabIndex={expanded ? 0 : -1}
                onClick={() => handleNavigate(item.pathname)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 font-vt323 text-sm uppercase tracking-wide shadow-md backdrop-blur-md transition-all duration-200 ${
                  isActive ? 'font-bold' : 'hover:bg-[var(--theme-color)]/5'
                }`}
                style={{
                  backgroundColor: isActive ? item.color : 'var(--background)',
                  borderColor: item.color,
                  color: isActive ? '#000' : 'var(--foreground)',
                  '--theme-color': item.color,
                  transitionDelay: expanded ? `${i * 30}ms` : '0ms',
                } as React.CSSProperties}
              >
                <UnpppCircle src={item.coverSrc} color={item.color} alt="" size={20} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  if (!smartNav.showDropdown) {
    // No breadcrumb history yet - inert logo, matches the toggle button's shape.
    return (
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-full shadow-md"
        style={{ backgroundColor: colorValue }}
      >
        <Image
          src="/icon-logo-fish.png"
          alt="unparty.app fish out of water Logo"
          width={28}
          height={28}
          className="size-6 object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <>
      <button
        ref={toggleRef}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="unparty-logo-nav"
        aria-label={expanded ? 'Close recent pages' : 'Open recent pages'}
        className="flex size-12 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
        style={{ backgroundColor: colorValue }}
      >
        <Image
          src="/icon-logo-fish.png"
          alt="unparty.app fish out of water Logo"
          width={28}
          height={28}
          className={`size-6 object-contain transition-transform duration-200 motion-reduce:transition-none ${expanded ? 'rotate-45' : ''}`}
          priority
        />
      </button>

      {nav}
    </>
  );
};

export default LogoNav;

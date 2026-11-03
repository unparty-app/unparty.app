'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from '@/app/components/icons';
import { useUser } from '@/lib/auth-stub.client';
import { useTheme } from '../contexts/ThemeContext';
import { WAITLIST_ON } from '../constants/organization';
import { WIDGETS, type WidgetConfig } from './widgetRegistry';
import WidgetPanel from './WidgetPanel';

const WidgetDock = () => {
  const { colorValue } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Where a visitor was heading when a link opened a space's demo instead: the
  // demo's sign-in returns the site's owner there
  const [next, setNext] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const active = WIDGETS.find((w) => w.id === activeId) ?? null;
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();

  // Whether this visitor can open a space's page, by the middleware's own
  // rules: party needs sign-in (and approval, when the waitlist is on),
  // admin an admin. Everyone else gets the space's demo in the panel
  const canOpen = (widget: WidgetConfig) => {
    if (widget.kind !== 'space' || widget.opens === 'anyone') return true;
    if (!isSignedIn) return false;
    const meta = user?.publicMetadata as { role?: string; waitlistStatus?: string } | undefined;
    const admin = meta?.role === 'admin';
    if (widget.opens === 'admin') return admin;
    return !WAITLIST_ON || admin || meta?.waitlistStatus === 'approved';
  };
  const open = (widget: WidgetConfig) => {
    if (widget.kind === 'space' && canOpen(widget)) router.push(widget.href);
    else {
      setNext(widget.kind === 'space' ? widget.href : null);
      setActiveId(widget.id);
    }
  };

  // While the tray is open it's what's in use: the page's prev/next arrows,
  // which sit at the same edge, step aside (globals.css .page-navigation)
  useEffect(() => {
    document.documentElement.toggleAttribute('data-tray-open', expanded);
    return () => document.documentElement.removeAttribute('data-tray-open');
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [expanded]);

  // Plain left-clicks on any link targeting a widget's URL open that widget's
  // panel instead of navigating; modified clicks keep normal browser behavior.
  // A link into a space this visitor can't open yet (/admin, /party: a
  // challenge's SETUP. step, an article's "write it here") opens that space's
  // demo instead of the sign-in wall, ending on sign in for the site's owner.
  // Capture phase, so it's ahead of a Next <Link>'s own navigation; and only
  // once sign-in has loaded, so the owner never sees a demo flash
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element).closest?.('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      const frame = WIDGETS.find((w) => w.kind === 'frame' && (href === w.src || href.startsWith(`${w.src}/`)));
      if (frame) {
        e.preventDefault();
        setActiveId(frame.id);
        return;
      }
      if (!isLoaded) return;
      let path: string;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        path = `${url.pathname}${url.search}${url.hash}`;
      } catch {
        return;
      }
      const space = WIDGETS.find((w) => w.kind === 'space' && w.opens !== 'anyone' && inSpace(path, w.href));
      if (!space || canOpen(space)) return;
      e.preventDefault();
      setNext(path);
      setActiveId(space.id);
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
    // canOpen reads isSignedIn and user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user]);

  if (WIDGETS.length === 0) return null;

  return (
    <>
      {/* Utility widget tray — sits above Fab (bottom-4), Fab stays separate.
          Toggle and items use the dock's circle recipe (2px theme ring, 4px
          background gap, theme-color disc), centered over the Fab's right end */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <div
          ref={dockRef}
          className="pointer-events-none absolute bottom-20 right-5 flex flex-col-reverse items-center gap-3 sm:bottom-[88px] sm:right-6"
          onKeyDown={(e) => {
            if (e.key === 'Escape' && expanded) {
              setExpanded(false);
              toggleRef.current?.focus();
            }
          }}
        >
          <button
            ref={toggleRef}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="widget-dock-list"
            aria-label={expanded ? 'Close widget tray' : 'Open widget tray'}
            // The column around it lets clicks through; only the toggle and,
            // while open, the tray take them
            className="pointer-events-auto flex size-12 items-center justify-center rounded-full border-2 p-1 shadow-md transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
            style={{ backgroundColor: 'var(--background)', borderColor: colorValue }}
          >
            <span className="flex size-full items-center justify-center rounded-full" style={{ backgroundColor: colorValue }}>
              <Plus
                className={`size-5 transition-transform duration-200 motion-reduce:transition-none ${expanded ? 'rotate-45' : ''}`}
                style={{ color: 'var(--background)' }}
              />
            </span>
          </button>

          <div
            id="widget-dock-list"
            role="group"
            aria-label="Widgets"
            // Closed, its invisible column lets clicks through to the page.
            // On a short screen (a phone on its side) the tray scrolls within
            // the space between the header and the toggle instead of running up
            // into the header
            className={`no-scrollbar flex max-h-[calc(100dvh-14rem)] flex-col-reverse items-center gap-3 overflow-y-auto p-1 sm:max-h-[calc(100dvh-15rem)] [&>*]:shrink-0 ${expanded ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            {WIDGETS.map((widget, i) => (
              <button
                key={widget.id}
                tabIndex={expanded ? 0 : -1}
                aria-label={`Open ${widget.label}`}
                onClick={() => {
                  open(widget);
                  setExpanded(false);
                }}
                className={`flex size-12 items-center justify-center rounded-full border-2 p-1 shadow-md transition-[opacity,transform,visibility] duration-200 ease-out hover:scale-105 motion-reduce:transition-none ${
                  expanded
                    ? 'visible scale-100 opacity-100'
                    : 'invisible translate-y-2 scale-75 opacity-0'
                }`}
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: colorValue,
                  transitionDelay: expanded ? `${i * 30}ms` : '0ms',
                }}
              >
                <span className="flex size-full items-center justify-center rounded-full" style={{ backgroundColor: colorValue }}>
                  <widget.icon className="size-5" style={{ color: 'var(--background)' }} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {active && (
        <WidgetPanel
          widget={active}
          next={next}
          onClose={() => {
            setActiveId(null);
            toggleRef.current?.focus();
          }}
        />
      )}
    </>
  );
};

export default WidgetDock;

// A path inside a space: /admin, /admin/stories?…, /admin#site, not /administer
function inSpace(path: string, space: string): boolean {
  return path.startsWith(space) && (path.length === space.length || /^[/?#]/.test(path.slice(space.length)));
}

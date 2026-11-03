"use client";

import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useTrayAnchor } from '../hooks/useTrayAnchor';
import { useHydrated } from '@/hooks/useHydrated';
import { useUser } from '@/lib/auth-stub.client';
import { BRAND_COLORS } from '../constants/organization';

type Hsl = [h: number, s: number, l: number];

const toHsl = (hex: string): Hsl | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};

// Softened to the start circle's register: mid lightness, moderate saturation
const soft = ([h, s, l]: Hsl) =>
  `hsl(${Math.round(h)} ${Math.round(Math.min(0.7, Math.max(0.35, s)) * 100)}% ${Math.round(Math.min(0.74, Math.max(0.6, l)) * 100)}%)`;

/**
 * The mood button's face: a soft two-hue, left-to-right gradient in the
 * register of the StartCircle's (/start-gradient.svg),
 * made from this cover's palette. It takes the two real hues furthest apart
 * (grays and near-black/white have no hue to offer, and would read as a
 * false pink), softened to mid lightness. A one-hue palette pairs its most
 * saturated color with a neighbour 30deg around the wheel, so it stays in
 * that cover's color family instead of going flat.
 */
function moodGradient(palette: string[], fallback: string): string {
  const hues = palette
    .map(toHsl)
    .filter((c): c is Hsl => c !== null && c[1] >= 0.15 && c[2] > 0.12 && c[2] < 0.93);
  if (hues.length === 0) {
    const base = toHsl(fallback);
    return base ? `linear-gradient(90deg, ${soft(base)}, ${soft([(base[0] + 330) % 360, base[1], base[2]])})` : fallback;
  }

  let pair: [Hsl, Hsl] | null = null;
  let widest = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const apart = Math.abs(hues[i][0] - hues[j][0]);
      const distance = Math.min(apart, 360 - apart);
      if (distance > widest) {
        widest = distance;
        pair = [hues[i], hues[j]];
      }
    }
  }
  if (!pair || widest < 25) {
    const richest = hues.reduce((a, b) => (b[1] > a[1] ? b : a));
    pair = [richest, [(richest[0] + 330) % 360, richest[1], richest[2]]];
  }
  return `linear-gradient(90deg, ${soft(pair[0])}, ${soft(pair[1])})`;
}

interface ColorBoxProps {
  colorKey: string;
  colorValue: string;
  isSelected: boolean;
  // Widget-tray reveal (same pattern as WidgetDock items): swatches animate
  // in with a stagger and are removed from hit-testing/tab order when closed.
  expanded: boolean;
  delayMs: number;
  onClick: () => void;
}

// Same recipe as the dock's circles: 2px ring, 4px background gap, then the
// color. The selected swatch wears the theme ring; the others show theirs on
// hover. The faint inner edge keeps near-black swatches visible on dark pages.
const ColorBox: React.FC<ColorBoxProps & { ringColor: string }> = ({ colorKey, colorValue, isSelected, expanded, delayMs, onClick, ringColor }) => {
  return (
    <button
      aria-label={`Select color ${colorKey}`}
      aria-pressed={isSelected}
      tabIndex={expanded ? 0 : -1}
      className={`flex size-11 items-center justify-center rounded-full border-2 p-1 shadow-md transition-[opacity,transform,visibility,border-color] duration-200 ease-out hover:scale-110 motion-reduce:transition-none ${
        isSelected ? '' : 'border-transparent hover:border-[var(--theme-color,#f9c22e)]'
      } ${expanded ? 'visible scale-100 opacity-100' : 'invisible -translate-y-2 scale-75 opacity-0'}`}
      style={{
        backgroundColor: 'var(--background)',
        ...(isSelected && { borderColor: ringColor }),
        transitionDelay: expanded ? `${delayMs}ms` : '0ms',
      }}
      onClick={onClick}
      title={colorKey}
    >
      <span className="size-full rounded-full" style={{ backgroundColor: colorValue, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }} />
    </button>
  );
};

interface ThemeColorPickerProps {
  // Raw hex strings (e.g. an article cover's palette). When provided,
  // replaces the named theme-palette swatches below; falls back to the
  // existing named palette when omitted or empty.
  colors?: string[];
  /** Where the swatch column opens: below the trigger (default), or above it
   * when the trigger sits at the bottom of the screen (the Banner dock). */
  placement?: 'below' | 'above';
}

export default function ThemeColorPicker({ colors, placement = 'below' }: ThemeColorPickerProps = {}) {
  const { colorPalette, selectedColor, setSelectedColor, colorValue } = useTheme();
  const { isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mounted = useHydrated();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const anchor = useTrayAnchor(triggerRef, isOpen);
  // Pages can mount several pickers (e.g. hero + byline) — the list id must be
  // unique per instance or aria-controls points at the wrong portal.
  const listId = useId();

  // Portal target (document.body) isn't available until after mount.

  // Check if we're on mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Initial check
    checkIsMobile();

    // Add resize listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Outside click closes (the swatch list portals to document.body, so check
  // both the trigger and the list — same pattern as UnpppNavTray)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        listRef.current && !listRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // Escape closes and refocuses the trigger
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // List of allowed color keys (used only when no cover-derived `colors` are passed)
  const allowedColors = [
    'brandwhite',
    'electricPurple',
    'astroblack',
    'pinkyblack',
    'starblack',
    'pushblack',
    'champion',
    'healpurple',
    'coolblue',
    'keepgoing',
  ];

  // The owner's brand colors (FoundersConfig) lead, then the named moods,
  // leaving out any the brand colors already offer
  const brand = BRAND_COLORS.map((hex) => ({ key: hex, value: hex }));
  const brandHexes = new Set(BRAND_COLORS.map((hex) => hex.toLowerCase()));
  const swatches = colors && colors.length > 0
    ? colors.map((hex) => ({ key: hex, value: hex }))
    : [
        ...brand,
        ...Object.entries(colorPalette)
          .filter(([key, value]) => allowedColors.includes(key) && !brandHexes.has(value.toLowerCase()))
          .map(([key, value]) => ({ key, value })),
      ];

  // Color swatches — widget-tray style vertical column dropping below the
  // trigger (or rising above it, placement="above"), right-anchored so it stays on-screen when the button sits at the
  // far edge of a row (e.g. the banner byline). Portals to document.body with
  // a measured anchor, same pattern as UnpppNavTray/LogoNav — ancestor
  // transforms (page-transition wrapper, navbar perspective) re-anchor fixed
  // descendants otherwise.
  const swatchList = mounted
    ? createPortal(
        <div
          ref={listRef}
          id={listId}
          role="group"
          aria-label="Theme colors"
          className={`fixed flex ${placement === 'above' ? 'flex-col-reverse' : 'flex-col'} items-center gap-2 transition-[opacity,visibility] duration-200 ease-out ${
            isOpen ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
          style={{
            ...(placement === 'above'
              ? { bottom: (typeof window === 'undefined' ? 0 : window.innerHeight) - (anchor?.top ?? 0) + 8 }
              : { top: (anchor?.bottom ?? 0) + 8 }),
            right: anchor?.rightOffset ?? 16,
            zIndex: 9999,
          }}
        >
          {swatches.map(({ key, value }, i) => (
            <ColorBox
              key={key}
              colorKey={key}
              colorValue={value}
              // Cover palettes are raw hex, so also match the live theme color
              isSelected={key === selectedColor || value === selectedColor || value.toLowerCase() === colorValue.toLowerCase()}
              ringColor={colorValue}
              expanded={isOpen}
              delayMs={i * 30}
              onClick={() => {
                setSelectedColor(key);
                setIsOpen(false);
              }}
            />
          ))}
          {/* Signed in, ThemeContext also saves the choice to the Clerk
              account (unsafeMetadata), where other apps on the same sign-in
              read it (#735). Say so, at the far end of the swatches */}
          {isSignedIn && (
            <p
              className="self-end whitespace-nowrap rounded-full border px-2 py-0.5 font-google-sans-code text-[10px] lowercase"
              style={{ backgroundColor: 'var(--background)', borderColor: colorValue, color: 'var(--text-muted)' }}
            >
              saved to your account
            </p>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      {/* Selected color button */}
      <div className="group relative">
        {/* The dock's circle recipe (ring, gap) around a gradient of what it
            offers: this cover's palette, the way the start circle holds its
            gradient */}
        <button
          ref={triggerRef}
          aria-label="Change theme color"
          aria-expanded={isOpen}
          aria-controls={listId}
          className={`flex size-11 items-center justify-center rounded-full border-2 p-1 transition-transform duration-200 hover:scale-105 motion-reduce:transition-none sm:size-12 ${isOpen ? 'scale-105' : ''}`}
          style={{ backgroundColor: 'var(--background)', borderColor: colorValue }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="size-full rounded-full" style={{ background: moodGradient(swatches.map(({ value }) => value), colorValue) }} />
        </button>
        <div className={`absolute ${
          placement === 'above'
            ? (isMobile ? '-top-8 right-0' : '-top-8 left-1/2 -translate-x-1/2')
            : isMobile
              ? '-bottom-8 left-0'
              : '-bottom-8 left-1/2 -translate-x-1/2'
        } invisible z-50 whitespace-nowrap bg-black/80 px-2 py-1 font-vt323 text-xs uppercase text-white opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 ${isOpen ? 'hidden' : ''}`}>
          MOOD.
        </div>
      </div>

      {swatchList}
    </div>
  );
}
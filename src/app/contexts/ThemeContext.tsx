"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { colors, palette, RENAMED_COLORS, BRAND_COLOR } from '../constants/colors';
import { useUser } from '@/lib/auth-stub.client';
import { useHydrated } from '@/hooks/useHydrated';
import { useLocalStorageValue, writeLocalStorage } from '@/hooks/useLocalStorage';

type ThemeContextType = {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  colorValue: string;
  colorPalette: typeof palette;
  allColors: typeof colors;
  /** Try a brand color on the whole site without saving it anywhere (the
   * brand color setup); null puts the site back */
  setPreviewColor: (color: string | null) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Lets an arbitrary cover-derived hex act as the active theme color, not
// just the fixed named palette keys.
const HEX_COLOR_RE = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

// A color saved under its old name (see RENAMED_COLORS) reads as the new one;
// the new name is then written back to localStorage and Clerk
function renamedColor<T extends string | null | undefined>(color: T): T | string {
  return (color && RENAMED_COLORS[color]) || color;
}

function isKnownColor(color: string | null | undefined): color is string {
  return !!color && (Object.hasOwn(palette, color) || HEX_COLOR_RE.test(color));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser();
  // Explicit choice made in this session; otherwise fall back as below
  const [pickedColor, setSelectedColor] = useState<string | null>(null);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const storedColor = renamedColor(useLocalStorageValue('unpartySelectedColor'));
  const hydrated = useHydrated();
  const hasLoadedInitial = userLoaded && hydrated;

  // Initial color: prefer the signed-in user's synced choice (this is what
  // makes it readable from any Clerk satellite app, e.g. theunpartycloud,
  // since they share the same Clerk user), falling back to this browser's
  // localStorage, then the default.
  const metadataColor = renamedColor(user?.unsafeMetadata?.selectedColor as string | undefined);
  const selectedColor =
    pickedColor ??
    (isKnownColor(metadataColor) ? metadataColor : null) ??
    (isKnownColor(storedColor) ? storedColor : null) ??
    'brand';

  // Store the selection when it changes: always to localStorage (works
  // signed-out too, and repaints instantly on next visit before Clerk loads).
  useEffect(() => {
    if (!hasLoadedInitial) return; // don't stomp the value we just loaded
    writeLocalStorage('unpartySelectedColor', selectedColor);
  }, [selectedColor, hasLoadedInitial]);

  const chosenColorValue = palette[selectedColor as keyof typeof palette]
    || (HEX_COLOR_RE.test(selectedColor) ? selectedColor : palette.brand);
  // A brand color being tried on wins while it lasts; it's never stored
  const colorValue = previewColor ?? chosenColorValue;

  // Also sync to the Clerk user's unsafeMetadata when signed in, so any
  // Clerk satellite app (e.g. theunpartycloud) can read the same choice —
  // localStorage alone is per-origin and doesn't cross subdomains.
  useEffect(() => {
    if (!hasLoadedInitial || !user) return;
    if (user.unsafeMetadata?.selectedColor === selectedColor) return; // already in sync
    user
      .update({
        unsafeMetadata: { ...user.unsafeMetadata, selectedColor, selectedColorHex: chosenColorValue },
      })
      .catch((error) => {
        console.error('Failed to sync theme color to Clerk metadata:', error);
      });
  }, [selectedColor, chosenColorValue, user, hasLoadedInitial]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-color', colorValue);
      // The glows and accents (globals.css --brand-color) follow a tried-on brand color too
      document.documentElement.style.setProperty('--brand-color', previewColor ?? BRAND_COLOR);
      // Keep the browser-chrome tint (phone status bar area) on the mood
      // color too — layout.tsx renders the initial meta tag via its
      // `viewport` export.
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = colorValue;
    }
  }, [colorValue, previewColor]);

  const value = useMemo(
    () => ({
      selectedColor,
      setSelectedColor,
      colorValue,
      colorPalette: palette,
      allColors: colors,
      setPreviewColor,
    }),
    [selectedColor, colorValue]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
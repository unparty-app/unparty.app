'use client';

import React, { createContext, useContext } from 'react';

type ArticleBackgroundContextType = {
  backgroundOverride: string | null;
  setBackgroundOverride: (hex: string | null) => void;
};

const ArticleBackgroundContext = createContext<ArticleBackgroundContextType | undefined>(undefined);

// Scoped to a single article's render tree (provided by EditorialArticle),
// independent of ThemeContext's global mood color — this only ever paints
// the article's own background, never document.documentElement or
// localStorage/Clerk.
export function ArticleBackgroundProvider({
  backgroundOverride,
  setBackgroundOverride,
  children,
}: {
  backgroundOverride: string | null;
  setBackgroundOverride: (hex: string | null) => void;
  children: React.ReactNode;
}) {
  const value = { backgroundOverride, setBackgroundOverride };
  return (
    <ArticleBackgroundContext.Provider value={value}>
      {children}
    </ArticleBackgroundContext.Provider>
  );
}

// Embedded components (e.g. BrandPalette) call this to recolor the page
// they're rendered in. Unlike useTheme/useCover, this doesn't throw when
// there's no provider above it — BrandPalette also renders in places outside
// an EditorialArticle tree (previews, the founders page), where recoloring
// simply isn't available.
export function useArticleBackground(): ArticleBackgroundContextType {
  const context = useContext(ArticleBackgroundContext);
  return context ?? { backgroundOverride: null, setBackgroundOverride: () => {} };
}

// Same "which text reads legibly on this background" formula used by the OG
// image route (src/app/api/og/route.tsx's isColorDark) — kept local here
// since that file is a server image route, not something to import into
// client components.
function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function getContrastForeground(hex: string): string {
  // Reuse the app's existing light/dark foreground tokens (globals.css)
  // rather than introducing new hardcoded black/white values.
  return isColorDark(hex) ? '#ededed' : '#171717';
}

// Muted counterpart of getContrastForeground — mirrors globals.css, where
// --text-muted is the mode's foreground at 0.8 alpha. Overriding the article
// background remaps this alongside --foreground so secondary copy (like
// BrandPalette's swatch name labels) stays legible on any tapped color.
export function getContrastTextMuted(hex: string): string {
  return isColorDark(hex) ? 'rgba(237, 237, 237, 0.8)' : 'rgba(23, 23, 23, 0.8)';
}

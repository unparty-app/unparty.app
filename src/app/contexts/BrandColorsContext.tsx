'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useBrandColors, type BrandColors } from '../hooks/useBrandColors';

export type { BrandColors };

interface BrandColorsContextType {
  brandColors: BrandColors | null;
  loading: boolean;
}

const BrandColorsContext = createContext<BrandColorsContextType | undefined>(undefined);

/**
 * Fetches the signed-in user's saved brand palette once (via useBrandColors)
 * and shares it with every descendant through context — so a layout and the
 * pages it wraps can both read it without triggering a second
 * /api/user/brand-colors request each.
 */
export function BrandColorsProvider({ children }: { children: ReactNode }) {
  const { brandColors, loading } = useBrandColors();

  return (
    <BrandColorsContext.Provider value={{ brandColors, loading }}>
      {children}
    </BrandColorsContext.Provider>
  );
}

export function useBrandColorsContext(): BrandColorsContextType {
  const context = useContext(BrandColorsContext);
  if (!context) {
    throw new Error('useBrandColorsContext must be used within BrandColorsProvider');
  }
  return context;
}

'use client';
import { createContext, useCallback, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useUser } from '@/lib/auth-stub.client';
import { useFetch } from '@/hooks/useFetch';
import { useHydrated } from '@/hooks/useHydrated';
import { useLocalStorageValue, writeLocalStorage } from '@/hooks/useLocalStorage';
import { paletteToColorSlots, ParsedCssBrandInfo, ParsedCssPalette } from '../utils/importColorsCss';

interface ColorSelectionContextType {
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  customColors: string[];
  setCustomColors: (colors: string[]) => void;
  allColors: string[]; // Combined selected + custom colors
  brand: ParsedCssBrandInfo; // The palette's imported name, tagline and description
  setBrand: (brand: ParsedCssBrandInfo) => void;
}

const ColorSelectionContext = createContext<ColorSelectionContextType | undefined>(undefined);

interface ColorSelectionProviderProps {
  children: ReactNode;
}

function parseColors(raw: string | null, label: string): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.error(`Error parsing ${label}:`, error);
    return null;
  }
}

function parseBrand(raw: string | null): ParsedCssBrandInfo | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function hasBrandColors(palette: ParsedCssPalette | null | undefined): palette is ParsedCssPalette {
  return !!palette && !!(palette.primary || palette.secondary || palette.accent || palette.additional1 || palette.additional2);
}

export function ColorSelectionProvider({ children }: ColorSelectionProviderProps) {
  const { isSignedIn, isLoaded } = useUser();
  const hydrated = useHydrated();

  // Edits made in this session win; they're also persisted below
  const [edited, setEdited] = useState<{ selected?: string[]; custom?: string[]; brand?: ParsedCssBrandInfo }>({});
  const setSelectedColors = useCallback((colors: string[]) => setEdited(prev => ({ ...prev, selected: colors })), []);
  const setCustomColors = useCallback((colors: string[]) => setEdited(prev => ({ ...prev, custom: colors })), []);
  const setBrand = useCallback((next: ParsedCssBrandInfo) => setEdited(prev => ({ ...prev, brand: next })), []);

  // localStorage (client-side only; null during SSR/hydration)
  const storedSelectedRaw = useLocalStorageValue('personalColors');
  const storedCustomRaw = useLocalStorageValue('customColors');
  const storedBrandRaw = useLocalStorageValue('personalBrand');
  const storedSelected = useMemo(() => parseColors(storedSelectedRaw, 'saved colors'), [storedSelectedRaw]);
  const storedCustom = useMemo(() => parseColors(storedCustomRaw, 'custom colors'), [storedCustomRaw]);
  const storedBrand = useMemo(() => parseBrand(storedBrandRaw), [storedBrandRaw]);

  // For a signed-in user, their saved brand colors (UserProfile.brandColors,
  // via ImportColorsCssModal's "Save to account") win over whatever's in
  // localStorage — same precedence ThemeContext already uses for
  // selectedColor (Clerk metadata over localStorage).
  const { data: account } = useFetch<{ brandColors: (ParsedCssPalette & ParsedCssBrandInfo) | null }>(
    isLoaded && isSignedIn ? '/api/user/brand-colors' : null
  );
  const accountSlots = useMemo(
    () => (hasBrandColors(account?.brandColors) ? paletteToColorSlots(account.brandColors) : null),
    [account]
  );

  const selectedColors = useMemo(
    () => edited.selected ?? accountSlots ?? storedSelected ?? [],
    [edited.selected, accountSlots, storedSelected]
  );
  const customColors = useMemo(() => edited.custom ?? storedCustom ?? [], [edited.custom, storedCustom]);
  const brand = useMemo((): ParsedCssBrandInfo => {
    if (edited.brand) return edited.brand;
    const saved = account?.brandColors;
    if (hasBrandColors(saved)) return { name: saved.name, tagline: saved.tagline, description: saved.description };
    return storedBrand ?? {};
  }, [edited.brand, account, storedBrand]);

  // Persist the effective colors once hydrated (so SSR defaults never
  // overwrite what's stored)
  useEffect(() => {
    if (hydrated) writeLocalStorage('personalColors', JSON.stringify(selectedColors));
  }, [selectedColors, hydrated]);

  useEffect(() => {
    if (hydrated) writeLocalStorage('customColors', JSON.stringify(customColors));
  }, [customColors, hydrated]);

  useEffect(() => {
    if (hydrated) writeLocalStorage('personalBrand', JSON.stringify(brand));
  }, [brand, hydrated]);

  // Combine selected and custom colors, filter out empties. Memoized so
  // consumers keyed on this array (e.g. ColorMatchingGame's useEffect) don't
  // see a "changed" reference - and reset mid-game - on every render that
  // doesn't actually touch the colors.
  const allColors = useMemo(
    () => [
      ...selectedColors.filter(color => color && color.trim() !== ''),
      ...customColors.filter(color => color && color.trim() !== '')
    ],
    [selectedColors, customColors]
  );

  return (
    <ColorSelectionContext.Provider
      value={{
        selectedColors,
        setSelectedColors,
        customColors,
        setCustomColors,
        allColors,
        brand,
        setBrand
      }}
    >
      {children}
    </ColorSelectionContext.Provider>
  );
}

export function useColorSelection() {
  const context = useContext(ColorSelectionContext);
  if (!context) {
    throw new Error('useColorSelection must be used within ColorSelectionProvider');
  }
  return context;
}

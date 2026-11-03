'use client';
import { BrandColorsProvider } from '../contexts/BrandColorsContext';

// Next.js's App Router only recognizes a segment layout when the file is
// literally named layout.tsx — "brandLayout" is this component's name, not
// the filename. Wraps every /party route in one shared BrandColorsProvider
// fetch (see BrandColorsContext.tsx for why this is a Provider and not just
// calling useBrandColors() directly in each page).
export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <BrandColorsProvider>{children}</BrandColorsProvider>;
}

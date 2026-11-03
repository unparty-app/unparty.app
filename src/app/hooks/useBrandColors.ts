'use client';
import { useEffect, useState } from 'react';
import type { ParsedCssPalette, ParsedCssBrandInfo } from '../utils/importColorsCss';

export interface BrandColors extends ParsedCssPalette, ParsedCssBrandInfo {
  source?: string;
  savedAt?: string;
}

/**
 * The signed-in user's saved brand palette (all five roles: primary/
 * secondary/accent/additional1/additional2, plus brand name/tagline/
 * description if set) — from ImportColorsCssModal's "Save to account",
 * GET /api/user/brand-colors. Returns `brandColors: null` if the user
 * hasn't saved one yet (or isn't signed in — the route 401s, treated the
 * same as "none saved" here rather than surfaced as an error).
 */
export function useBrandColors(): { brandColors: BrandColors | null; loading: boolean } {
  const [brandColors, setBrandColors] = useState<BrandColors | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/user/brand-colors')
      .then(r => (r.ok ? r.json() : { brandColors: null }))
      .then((data: { brandColors: BrandColors | null }) => {
        if (!cancelled) setBrandColors(data?.brandColors ?? null);
      })
      .catch(() => {
        if (!cancelled) setBrandColors(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { brandColors, loading };
}

'use client';

import { useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';

const EMPTY_REGISTRY: Record<string, never> = {};

export interface StepImageRegistryEntry {
  stepId: string;
  title: string;
  word: string | null;
  completed: boolean;
}

// Looks up which of the given cover ids are registered as `stepType:
// 'photo-upload'` Steps (admin-managed via /admin/steps, keyed by
// Step.cover) - the app-wide registry that lets any gallery/ScrollRow image
// become a click-to-upload step without code changes. Unregistered covers
// are simply absent from the result and callers should render them exactly
// as they did before. Shared by ScrollRowRenderer (EditorialSection.tsx)
// and the /covers gallery (CoverImageItem/covers/page.tsx).
export function useStepImageRegistry(coverIds: string[]): Record<string, StepImageRegistryEntry> {
  const key = useMemo(() => [...new Set(coverIds)].sort().join(','), [coverIds]);
  // A failed request leaves every cover unregistered
  const { data } = useFetch<Record<string, StepImageRegistryEntry>>(
    key ? `/api/steps/by-cover?covers=${encodeURIComponent(key)}` : null
  );
  return data ?? EMPTY_REGISTRY;
}

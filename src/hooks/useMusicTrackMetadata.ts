// src/hooks/useMusicTrackMetadata.ts
import { useMemo } from 'react';
import { useAsyncData } from '@/hooks/useFetch';
import { AppleMusicTrack } from '@/types/music';
import { createTrackFromUrlAsync, createTrackFromUrl } from '@/utils/musicUtils';
import { getTrackById } from '@/utils/musicRegistry';

export interface UseMusicTrackMetadataOptions {
  /** Track ID from music registry */
  trackId?: string;
  /** Apple Music URL to fetch metadata from */
  appleUrl?: string;
  /** Whether to fetch enhanced metadata (defaults to true) */
  enhanced?: boolean;
  /** Custom ID to assign to the track */
  customId?: string;
}

export interface UseMusicTrackMetadataResult {
  /** The track data with metadata */
  track: AppleMusicTrack | null;
  /** Whether metadata is currently being fetched */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
}

/**
 * React hook for fetching Apple Music track metadata
 * 
 * Priority: 
 * 1. trackId from music registry (instant, complete metadata)
 * 2. appleUrl with enhanced=true (async, fetches from API)
 * 3. appleUrl with enhanced=false (sync, URL parsing only)
 * 
 * @example
 * ```tsx
 * // From music registry (instant)
 * const { track, loading } = useMusicTrackMetadata({ trackId: 'whitney-step-by-step' });
 * 
 * // From URL with API fetch (enhanced metadata)
 * const { track, loading } = useMusicTrackMetadata({ 
 *   appleUrl: 'https://music.apple.com/us/song/...',
 *   enhanced: true 
 * });
 * 
 * // From URL with URL parsing only (no API call)
 * const { track, loading } = useMusicTrackMetadata({ 
 *   appleUrl: 'https://music.apple.com/us/song/...',
 *   enhanced: false 
 * });
 * ```
 */
export function useMusicTrackMetadata(
  options: UseMusicTrackMetadataOptions
): UseMusicTrackMetadataResult {
  const { trackId, appleUrl, enhanced = true, customId } = options;
  
  // Priority 1 (registry) and 3 (URL parsing) are synchronous, so derive them
  const syncResult = useMemo((): UseMusicTrackMetadataResult | null => {
    if (trackId) {
      const registryTrack = getTrackById(trackId);
      if (registryTrack) return { track: registryTrack, loading: false, error: null };
      console.warn(`[useMusicTrackMetadata] Track ID "${trackId}" not found in registry`);
      return { track: null, loading: false, error: `Track "${trackId}" not found in registry` };
    }
    if (!appleUrl) {
      console.warn('[useMusicTrackMetadata] No trackId or appleUrl provided');
      return { track: null, loading: false, error: 'No track ID or Apple Music URL provided' };
    }
    if (!enhanced) {
      const parsedTrack = createTrackFromUrl(appleUrl, customId);
      return { track: parsedTrack, loading: false, error: parsedTrack ? null : 'Failed to parse track from URL' };
    }
    return null;
  }, [trackId, appleUrl, enhanced, customId]);

  // Priority 2: enhanced metadata for an Apple Music URL comes from the API
  const remote = useAsyncData(
    syncResult ? null : JSON.stringify([appleUrl, customId]),
    async (key) => {
      const [url, id] = JSON.parse(key) as [string, string | undefined];
      const fetchedTrack = await createTrackFromUrlAsync(url, id);
      if (!fetchedTrack) throw new Error('Failed to create track from URL');
      return fetchedTrack;
    }
  );

  return syncResult ?? { track: remote.data ?? null, loading: remote.loading, error: remote.error ?? null };
}

/**
 * Simplified hook for fetching a single track by registry ID
 * @param trackId - Track ID from music registry
 */
export function useRegistryTrack(trackId: string | undefined): UseMusicTrackMetadataResult {
  return useMusicTrackMetadata({ trackId });
}

/**
 * Simplified hook for fetching track metadata from Apple Music URL
 * @param appleUrl - Apple Music URL
 * @param enhanced - Whether to fetch enhanced metadata (defaults to true)
 */
export function useAppleMusicTrack(
  appleUrl: string | undefined,
  enhanced = true
): UseMusicTrackMetadataResult {
  return useMusicTrackMetadata({ appleUrl, enhanced });
}

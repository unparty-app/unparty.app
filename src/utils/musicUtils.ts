// src/utils/musicUtils.ts
import { AppleMusicTrack } from "@/types/music";
import { musicMetadataCache } from "./musicMetadataCache";

/**
 * Extract Apple Music track ID from URL
 * @param url - Apple Music URL, either an album link with the song in ?i=
 *   (https://music.apple.com/us/album/name/123?i=1234567890) or a song link
 *   (https://music.apple.com/us/song/name/1234567890)
 * @returns Track ID string (e.g., "1234567890") or empty string if not found
 */
export function extractAppleTrackId(url: string): string {
  const match = url.match(/[?&]i=(\d+)/) ?? url.match(/\/song\/[^/?#]+\/(\d+)/);
  return match?.[1] ?? "";
}

/**
 * Create an AppleMusicTrack object from an Apple Music URL
 * Attempts to extract artist and title from URL path, with fallback to generic labels
 * @param url - Apple Music URL
 * @param id - Optional custom ID for the track object (defaults to track ID)
 * @returns AppleMusicTrack object
 */
export function createTrackFromUrl(url: string, id?: string): AppleMusicTrack | null {
  const trackId = extractAppleTrackId(url);
  
  if (!trackId) {
    console.warn('[musicUtils] Could not extract track ID from URL:', url);
    return null;
  }

  // Try to extract artist and title from URL path
  // Format: https://music.apple.com/us/album/song-name/album-id?i=track-id
  // or: https://music.apple.com/us/song/song-name/track-id
  // Note: Artist information is not available in URL, always returns "Unknown Artist"
  // Use createTrackFromUrlAsync() for complete metadata from Apple Music API
  const artist = "Unknown Artist";
  let title = "Unknown Track";

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    // Check if it's a song or album URL
    if (pathParts.includes('song') && pathParts.length >= 3) {
      // Format: /us/song/song-name/track-id
      const songNameSlug = pathParts[pathParts.indexOf('song') + 1];
      title = slugToTitle(songNameSlug);
    } else if (pathParts.includes('album') && pathParts.length >= 3) {
      // Format: /us/album/song-name/album-id
      const songNameSlug = pathParts[pathParts.indexOf('album') + 1];
      title = slugToTitle(songNameSlug);
    }
  } catch (error) {
    console.warn('[musicUtils] Error parsing URL for metadata:', error);
  }

  return {
    id: id || `track-${trackId}`,
    artist,
    title,
    appleUrl: url,
    appleTrackId: trackId
  };
}

/**
 * Convert URL slug to title case
 * @param slug - URL slug (e.g., "step-by-step-remix")
 * @returns Title case string (e.g., "Step By Step Remix")
 */
function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validate if a string is a valid Apple Music URL
 * @param url - URL to validate
 * @returns True if valid Apple Music URL
 */
export function isValidAppleMusicUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('music.apple.com') && !!extractAppleTrackId(url);
  } catch {
    return false;
  }
}

/**
 * Create an AppleMusicTrack object from an Apple Music URL with complete metadata
 * Fetches artist, title, album, and artwork from Apple Music API
 * Uses caching to avoid redundant API calls
 * @param url - Apple Music URL
 * @param id - Optional custom ID for the track object (defaults to track ID)
 * @returns AppleMusicTrack object with complete metadata
 */
export async function createTrackFromUrlAsync(
  url: string,
  id?: string
): Promise<AppleMusicTrack | null> {
  const trackId = extractAppleTrackId(url);
  
  if (!trackId) {
    console.warn('[musicUtils] Could not extract track ID from URL:', url);
    return null;
  }

  try {
    // Use cache to avoid redundant API calls
    const track = await musicMetadataCache.getOrFetch(trackId, async () => {
      // Fetch metadata from our API route
      const response = await fetch(`/api/music/metadata?trackId=${trackId}`);
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      
      const metadata = await response.json();

      // Apple Music isn't connected to this copy, and that's fine
      if (metadata.configured === false) return createTrackFromUrl(url, id) as AppleMusicTrack;

      return {
        id: id || `track-${trackId}`,
        artist: metadata.artist,
        title: metadata.title,
        appleUrl: url,
        appleTrackId: trackId,
        // Optional fields that could be added to AppleMusicTrack type
        album: metadata.album,
        artwork: metadata.artwork,
        durationMs: metadata.durationMs,
      } as AppleMusicTrack;
    });
    
    return track;
  } catch (error) {
    console.error('[musicUtils] Failed to fetch track metadata:', error);
    
    // Fallback to URL parsing if API fails
    console.warn('[musicUtils] Falling back to URL parsing for track:', trackId);
    return createTrackFromUrl(url, id);
  }
}

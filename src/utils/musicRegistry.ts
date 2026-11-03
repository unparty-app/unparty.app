// src/utils/musicRegistry.ts
import { AppleMusicTrack } from "@/types/music";
import musicTracksData from "@/data/musicTracks.json";

// Type-safe access to the music tracks registry
const musicTracks = musicTracksData as Record<string, AppleMusicTrack>;

/**
 * Get a single track by its ID
 * @param id - The track ID (e.g., "guess-what", "last-time-that-i-checcd")
 * @returns The track object if found, undefined otherwise
 */
export function getTrackById(id: string): AppleMusicTrack | undefined {
  const track = musicTracks[id];
  
  if (!track) {
    console.warn(`[musicRegistry] Track not found: "${id}". Available tracks:`, Object.keys(musicTracks));
    return undefined;
  }
  
  return track;
}

/**
 * Get multiple tracks by their IDs, filtering out any not found
 * @param ids - Array of track IDs
 * @returns Array of found tracks (silently filters out invalid IDs)
 */
export function getTracksByIds(ids: string[]): AppleMusicTrack[] {
  if (!ids || ids.length === 0) {
    return [];
  }
  
  const tracks: AppleMusicTrack[] = [];
  
  for (const id of ids) {
    const track = getTrackById(id);
    if (track) {
      tracks.push(track);
    }
  }
  
  return tracks;
}

/**
 * Get all available track IDs
 * @returns Array of all track IDs in the registry
 */
export function getAllTrackIds(): string[] {
  return Object.keys(musicTracks);
}

/**
 * Get all tracks
 * @returns Array of all tracks in the registry
 */
export function getAllTracks(): AppleMusicTrack[] {
  return Object.values(musicTracks);
}

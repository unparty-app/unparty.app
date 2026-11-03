// Shared types for Apple Music integration

/**
 * Represents a track from an Apple Music playlist configuration
 */
export interface AppleMusicTrack {
  id: string;
  artist: string;
  title: string;
  appleUrl: string;
  appleTrackId?: string;
  // Enhanced metadata from Apple Music API (available via createTrackFromUrlAsync)
  album?: string;
  artwork?: string; // URL to album artwork
  durationMs?: number; // Track duration in milliseconds
}

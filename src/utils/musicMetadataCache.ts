// src/utils/musicMetadataCache.ts
import { AppleMusicTrack } from "@/types/music";

/**
 * In-memory cache for Apple Music track metadata
 * Prevents redundant API calls for the same track
 */
class MusicMetadataCache {
  private cache = new Map<string, { data: AppleMusicTrack; timestamp: number }>();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  /**
   * Get cached track metadata if available and not expired
   */
  get(trackId: string): AppleMusicTrack | null {
    const cached = this.cache.get(trackId);
    
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    
    if (isExpired) {
      this.cache.delete(trackId);
      return null;
    }

    return cached.data;
  }

  /**
   * Store track metadata in cache
   */
  set(trackId: string, data: AppleMusicTrack): void {
    this.cache.set(trackId, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Manually clear a specific track from cache
   */
  delete(trackId: string): boolean {
    return this.cache.delete(trackId);
  }

  /**
   * Clear all cached metadata
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get or fetch track metadata with automatic caching
   */
  async getOrFetch(
    trackId: string,
    fetcher: () => Promise<AppleMusicTrack>
  ): Promise<AppleMusicTrack> {
    // Check cache first
    const cached = this.get(trackId);
    if (cached) {
      console.log(`[MusicMetadataCache] Cache hit for track ${trackId}`);
      return cached;
    }

    // Fetch and cache
    console.log(`[MusicMetadataCache] Cache miss for track ${trackId}, fetching...`);
    const data = await fetcher();
    this.set(trackId, data);
    
    return data;
  }
}

// Export singleton instance
export const musicMetadataCache = new MusicMetadataCache();

// Export class for testing
export { MusicMetadataCache };

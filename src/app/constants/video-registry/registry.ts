import type { VideoRegistryEntry } from './types';
import { VIDEO_REGISTRY_ENTRIES } from './entries';

export function getVideoEntry(slug: string): VideoRegistryEntry | null {
  return VIDEO_REGISTRY_ENTRIES.find((entry) => entry.slug === slug) ?? null;
}

export function getPublishedVideoEntries(): VideoRegistryEntry[] {
  return VIDEO_REGISTRY_ENTRIES.filter((entry) => entry.published);
}

export function getVideoEntryForUnppp(unpppId: string): VideoRegistryEntry | null {
  return VIDEO_REGISTRY_ENTRIES.find((entry) => entry.unpppId === unpppId) ?? null;
}

// For article/story-sourced coverVideo (EditorialArticle.coverVideo) — these
// aren't UNPPP-owned, so they're looked up by the video asset path itself
// rather than an unpppId.
export function getVideoEntryByContentUrl(contentUrl: string): VideoRegistryEntry | null {
  return VIDEO_REGISTRY_ENTRIES.find((entry) => entry.contentUrl === contentUrl) ?? null;
}

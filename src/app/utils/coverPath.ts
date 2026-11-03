import coverExtensions from '../covers/cover-extensions.json';

/**
 * Resolves a `cover` value to an actual image path. Accepts a bare coverId
 * (looked up in cover-extensions.json, e.g. 'cover-002'), a filename in
 * public/covers with its extension (e.g. 'brand-unparty-start.svg'), or an
 * already-absolute path (e.g. '/theunpartycrawler/thumbnail.jpg') — steps
 * are still testing which convention/photos they'll settle on, so both are
 * supported without forcing a single format yet.
 *
 * Plain module (no 'use client') so server code - e.g.
 * storyToEditorialConverter.ts - can call it directly. Next's RSC bundler
 * treats every export of a 'use client' file as a client-only reference,
 * even a pure string-in-string-out function, so this can't live in
 * CoverImageBackground.tsx (which re-exports it for existing client
 * callers) if server code needs to call it too.
 */
export function resolveCoverSrc(cover: string): string {
  if (cover.startsWith('/')) return cover;
  // A filename with its extension ('brand-unparty-start.svg') is already in public/covers
  if (/\.[a-z0-9]+$/i.test(cover)) return `/covers/${cover}`;
  const extension = (coverExtensions as Record<string, string>)[cover] ?? 'png';
  return `/covers/${cover}.${extension}`;
}

/**
 * True if a `cover` value is a video, not an image — same convention unppp's
 * `coverVideo` field already uses (an absolute path, e.g.
 * '/theunpartyrunway/kite-demo-theunpartyrunway.mp4'). Videos aren't kept
 * under public/covers/ like images, so there's no bare-coverId form for
 * them — a video cover must be given as an absolute path.
 */
export function isVideoCover(cover: string): boolean {
  return /\.(mp4|mov|webm|m4v)$/i.test(cover);
}

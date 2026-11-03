// Video Registry - SEO/watch-page metadata for UNPPP demo videos
//
// Deliberately separate from UnpppsConfig.json: `coverVideo` there stays a
// plain asset path consumed by the ambient background-loop renderers
// (CoverPhoto, StepModal, AboutComponent, EditorialArticle's hero,
// EmbeddableComponents) and isn't touched by this. This registry adds the
// metadata a dedicated watch page needs to qualify as one in Google's video
// indexing pipeline (see issue #956) — it references the same asset via
// `contentUrl` rather than duplicating UnpppsConfig.

export interface VideoRegistryEntry {
  /** Unique slug for this video's watch page (`/watch/[slug]`). Uses the
   * owning UNPPP's id, e.g. 'theunpartybuilder' — distinct from editorial
   * article slugs (which are '*-story' suffixed), so there's no collision
   * when both resolve through the shared Thought.articleSlug column. */
  slug: string;
  /** The UNPPP this demo video belongs to (id in UnpppsConfig.json), when
   * it's sourced from one. Used only to wire the CoverVideo/EditorialArticle
   * expand icon (getVideoEntryForUnppp) — never use this for navigation.
   * A future article- or story-sourced entry (video frontmatter on an
   * EditorialArticle) won't have this set; use sourceHref/sourceLabel. */
  unpppId?: string;
  /** VideoObject `name` for JSON-LD. */
  title: string;
  /** VideoObject `description` for JSON-LD. */
  description: string;
  /** Absolute path to the video asset — same value as the UNPPP's
   * `coverVideo` in UnpppsConfig.json. VideoObject `contentUrl`. */
  contentUrl: string;
  /** Poster/thumbnail image. VideoObject `thumbnailUrl`. Either set
   * explicitly here (resolveCoverSrc() from the UNPPP's `cover`, for the
   * entries that have a real curated photo) or left unset and merged in
   * from videoMetadata.json's auto-generated poster frame (`npm run
   * generate-video-metadata`, ffmpeg-based) — explicit always wins.
   * Genuinely optional: ffmpeg can fail (corrupt file) and leave no
   * fallback either, in which case JSON-LD just omits the field. */
  thumbnailUrl?: string;
  /** Route back to this video's owning content - the "nav handle" that
   * actually owns it. Today that's always a UNPPP page (`/${unpppId}`), but
   * this is a separate, explicit field rather than derived from unpppId on
   * purpose: once an article or story can carry video frontmatter, its
   * entry sets this to `/article/[slug]` or `/story/[slug]` instead, with
   * no unpppId at all. Powers the "back to start" nav on the watch page and
   * lightbox — always read this field, never infer the source route. */
  sourceHref: string;
  /** Display label for sourceHref, matching the app's all-caps tagline
   * convention (e.g. 'BUILDER.'). */
  sourceLabel: string;
  /** ISO 8601 duration (e.g. 'PT47S') for VideoObject JSON-LD. Merged in
   * from src/data/videoMetadata.json (`npm run generate-video-metadata`,
   * ffprobe-based) rather than hand-entered here — stays optional since a
   * future entry could ship before that script has run against its asset;
   * omit the JSON-LD field entirely rather than guessing when absent. */
  duration?: string;
  /** ISO 8601 date for VideoObject JSON-LD. Also merged in from
   * videoMetadata.json - prefers the mp4's own creation_time tag, falls
   * back to the commit that first added the asset (a real, varying date
   * per video, not a placeholder) when the tag is absent, as it is for all
   * 9 current assets. Optional for the same reason as duration above. */
  uploadDate?: string;
  /** Gates both the watch page (404 when false) and the video sitemap,
   * mirroring EditorialArticle.published. */
  published: boolean;
}

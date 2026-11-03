# ScrollRow in Stories - Usage Guide

## Overview

You can now embed interactive ScrollRows in your story markdown files! ScrollRows let you showcase covers, stories, and music inline within your narrative.

## Syntax

```markdown
:::scrollRow[type=TYPE,maxItems=NUMBER,moreLink=PATH,title=TITLE,coverIds=[ID1,ID2,ID3]]:::
```

## Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `type` | string | ✅ Yes | Type of ScrollRow: `covers`, `stories`, `music`, or `gif` | `type=covers` |
| `maxItems` | number | No | Max items to display (default: 5) | `maxItems=3` |
| `moreLink` | string | No | Link for "MORE" button (default: `/covers`) | `moreLink=/party` |
| `title` | string | No | Optional title above the ScrollRow | `title=Featured Stories` |
| `coverIds` | array | No | Specific cover IDs to show | `coverIds=[cover-001,cover-002]` |
| `trackIds` | array | No | Music track IDs (for type=music) | `trackIds=[track1,track2]` |
| `photographer` | string | No | Filter covers by photographer name | `photographer=yourname` |
| `gifSources` | array | No | GIF file paths or URLs (for type=gif) | `gifSources=[/file.gif,/other.gif]` |
```

### 2. Specific Covers with Title
Show specific covers with a custom title:

```markdown
:::scrollRow[type=covers,maxItems=4,moreLink=/covers,title=My Favorite Covers,coverIds=[cover-001,cover-018,cover-033,cover-042]]:::
```

### 3. Covers by Photographer
Show all covers by a specific photographer:

```markdown
:::scrollRow[type=covers,photographer=yourname,maxItems=8,moreLink=/covers,title=Photos by @yourname]:::
```

**Available Photographers:**
- `yourname` - 11 covers
- `yourname` - 7 covers  
- `yourname` - 1 cover
- `username` - 2 covers
- `yourname` - 1 cover
- `unparty` - 1 cover

### 4. Stories by Photographer
Show only stories (covers with published content) from a specific photographer:

```markdown
:::scrollRow[type=stories,photographer=yourname,maxItems=5,moreLink=/covers,title=Stories by yourname]:::
```

### 5. Stories Only
Show only covers that have published stories:

```markdown
:::scrollRow[type=stories,maxItems=3,moreLink=/covers,title=Related Stories,coverIds=[cover-001,cover-018,cover-019]]:::
```

### 6. Music Banner
Embed the music player:

```markdown
:::scrollRow[type=music,moreLink=/party,title=Soundtrack]:::
```

### 7. Music with Specific Tracks
Embed a specific song:

```markdown
:::scrollRow[type=music,trackIds=[guess-what],title=Now Playing]:::
```

### 8. Music Playlist
Embed multiple songs that play in sequence:

```markdown
:::scrollRow[type=music,trackIds=[last-time-that-i-checcd,guess-what,badbunny-dtmf],title=My Playlist]:::
```

### 9. Single GIF
Embed an animated GIF:

```markdown
:::scrollRow[type=gif,gifSources=[/llm_baseline.gif],title=Demo Animation]:::
```

### 10. Multiple GIFs
Create a GIF gallery:

```markdown
:::scrollRow[type=gif,gifSources=[/animation1.gif,/animation2.gif,/animation3.gif],maxItems=3,title=Gallery]:::
```

### 11. External GIF URL
Embed a GIF from an external URL:

```markdown
:::scrollRow[type=gif,gifSources=[https://example.com/animation.gif],title=External Demo]:::
```

## Complete Story Example

```markdown
---
title: "My Amazing Journey"
subtitle: "A tale of inspiration"
author: "yourname"
date: "2026-02-21"
category: "STORIES"
published: true
---

# My Amazing Journey

This is the beginning of my story...

## Visual Inspiration

These covers inspired my creative process.

:::scrollRow[type=covers,maxItems=5,moreLink=/covers,title=Inspiration,coverIds=[cover-001,cover-002,cover-003,cover-004,cover-005]]:::

More story content here...

## Related Reading

You might also enjoy these stories.

:::scrollRow[type=stories,maxItems=4,moreLink=/covers,title=More Stories]:::

The end!
```

## ScrollRow Types

### `type=covers`
- Displays cover photo cards
- Shows all covers (whether they have stories or not)
- Clickable - links to story page if story exists, otherwise to gallery
- Hover shows story title/author if available

### `type=stories`
- Displays only covers that have published stories
- Same card style as covers
- Always links to the story page
- Perfect for "Related Stories" sections

### `type=music`
- Embeds the MusicBanner component
- Shows play/pause controls (and skip controls if multiple tracks)
- Displays track info with artist and title
- Supports `trackIds` parameter to specify which songs to play
- If no `trackIds` provided, plays default track (Bad Bunny - DtMF)
- Multiple tracks create a playlist with previous/next controls
- Links to full music experience

### `type=gif`
- Displays animated GIF images
- Preserves animation with unoptimized rendering
- Supports both local files (from `/public/`) and external URLs
- Responsive aspect-ratio container (16:9 by default)
- Hover effects and rounded corners
- Perfect for demos, tutorials, or visual examples

**Available Track IDs** (from `/src/data/musicTracks.json`):
- `whitney-step-by-step` - Whitney Houston: Step by Step (Remix)
- `badbunny-dtmf` - Bad Bunny: DtMF
- `guess-what` - Syleena Johnson: Guess What
- `last-time-that-i-checcd` - Nipsey Hussle: Last Time That I Checc'd

## Tips

1. **Placement**: Place ScrollRows between paragraphs or sections for best readability
2. **Quantity**: Use 3-5 items for optimal mobile experience
3. **Context**: Add a heading or intro paragraph before each ScrollRow
4. **Spacing**: The system automatically adds proper vertical spacing

## Technical Details

- ScrollRows are parsed from markdown at build time
- They're rendered as interactive React components
- Fully responsive (horizontal scroll on mobile)
- Supports keyboard navigation
- Optimized images with Next.js Image component

## Troubleshooting

**ScrollRow not appearing?**
- Check syntax: Must start with `:::scrollRow[` and end with `]:::`
- Verify comma-separated parameters
- Array values must be in brackets: `[item1,item2]`
- No spaces in array values

**Stories not showing in type=stories?**
- Make sure the story markdown file exists in `/public/covers/stories/`
- Verify `published: true` in the story's frontmatter
- Check that StorySchema is loading stories 1-42

**Cover images broken?**
- Verify cover files exist in `/public/covers/`
- Check file extensions match (png, jpg, JPG, svg)
- Use correct cover ID format: `cover-001`, `cover-018`, etc.

**Music not playing or wrong track?**
- Verify track IDs match those in `/src/data/musicTracks.json`
- Track IDs are case-sensitive: use `guess-what`, not `Guess-What`
- Check browser console for track lookup warnings
- Ensure array syntax is correct: `trackIds=[track1,track2]` (no spaces)
- If no tracks show, check that MusicKit is authorized (Apple Music subscription required)

**Photographer filter showing no covers?**
- Photographer names are case-insensitive: `yourname` = `yourname`  
- Verify photographer exists in `/src/data/cover-photo-sources.json`
- Check spelling matches exactly (e.g., `yourname` not `yourname`)
- Use `photographer` OR `coverIds`, not both (photographer takes precedence)
- Check browser console for available photographers if unsure

**GIFs not displaying or animating?**
- Verify GIF file exists in `/public/` directory or is a valid URL
- Check file path syntax: use `/filename.gif` for files in `/public/` root
- For subdirectories: `/path/to/file.gif` (relative to `/public/`)
- Ensure array syntax is correct: `gifSources=[/file1.gif,/file2.gif]` (no spaces)
- GIF animation preserved with `unoptimized={true}` - no manual config needed
- For external URLs, ensure full https:// path
- Check browser console for image loading errors

## Future Enhancements

Coming soon:
- Auto-detection of related stories based on tags/category
- Custom component types (not just covers/music) ✅ **AVAILABLE NOW** - See [CUSTOM_COMPONENTS_IN_STORIES.md](./CUSTOM_COMPONENTS_IN_STORIES.md)
- Carousel mode with auto-scroll
- Grid layout option
- Filtering by icon type
- Filtering by category/tag

---

## Want to Add Custom Components?

You can now embed any React component (games, calculators, widgets) in your stories!

See **[CUSTOM_COMPONENTS_IN_STORIES.md](./CUSTOM_COMPONENTS_IN_STORIES.md)** for the complete guide.

Quick example:
```markdown
:::component[name=ColorMatchingGame]:::
```

---

Happy storytelling! 🎨✨

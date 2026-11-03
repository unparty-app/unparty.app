# Story Generation System

## Overview
Automatically generates placeholder story markdown files for all cover photos to prevent 404 errors and improve loading performance.

## Script
**Location**: `scripts/generate-placeholder-stories.js`

### What it does:
1. Scans `/public/covers/` for all cover image files (cover-XXX.png/jpg/JPG)
2. Checks `/public/covers/stories/` for existing story files
3. Creates placeholder story-XXX.md files for any missing stories
4. Sets `published: false` by default so they don't appear publicly

### Template Format:
```markdown
---
title: "Story XXX"
subtitle: "This story is coming soon"
description: "A story inspired by cover XXX"
author: "unparty"
date: "YYYY-MM-DD"
category: "STORIES"
published: false
---

# Coming Soon

This story is currently being written.

Check back soon for updates!
```

## Build Integration

Added to `package.json` build script:
```json
"build": "... && npm run generate-placeholder-stories && ..."
```

This ensures placeholder stories are always created before the Next.js build runs.

## Manual Usage

Generate stories manually:
```bash
npm run generate-placeholder-stories
```

Or run directly:
```bash
node scripts/generate-placeholder-stories.js
```

## Current Status

- **Total Covers**: 25
- **Generated Stories**: 26 (includes story-001 through story-019, plus story-033, story-034, story-035, story-036, story-037, story-042, story-300)
- **Published Stories**: Only manually edited stories have `published: true`

## Benefits

1. **No 404 Errors**: Every cover has a corresponding story file
2. **Better Performance**: StorySchema can load metadata without errors
3. **Development Ready**: New covers automatically get placeholder stories on build
4. **Safe Defaults**: All generated stories are unpublished (`published: false`)
5. **Easy Editing**: Simply edit the placeholder file and set `published: true`

## Workflow

1. Add new cover image to `/public/covers/cover-XXX.png` (keep it under 1MB — ≤2000px on the long edge; `npm run audit:covers` / CI enforce this)
2. Run build or `npm run generate-placeholder-stories`
3. Edit `/public/covers/stories/story-XXX.md` with your content
4. Set `published: true` when ready to publish
5. Story appears in gallery and story pages

## How stories currently work in the app

- Story files live in `/public/covers/stories/story-XXX.md` with frontmatter metadata.
- Story pages are routed at `/story/[coverId]` (example: `/story/cover-001`).
- `StorySchema` maps story IDs and cover IDs (`story-001` ↔ `cover-001`) and loads metadata/content.
- A story only renders on its route when `published: true`; unpublished stories resolve to not found.
- `<StoryTable />` now appears on `/src/app/page.tsx` and lists published stories with direct row navigation to `/story/[coverId]`.

## Files Modified

- `package.json` - Added `generate-placeholder-stories` script to build
- `scripts/generate-placeholder-stories.js` - New script (created)

## Notes

- Script is idempotent (safe to run multiple times)
- Never overwrites existing story files
- Uses current date for generated stories
- All placeholder stories use "unparty" as author
- Category is always "STORIES" for consistency

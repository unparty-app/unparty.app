# Front Matter Auto-Generation System

Installing the hooks, and what each one does, is covered in the **[GUARDRAILS.](/article/setup-local-guardrails)** article (source: `src/app/constants/editorial-articles/articles/setup-local-guardrails.ts`). This page is the reference for the frontmatter part.

Automated YAML frontmatter generation for markdown articles in theunparty* (UNPPP) directories.

## Overview

This system automatically generates and validates frontmatter for markdown files in `src/app/theunparty*/` directories, ensuring all UNPPP articles have consistent metadata for the editorial rendering system.

**Key Features:**
- ✅ Auto-detects new markdown files via git pre-commit hook
- ✅ Extracts metadata from content (title, description)
- ✅ Infers category from directory name (`theunpartyrunway` → "runway")
- ✅ Uses git history for accurate file creation dates
- ✅ Generates relevant tags from title and content
- ✅ Manual CLI for batch processing existing files

## Front Matter Schema

All UNPPP markdown articles use this YAML frontmatter format:

```yaml
---
title: "Article Title"
description: "Brief description for SEO and previews"
author: "unparty"
date: "2026-04-01"
category: "runway"
tags: ["runway", "analytics", "data-quality"]
published: true
---
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Main article title (extracted from first H1) |
| `description` | string | ✅ | SEO description and preview text (200 char max) |
| `author` | string | ✅ | Author identifier (defaults to "unparty") |
| `date` | string | ✅ | Publication date in YYYY-MM-DD format |
| `category` | string | ✅ | Category inferred from directory name |
| `tags` | string[] | ⬜ | Array of relevant tags (max 5) |
| `published` | boolean | ✅ | Publication status (defaults to true) |

### Category Mapping

Categories are automatically inferred from directory names:

```
src/app/theunpartyrunway/  → category: "runway"
src/app/theunpartygrow/    → category: "grow"
src/app/theunpartybrand/   → category: "brand"
src/app/theunpartycloud/   → category: "cloud"
src/app/theunpartycrawler/ → category: "crawler"
```

## Installation

Install the git pre-commit hook to enable automatic frontmatter generation:

```bash
npm run frontmatter:install-hooks
```

This installs two small wrapper hooks in `.git/hooks/` that run the tracked scripts, so pulling a change to a hook script updates the hook too. Running it again is safe. A hook that is not one of these wrappers is backed up to `<name>.backup` first.

The **pre-commit** hook (`scripts/pre-commit-frontmatter`):
1. Blocks the commit if a staged image in `public/covers/` is over 1 MB
2. Stamps dates on staged stories, unppp articles, JSON articles and TS articles with `scripts/stamp-dates.js`, then stages them. A missing created date (`started-at` on stories, `date` elsewhere) comes from the file's first commit. The updated date (`updated-at` in markdown, `updated` in JSON and TS) becomes today when the title or body changed. Tags, cover, `published` and whitespace don't count. A file that also has unstaged changes is skipped, so they don't sneak into the commit. `npm run backfill-dates` fills every missing created date at once
3. Generates frontmatter for newly added `.md` files in `src/app/theunparty*/` that have none, then stages them

The **pre-push** hook (`scripts/pre-push-spellcheck`) reports spelling and grammar in the prose being pushed and never blocks (see [SPELLCHECK.md](./SPELLCHECK.md)).

Edits made on GitHub's web editor, by Claude, or on a machine without the hooks are dated in the pull request instead: `.github/workflows/stamp-dates.yml` runs the same script on the content files each push changes, using the head commit's own date, commits the dates into the PR (with `[skip stamp]`, so it never loops) and re-runs `validate-articles` on that commit. `[skip stamp]` in the first line of your own commit message skips it. PRs from the save APIs (`unseen/*` branches) are skipped, since they're dated at save.

Saves from the unseen app never run the hook, so the save APIs stamp the same way before they commit (`src/lib/stamp-on-save.ts`, sharing the rules in `src/lib/stamp-dates-core.js`), and story saves go through a pull request that auto-merges, like article saves.

If Node is not on the hook's PATH (some Git apps start hooks without your shell setup), the pre-commit checks are skipped with a note instead of blocking.

## Usage

### Automatic Mode (Git Hook)

The pre-commit hook runs automatically when you commit new markdown files:

```bash
# Add a new article
git add src/app/theunpartyrunway/new-article.md

# Commit triggers automatic frontmatter generation
git commit -m "Add new article"
# Output:
# 🔍 Checking for new markdown files in UNPPP directories...
# 📝 Generating frontmatter for src/app/theunpartyrunway/new-article.md...
# ✓ Generated frontmatter for src/app/theunpartyrunway/new-article.md
```

To skip the hook for a specific commit:

```bash
git commit --no-verify
```

### Manual Mode (CLI)

Process specific files manually:

```bash
# Generate frontmatter for a specific file
npm run frontmatter:generate src/app/theunpartyrunway/article.md

# Process multiple files
npm run frontmatter:generate file1.md file2.md file3.md
```

### Check Mode (Audit)

List all UNPPP markdown files missing frontmatter:

```bash
npm run frontmatter:check
```

**Example Output:**
```
⚠ Missing frontmatter: /Users/.../theunpartycloud/wordcloud-ml-features.md
⚠ Missing frontmatter: /Users/.../theunpartycrawler/README.md
────────────────────────────────────────────────────────────
Found 7 file(s) missing frontmatter
```

### Batch Processing

Process all UNPPP markdown files at once:

```bash
node scripts/generate-frontmatter.js --all
```

**Example Output:**
```
✓ Generated frontmatter for src/app/theunpartyrunway/assumptions.md
⊘ Skipped src/app/theunpartygrow/grow-stat-dev.md (already has frontmatter)
✓ Generated frontmatter for src/app/theunpartycloud/wordcloud-ml-features.md
────────────────────────────────────────────────────────────
Processed: 5 generated, 2 skipped, 0 errors
```

## How It Works

### Metadata Extraction

The generator intelligently extracts metadata from markdown content:

1. **Title Extraction:**
   - Searches for first `# Heading` (H1)
   - Falls back to `<h1>` HTML tag if present
   - Uses filename as last resort

2. **Description Generation:**
   - Extracts first substantial paragraph (>20 chars)
   - Removes HTML tags and headings
   - Truncates to 200 characters with ellipsis

3. **Tag Generation:**
   - Includes category as base tag
   - Extracts keywords from title (excluding common words)
   - Scans content for technical terms (analytics, api, dashboard, etc.)
   - Limits to 5 most relevant tags

4. **Date Resolution:**
   - Uses `git log --follow --format=%aI --reverse` to get file creation date
   - Falls back to current date if file not in git history

### Front Matter Format

The generator creates clean, valid YAML frontmatter:

```yaml
---
title: "THEUNPARTYRUNWAY | ASSUMPTIONS"
description: "Quantitative data quality assessment system that generates statistical reports..."
author: "unparty"
date: "2026-04-01"
category: "runway"
tags: ["runway", "assumptions", "data-quality", "analytics", "scoring"]
published: true
---
```

### Integration with Editorial System

Generated frontmatter integrates seamlessly with the existing article system:

- **Parser:** [src/app/utils/mdArticleUtils.ts](src/app/utils/mdArticleUtils.ts) `parseFrontmatter()`
- **API:** [src/app/api/articles/unppp/[unpppId]/route.ts](src/app/api/articles/unppp/%5BunpppId%5D/route.ts)
- **Renderer:** [src/app/components/editorial/EditorialArticle.tsx](src/app/components/editorial/EditorialArticle.tsx)

## Examples

### Before (No Frontmatter)

```markdown
# THEUNPARTYRUNWAY | ASSUMPTIONS

Quantitative data quality assessment system...
```

### After (Auto-Generated)

```markdown
---
title: "THEUNPARTYRUNWAY | ASSUMPTIONS"
description: "Quantitative data quality assessment system that generates statistical reports on business assumptions with transparent, modifiable scoring methodology"
author: "unparty"
date: "2026-04-01"
category: "runway"
tags: ["runway", "assumptions", "data-quality", "analytics", "scoring"]
published: true
---

# THEUNPARTYRUNWAY | ASSUMPTIONS

Quantitative data quality assessment system...
```

## Troubleshooting

### Hook Not Running

**Problem:** Pre-commit hook doesn't run when committing markdown files.

**Solution:**
```bash
# Reinstall the hook
npm run frontmatter:install-hooks

# Verify hook is executable
ls -la .git/hooks/pre-commit
# Should show: -rwxr-xr-x
```

### Frontmatter Not Generated

**Problem:** Hook runs but frontmatter isn't added.

**Check:**
1. File is in a `theunparty*` directory
2. File doesn't already have frontmatter (starts with `---`)
3. No errors in terminal output during commit

**Debug:**
```bash
# Test manually
node scripts/generate-frontmatter.js path/to/file.md

# Check if file pattern matches
echo "path/to/file.md" | grep -E '^src/app/theunparty.*/.*\.md$'
```

### Incorrect Metadata

**Problem:** Generated title, description, or tags are incorrect.

**Solution:** Edit the frontmatter manually after generation. The hook only generates frontmatter for files that don't have any - it won't overwrite existing frontmatter.

### Git Date Errors

**Problem:** `git log` fails or returns no date.

**Behavior:** Falls back to current date (expected for new files).

**Force Specific Date:** Edit the generated frontmatter manually.

## File Structure

```
theunpartyapp/
├── scripts/
│   ├── generate-frontmatter.js      # Main generator utility
│   ├── pre-commit-frontmatter       # Git pre-commit hook script
│   └── install-git-hooks.sh         # Hook installation script
├── src/app/
│   ├── theunpartyrunway/           # UNPPP directory
│   │   ├── *.md                    # Articles with frontmatter
│   │   └── ...
│   ├── theunpartygrow/
│   ├── theunpartybrand/
│   └── ...
├── .git/hooks/
│   └── pre-commit                  # Installed hook (symlink/copy)
└── package.json                    # npm scripts
```

## npm Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `frontmatter:generate` | `node scripts/generate-frontmatter.js` | Generate frontmatter for specific files |
| `frontmatter:check` | `node scripts/generate-frontmatter.js --all --check` | List all files missing frontmatter |
| `frontmatter:install-hooks` | `sh scripts/install-git-hooks.sh` | Install git pre-commit hook |

## Advanced Usage

### Custom Author

```bash
node scripts/generate-frontmatter.js --author "custom-author" file.md
```

### Help

```bash
node scripts/generate-frontmatter.js --help
```

### CI/CD Integration

Add to your build pipeline to ensure all articles have frontmatter:

```yaml
# .github/workflows/validate.yml
- name: Check Frontmatter
  run: npm run frontmatter:check
```

## Related Documentation

- [Editorial System](../architecture/EDITORIAL_SYSTEM.md) - Article rendering architecture
- [mdArticleUtils.ts](src/app/utils/mdArticleUtils.ts) - Frontmatter parser implementation
- [Story Generation](docs/guides/STORY_GENERATION.md) - Story-specific frontmatter system

## Architecture

```
New .md File Committed
        ↓
Pre-commit Hook Triggered
        ↓
Detect UNPPP Directory & .md Extension
        ↓
Check for Existing Frontmatter
        ↓
Extract Metadata (title, description, category)
        ↓
Get File Creation Date (git log)
        ↓
Generate Tags (keywords + content analysis)
        ↓
Create YAML Frontmatter
        ↓
Prepend to File Content
        ↓
Stage Modified File
        ↓
Commit Proceeds
        ↓
Article Rendered via Editorial System
```

## Best Practices

1. **Review Generated Frontmatter:** While the generator is intelligent, always review auto-generated metadata before publishing.

2. **Manual Override:** If category inference is wrong, manually edit the category field after generation.

3. **Rich Descriptions:** Consider expanding auto-generated descriptions to be more detailed and SEO-friendly.

4. **Tag Curation:** Auto-generated tags are a starting point - refine them based on your taxonomy.

5. **Unpublished Drafts:** Set `published: false` in frontmatter for draft articles not ready for display.

6. **Commit Messages:** Include frontmatter changes in commit messages: `git commit -m "Add new article with auto-generated frontmatter"`

## Security Notes

- The system only modifies files in `src/app/theunparty*/` directories
- Existing frontmatter is never overwritten
- Git hook can be bypassed with `--no-verify` for emergency commits
- All scripts use relative paths and respect .gitignore

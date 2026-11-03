import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[.?!,;:'"/\\]/g, ' ')  // punctuation → space
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseExistingSlug(content) {
  const match = content.match(/^---[\s\S]*?\nslug:\s*["']?([^"'\n]+)["']?[\s\S]*?---/m);
  return match ? match[1].trim() : null;
}

function parseTitle(content) {
  const match = content.match(/^---[\s\S]*?\ntitle:\s*["']?([^"'\n]+)["']?[\s\S]*?---/m);
  return match ? match[1].trim() : null;
}

function parsePublished(content) {
  return /^---[\s\S]*?\npublished:\s*true[\s\S]*?---/m.test(content);
}

function writeSlugToFrontmatter(filePath, content, slug) {
  // Insert slug field after the first line of frontmatter (after opening ---)
  if (content.includes('\nslug:')) return; // already has slug
  const updated = content.replace(/^(---\r?\n)/, `$1slug: ${slug}\n`);
  fs.writeFileSync(filePath, updated, 'utf-8');
}

function generateStoriesManifest() {
  const storiesDir = path.join(__dirname, '../public/covers/stories');
  const files = fs.readdirSync(storiesDir);

  const stories = files
    .filter(f => /^story-\d+\.md$/.test(f))
    .map(f => {
      const storyId = f.replace('.md', '');
      const num = parseInt(storyId.replace('story-', ''), 10);
      const filePath = path.join(storiesDir, f);
      const content = fs.readFileSync(filePath, 'utf-8');
      const coverId = storyId.replace('story-', 'cover-');
      const title = parseTitle(content);
      const existingSlug = parseExistingSlug(content);
      const isPublished = parsePublished(content);
      return { storyId, coverId, num, filePath, content, title, existingSlug, isPublished };
    })
    .filter(s => s.isPublished)
    .sort((a, b) => a.num - b.num);

  // Build slugs — use existing frontmatter slug if present, else derive from title
  const usedSlugs = new Map(); // slug → first storyId that used it

  for (const story of stories) {
    let slug = story.existingSlug || (story.title ? slugify(story.title) : `story-${String(story.num).padStart(3, '0')}`);

    // Collision: append story number suffix
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${String(story.num).padStart(3, '0')}`;
      console.warn(`⚠️  Slug collision — using "${slug}" for ${story.storyId}`);
    }
    usedSlugs.set(slug, story.storyId);
    story.slug = slug;
  }

  // Write slug into frontmatter if not already present
  let wrote = 0;
  for (const story of stories) {
    if (!story.existingSlug) {
      writeSlugToFrontmatter(story.filePath, story.content, story.slug);
      wrote++;
    }
  }

  // Build maps
  const slugToCoverId = {};
  const coverIdToSlug = {};
  const published = [];

  for (const story of stories) {
    slugToCoverId[story.slug] = story.coverId;
    coverIdToSlug[story.coverId] = story.slug;
    published.push(story.slug);
  }

  const manifest = { published, slugToCoverId, coverIdToSlug, generatedAt: new Date().toISOString() };
  const manifestPath = path.join(__dirname, '../src/data/storiesManifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`✅ Stories manifest generated: ${manifestPath}`);
  console.log(`📖 Published stories: ${published.length}`);
  if (wrote > 0) console.log(`✏️  Wrote slug to frontmatter: ${wrote} files`);
  console.log(`   ${published.join(', ')}`);
}

// pathToFileURL, not `file://${argv[1]}`: on Windows argv[1] is C:\… and the
// template never matched, so `npm run get-stories` silently did nothing
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateStoriesManifest();
}

export { generateStoriesManifest };

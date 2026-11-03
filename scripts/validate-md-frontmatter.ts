import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { parseFrontmatter } from '../src/app/utils/mdArticleUtils';

// Validates the frontmatter of unppp markdown articles (src/app/theunparty*/*.md).
// Invoked by .github/workflows/validate-articles.yml with only the .md files that
// changed in the PR diff, or locally with --all (npm run frontmatter:validate).
//
// Parses with the same parseFrontmatter() the article loader uses, so what this
// accepts is exactly what mdArticleUtils will read at runtime.

const nonEmpty = z.string().trim().min(1);

const mdFrontmatterSchema = z
  .object({
    title: nonEmpty,
    description: nonEmpty,
    author: nonEmpty,
    category: nonEmpty,
    // Required: the loader falls back to the build date, so a missing date drifts on every deploy.
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
      .refine((d) => !Number.isNaN(Date.parse(d)), 'not a real date'),
    // Required: the loader treats a missing key as published.
    published: z.boolean({ required_error: 'must be set explicitly (true or false)' }),
    subtitle: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // Set by scripts/stamp-dates.js on every content edit (#1030)
    'updated-at': z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
      .refine((d) => !Number.isNaN(Date.parse(d)), 'not a real date')
      .optional(),
    // Renamed to updated-at, the key stories use; the stamp script writes that one
    updated: z.undefined({ invalid_type_error: 'renamed to updated-at' }).optional(),
    // A single cover, or an inline array of photos (cover: ["/covers/a.webp", "/covers/b.webp"])
    // which renders a PhotoGallery instead of the single hero.
    cover: z.union([z.string(), z.array(z.string())]).optional(),
    coverAlt: z.string().optional(),
    coverVideo: z.string().optional(),
  })
  .passthrough();

// Same traversal as scanUnpppDirectoriesForMD(): top-level .md files only, in
// directories under src/app whose name starts with "theunparty".
function findAllUnpppMarkdown(): string[] {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const files: string[] = [];
  for (const entry of fs.readdirSync(appDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('theunparty')) continue;
    const dir = path.join(appDir, entry.name);
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.md')) files.push(path.join('src', 'app', entry.name, file));
    }
  }
  return files.sort();
}

const args = process.argv.slice(2);
const files = args.includes('--all') ? findAllUnpppMarkdown() : args;

if (files.length === 0) {
  console.log('No unppp markdown files changed — nothing to validate.');
  process.exit(0);
}

let failures = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    // File was deleted in this PR — nothing to validate.
    continue;
  }

  const { meta } = parseFrontmatter(fs.readFileSync(file, 'utf-8'));

  if (Object.keys(meta).length === 0) {
    failures++;
    console.error(`INVALID: ${file}`);
    console.error('  missing or empty frontmatter block');
    continue;
  }

  const result = mdFrontmatterSchema.safeParse(meta);
  if (result.success) {
    console.log(`OK: ${file}`);
  } else {
    failures++;
    console.error(`INVALID: ${file}`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} of ${files.length} file(s) failed frontmatter validation.`);
  process.exit(1);
}

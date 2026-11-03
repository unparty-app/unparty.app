import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/app/constants/editorial-articles/articles');
const outPath = path.join(__dirname, '../src/data/articleCoversManifest.json');

// First line-anchored match per file: each article file declares its metadata
// (slug, coverImage) at the top of a single exported const, before sections.
const slugToCover = {};
const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.ts')).sort();

for (const file of files) {
  const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
  const slug = content.match(/^\s*slug:\s*['"`]([^'"`]+)['"`]/m)?.[1];
  const cover = content.match(/^\s*coverImage:\s*['"`]([^'"`]+)['"`]/m)?.[1];
  if (!slug || !cover) continue;
  if (slugToCover[slug]) {
    console.warn(`⚠️  Duplicate article slug "${slug}" in ${file}; keeping first`);
    continue;
  }
  slugToCover[slug] = cover;
}

// No generatedAt field: output must be byte-stable so build regeneration
// never dirties the working tree.
fs.writeFileSync(outPath, JSON.stringify({ slugToCover }, null, 2) + '\n');
console.log(`✅ articleCoversManifest.json — ${Object.keys(slugToCover).length} article covers from ${files.length} files`);

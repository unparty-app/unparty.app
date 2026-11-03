import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cover size check — guards against oversized assets landing in public/covers/.
 *
 * Covers are served through next/image at a maximum of full-article-hero size,
 * so source files should be a few hundred KB (≤2000px on the long edge), never
 * the multi-MB camera originals that used to live here (cover-046.png was 47MB
 * before it was re-encoded — see issue #819).
 *
 * Usage:
 *   node scripts/check-cover-sizes.js              # audit all of public/covers/
 *   node scripts/check-cover-sizes.js --staged     # check staged files (pre-commit)
 *   node scripts/check-cover-sizes.js <files...>   # check specific files
 *
 * Only raster formats are checked. SVGs are skipped: a couple of legacy SVGs
 * with embedded raster data predate this check and re-encoding vector files is
 * a different problem than resizing camera originals.
 */

const MAX_BYTES = 1024 * 1024; // 1MB hard limit per cover image
const RASTER_EXTENSIONS = /\.(png|jpe?g|webp|gif|avif)$/i;

const coversDir = path.join(__dirname, '../public/covers');
const projectRoot = path.join(__dirname, '..');

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

function collectRasterFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectRasterFiles(fullPath));
    } else if (RASTER_EXTENSIONS.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const args = process.argv.slice(2);

let files;
if (args[0] === '--staged') {
  // Staged paths from git, NUL-delimited so filenames with spaces/newlines
  // survive intact (no shell word-splitting anywhere on this path).
  const out = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z', '--', 'public/covers/'],
    { cwd: projectRoot }
  ).toString();
  files = out
    .split('\0')
    .filter(Boolean)
    .map((file) => path.join(projectRoot, file))
    .filter((file) => RASTER_EXTENSIONS.test(file) && fs.existsSync(file));
} else if (args.length > 0) {
  // Explicit file list (e.g. staged paths from the pre-commit hook). Paths may
  // be repo-relative; silently skip anything deleted or non-raster.
  files = args
    .map((file) => (path.isAbsolute(file) ? file : path.join(projectRoot, file)))
    .filter((file) => RASTER_EXTENSIONS.test(file) && fs.existsSync(file));
} else {
  if (!fs.existsSync(coversDir)) {
    console.error(`❌ Covers directory not found: ${coversDir}`);
    process.exit(1);
  }
  files = collectRasterFiles(coversDir);
}

const oversized = files
  .map((file) => ({ file, size: fs.statSync(file).size }))
  .filter(({ size }) => size > MAX_BYTES)
  .sort((a, b) => b.size - a.size);

if (oversized.length > 0) {
  console.error(`❌ ${oversized.length} cover image(s) exceed the ${formatSize(MAX_BYTES)} limit:\n`);
  oversized.forEach(({ file, size }) => {
    console.error(`   ${formatSize(size).padStart(8)}  ${path.relative(projectRoot, file)}`);
  });
  console.error(
    `\nCovers render at most at full-article-hero size — resize to ≤2000px on the` +
      `\nlong edge and re-encode (target a few hundred KB), e.g. with sharp:` +
      `\n  npx sharp-cli -i <file> -o <file> resize 2000 2000 --fit inside --withoutEnlargement` +
      `\n(photo-heavy PNGs may also need palette quantization — pngquant — or JPEG)\n`
  );
  process.exit(1);
}

console.log(`✅ ${files.length} cover image(s) checked, all within the ${formatSize(MAX_BYTES)} limit`);

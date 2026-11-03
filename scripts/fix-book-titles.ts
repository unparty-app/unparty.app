/**
 * One-off data fix for issue #197: 35 book titles were migrated in ALL CAPS.
 * Converts any all-caps Book.title to Title Case and writes it back.
 *
 * Mechanical text transform only — does not touch quote/publisher/page data
 * (that's real book content and belongs to #194/#198, entered via /admin/books).
 *
 * Usage: npx tsx scripts/fix-book-titles.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on',
  'or', 'so', 'the', 'to', 'up', 'yet', 'with', 'from', 'into', 'over', 'per', 'via', 'vs',
]);

// Words that should stay uppercase rather than being title-cased.
const KNOWN_ACRONYMS = new Set(['ai']);

function toTitleCase(title: string): string {
  const words = title.trim().split(/\s+/);

  return words
    .map((word, idx) => {
      const isEdge = idx === 0 || idx === words.length - 1;
      const bareLower = word.toLowerCase().replace(/[^a-z']/g, '');

      if (KNOWN_ACRONYMS.has(bareLower)) {
        return word.toUpperCase();
      }

      if (!isEdge && MINOR_WORDS.has(bareLower)) {
        return word.toLowerCase();
      }

      // Capitalize the first letter of each hyphen-separated segment
      // (e.g. "JAY-Z" -> "Jay-Z") so hyphenated names read correctly.
      return word
        .toLowerCase()
        .split('-')
        .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
        .join('-');
    })
    .join(' ');
}

function isAllCaps(title: string): boolean {
  const letters = title.replace(/[^a-zA-Z]/g, '');
  return letters.length > 0 && letters === letters.toUpperCase();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const books = await prisma.book.findMany({ select: { id: true, title: true } });

  const toFix = books.filter((b) => isAllCaps(b.title));

  console.log(`Found ${toFix.length}/${books.length} ALL-CAPS titles.\n`);

  for (const book of toFix) {
    const newTitle = toTitleCase(book.title);
    console.log(`${book.id}\n  "${book.title}"\n  -> "${newTitle}"\n`);

    if (!dryRun) {
      await prisma.book.update({ where: { id: book.id }, data: { title: newTitle } });
    }
  }

  if (dryRun) {
    console.log('Dry run only — no changes written. Re-run without --dry-run to apply.');
  } else {
    console.log(`Updated ${toFix.length} book titles.`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});

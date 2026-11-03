import fs from 'fs';
import path from 'path';
import { EditorialArticle } from '../constants/editorial-articles';
import { editorialArticleSchema } from '@/lib/articleSchema';

// content/articles/{slug}.json holds full EditorialArticle JSON, written by the
// unseen "edit article" feature via the GitHub App (see src/lib/github.ts). It lives
// outside src/app so it's never statically imported into the build — always read from
// disk at request time, same as the markdown article fallback in mdArticleUtils.ts.
const ARTICLES_JSON_DIR = path.join(process.cwd(), 'content', 'articles');

/**
 * Load one JSON-backed article by slug. Returns null (and logs) if the file is
 * missing, unreadable, or fails schema validation — a bad file must never be able
 * to take the articles list or the build down.
 */
export function loadJSONArticle(slug: string): EditorialArticle | null {
  const filePath = path.join(ARTICLES_JSON_DIR, `${slug}.json`);

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const result = editorialArticleSchema.safeParse(parsed);

    if (!result.success) {
      console.warn(`Invalid JSON article at ${filePath}:`, result.error.message);
      return null;
    }

    return result.data as EditorialArticle;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`Error loading JSON article ${filePath}:`, error);
    }
    return null;
  }
}

/**
 * Get every valid JSON-backed article. Invalid/corrupt files are skipped, not thrown.
 */
export function getAllJSONArticles(): EditorialArticle[] {
  let fileNames: string[];

  try {
    fileNames = fs.readdirSync(ARTICLES_JSON_DIR).filter(f => f.endsWith('.json'));
  } catch {
    // Directory doesn't exist yet — no JSON-backed articles have been created.
    return [];
  }

  const articles: EditorialArticle[] = [];
  for (const fileName of fileNames) {
    const slug = fileName.replace(/\.json$/, '');
    const article = loadJSONArticle(slug);
    if (article) {
      articles.push(article);
    }
  }

  return articles;
}

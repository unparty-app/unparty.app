/**
 * The words a founder keeps coming back to: how often each word appears
 * across their published stories, articles or both. Served by /api/words
 * (any copy counts its own writing) and drawn on /founders as InkWords.
 *
 * Moved here from theunpartycloud's /api/content, which fetched this site's
 * articles and stories and counted them itself; the text extraction,
 * markdown stripping and stopwords are the same.
 *
 * Only work credited to the founder or the site counts, the same rule as the
 * resume (src/app/founders/resume-data.ts), so a copy's example content
 * never speaks for its owner.
 */
import 'server-only';
import storiesManifest from '@/data/storiesManifest.json';
import StorySchema from '@/utils/StorySchema';
import { getPublishedEditorialArticles } from '@/app/constants/editorial-articles/registry';
import type { EditorialArticle } from '@/app/constants/editorial-articles/types';
import { getAuthorDisplayName } from '@/app/constants/authors';
import { FOUNDER, FOUNDER_ANSWERS, LEGAL_NAME, SITE_NAME } from '@/app/constants/organization';
import type { WordCount, WordSource } from '@/app/components/resume/types';
import { wordsOf } from '@/lib/words';

export type { WordCount, WordSource };
export const WORD_SOURCES: WordSource[] = ['stories', 'articles', 'both'];


// Bylines, not themes: the words of the founder's name and the legal name
// (commit logs and author lines repeat them). The site's name stays, since
// it is what the writing is about
const NAME_WORDS = new Set(
  [FOUNDER.name, LEGAL_NAME, LEGAL_NAME.replace(/\s+/g, '')].flatMap(name => name.toLowerCase().split(/[^a-z0-9']+/)).filter(word => word.length > 2)
);
NAME_WORDS.delete(SITE_NAME.toLowerCase());

// Sections with no prose: source code, and the circle-then-text rows that
// hold links and metadata
const NON_PROSE_SECTIONS = new Set(['code', 'personal']);

const ownNames = new Set([FOUNDER.name, SITE_NAME].map(name => name.toLowerCase()));
const isOwn = (author: string | undefined) => !!author && ownNames.has(getAuthorDisplayName(author).toLowerCase());

const stripHtml = (text: string) => text.replace(/<[^>]+>/g, ' ');

function stripMarkdown(markdown: string): string {
  return stripHtml(markdown)
    .replace(/:::[\s\S]*?:::/g, ' ') // :::component[...]::: directives
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> their text
    .replace(/[#*_>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function articleText(article: EditorialArticle): string {
  const parts: string[] = [article.title, ...(article.tags ?? [])];
  for (const section of article.sections) {
    if (NON_PROSE_SECTIONS.has(section.type)) continue;
    if (section.content?.trim()) parts.push(section.content);
    if (section.userPrompt) parts.push(section.userPrompt);
    // A table keeps its words in metadata
    if (section.type === 'table') {
      parts.push(...(section.metadata?.headers ?? []), ...(section.metadata?.rows ?? []).flat());
    }
  }
  return stripMarkdown(parts.join(' '));
}

function tokenize(text: string): string[] {
  return wordsOf(text).filter(word => !NAME_WORDS.has(word));
}

/** One of the founder's published pieces, as plain text, and where it lives */
export interface OwnPiece {
  title: string;
  href: string;
  text: string;
}

/** The founder's published stories and articles (only work credited to them or the site) */
export async function ownPieces(from: WordSource = 'both'): Promise<OwnPiece[]> {
  const pieces: OwnPiece[] = [];
  if (from !== 'stories') {
    for (const article of getPublishedEditorialArticles()) {
      if (isOwn(article.author)) pieces.push({ title: article.title, href: `/article/${article.slug}`, text: articleText(article) });
    }
  }
  if (from !== 'articles') {
    const slugToCoverId = storiesManifest.slugToCoverId as Record<string, string>;
    const stories = await Promise.all(
      storiesManifest.published.map(async (slug) => ({ slug, story: slugToCoverId[slug] ? await StorySchema.getStoryByCoverId(slugToCoverId[slug]) : null }))
    );
    for (const { slug, story } of stories) {
      if (story?.metadata.published && isOwn(story.metadata.author)) {
        pieces.push({ title: story.metadata.title, href: `/story/${slug}`, text: `${story.metadata.title} ${stripMarkdown(story.content ?? '')}` });
      }
    }
  }
  return pieces;
}

async function ownTexts(from: WordSource): Promise<string[]> {
  const texts = (await ownPieces(from)).map((piece) => piece.text);
  // Their answers to the challenge are their words too (#265). Not a piece:
  // they have no page for a doubt to link to, and are neither story nor article
  if (from === 'both') texts.push(...Object.values(FOUNDER_ANSWERS).filter((answer): answer is string => !!answer));
  return texts;
}

// Content only changes with a deploy, so each list is counted once per
// server instance, for an hour
const cache = new Map<WordSource, { at: number; words: WordCount[] }>();
const CACHE_MS = 60 * 60 * 1000;

/** The founder's most used words, most used first */
export async function getWordCounts(from: WordSource = 'both', limit = 200): Promise<WordCount[]> {
  const cached = cache.get(from);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.words.slice(0, limit);

  const counts = new Map<string, number>();
  for (const text of await ownTexts(from)) {
    for (const word of tokenize(text)) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const words = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 200)
    .map(([word, count]) => ({ word, count }));
  cache.set(from, { at: Date.now(), words });
  return words.slice(0, limit);
}

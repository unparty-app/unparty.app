import { EDITORIAL_ARTICLES } from './editorial-articles/registry';
import type { EditorialArticle } from './editorial-articles/types';
import { SETUP_STEPS, setupStepId, type SetupChapter } from '../../../prisma/setup-steps';

// The SETUP. path as the site shows it (#1094, #589): its chapters, and each
// step's words and link, from prisma/setup-steps.ts and the step's article.
// SetupCurriculum lists it; a challenge section walks a chapter of it
// (ChallengeSteps), ticking the steps a builder has done

// `cover` takes anything resolveCoverSrc does (a coverId, a public/covers
// filename, or an absolute path); without one the circle is colorValue
export const CHAPTERS: { id: SetupChapter; promise: string; cover?: string }[] = [
  { id: 'OWN', promise: 'unparty.app is software you own.' },
  { id: 'RUN', promise: 'build and run your app.' },
  { id: 'SHIP', promise: 'connect your own domain and process.' },
  { id: 'FILL', promise: 'add your pictures, your words, your way.' },
  { id: 'YOURS', promise: 'make it your own.' },
];

export type SetupStep = (typeof SETUP_STEPS)[number];

/** A step as a reader meets it: its id in progress, title, words, and where it opens (null while its article isn't out) */
export interface SetupStepView {
  key: string;
  id: string;
  chapter?: SetupChapter;
  title: string;
  blurb: string;
  href: string | null;
}

// EDITORIAL_ARTICLES, not getEditorialArticle(): that one also reads JSON/MD
// files on the server, so the server render could disagree with the browser's
export function resolveSetupStep(step: SetupStep): SetupStepView {
  const article = EDITORIAL_ARTICLES.find((a) => a.slug === step.articleSlug);
  const live = Boolean(step.link && article?.published);
  return { key: step.key, id: setupStepId(step.key), chapter: step.chapter, title: step.title, blurb: article?.subtitle || step.description, href: live ? step.link! : null };
}

/** A step by its key, or undefined for a key the path doesn't have */
export const setupStepByKey = (key: string): SetupStepView | undefined => {
  const step = SETUP_STEPS.find((s) => s.key === key);
  return step ? resolveSetupStep(step) : undefined;
};

/** A chapter's steps, in the path's order */
export const chapterSteps = (chapter: SetupChapter): SetupStepView[] => SETUP_STEPS.filter((s) => s.chapter === chapter).map(resolveSetupStep);

/** The chapter of the step an article is the guide to, when it is one */
export const chapterOfArticle = (slug: string): SetupChapter | undefined => SETUP_STEPS.find((s) => s.articleSlug === slug)?.chapter;

/**
 * A SETUP. step's article, ending on its chapter's challenge (#589): where the
 * builder stands in the chapter, each step ticked once done, and what's next.
 * Every article that guides a step gets it, unless it already walks a chapter
 */
export function withOnboarding(article: EditorialArticle): EditorialArticle {
  const chapter = chapterOfArticle(article.slug);
  if (!chapter || article.sections.some((s) => s.type === 'challenge' && s.setup)) return article;
  return { ...article, sections: [...article.sections, { id: 'onboarding', type: 'challenge', setup: chapter }] };
}

export { SETUP_STEPS, type SetupChapter };

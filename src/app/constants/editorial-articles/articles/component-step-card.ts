import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of StepCard. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_STEP_CARD_ARTICLE: EditorialArticle = {
  slug: 'component-step-card',
  title: 'STEP CARD.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs, found by npm run create:component-article -- --needs:
  //   clerk: src/app/components/StepQuestion.tsx
  //   neon: src/app/api/questions/[questionId]/response/route.ts
  presents: { component: 'StepCard', needs: ['clerk', 'neon'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Step Card'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'step card.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'StepCard', componentProps: { unpppId: 'theunpartyapp' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'TODO. When to use it, and what to change.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'StepCard\', componentProps: { unpppId: \'theunpartyapp\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Step Card.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/unparty-runway-story · RULE 01:
    {
      id: 'where-article-unparty-runway-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

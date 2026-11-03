import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of DependCardScroll. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_DEPEND_CARD_SCROLL_ARTICLE: EditorialArticle = {
  slug: 'component-depend-card-scroll',
  title: 'DEPEND CARD SCROLL.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'DependCardScroll', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Depend Card Scroll'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'depend card scroll.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'DependCardScroll', componentProps: { title: 'WHAT WE DEPEND ON' } }
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
      content: '{ type: \'component\', metadata: { componentName: \'DependCardScroll\', componentProps: { title: \'WHAT WE DEPEND ON\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Depend Card Scroll.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /goal-budget · GOAL.
    {
      id: 'where-goal-budget',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/goal-budget' },
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

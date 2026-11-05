import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of DependCardScroll. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_DEPEND_CARD_SCROLL_ARTICLE: EditorialArticle = {
  slug: 'component-depend-card-scroll',
  title: 'DEPEND CARD SCROLL.',
  subtitle: 'what your site depends on.',
  description: 'A row of cards for each service your site runs on and what it costs a month.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
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
      content: 'a row of cards for each service your site runs on and what it costs a month.'
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
      content: 'change the title. the cards come from your stack.'
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
      content: 'goal.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/goal-budget' },
    },
    // /article/unparty-runway-story · RULE 01:
    {
      id: 'where-article-unparty-runway-story',
      type: 'personal',
      content: 'rule 01.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

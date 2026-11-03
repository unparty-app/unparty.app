import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of Definitions. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_DEFINITIONS_ARTICLE: EditorialArticle = {
  slug: 'component-definitions',
  title: 'DEFINITIONS.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'Definitions', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Definitions'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'definitions.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'Definitions', componentProps: { unpppId: 'theunpartyapp', showNavigation: true } }
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
      content: '{ type: \'component\', metadata: { componentName: \'Definitions\', componentProps: { unpppId: \'theunpartyapp\', showNavigation: true } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Definitions.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/unparty-works-story · HOW unparty-app BUILDS.
    {
      id: 'where-article-unparty-works-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of FiveThingsChallenge. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_FIVE_THINGS_CHALLENGE_ARTICLE: EditorialArticle = {
  slug: 'component-five-things-challenge',
  title: 'FIVE THINGS CHALLENGE.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'FiveThingsChallenge', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Five Things Challenge'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'five things challenge.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'FiveThingsChallenge', componentProps: { prompt: 'CREATE YOUR OWN LIST OF 5 THINGS TO REMEMBER.' } }
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
      content: '{ type: \'component\', metadata: { componentName: \'FiveThingsChallenge\', componentProps: { prompt: \'CREATE YOUR OWN LIST OF 5 THINGS TO REMEMBER.\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Five Things Challenge.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/personal-044 · PERSONAL.
    {
      id: 'where-story-personal-044',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

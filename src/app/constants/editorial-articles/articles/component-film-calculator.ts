import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of FilmCalculator. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_FILM_CALCULATOR_ARTICLE: EditorialArticle = {
  slug: 'component-film-calculator',
  title: 'FILM CALCULATOR.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'FilmCalculator', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Film Calculator'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'film calculator.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'FilmCalculator', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'FilmCalculator\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Film Calculator.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /film-calculator · Film ROI Calculator
    {
      id: 'where-film-calculator',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

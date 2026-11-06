import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ComponentTable. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_COMPONENT_TABLE_ARTICLE: EditorialArticle = {
  slug: 'component-component-table',
  title: 'COMPONENT TABLE.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-11-05',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'ComponentTable', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Component Table'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'component table.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ComponentTable', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'ComponentTable\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Component Table.' }
    }
  ]
};

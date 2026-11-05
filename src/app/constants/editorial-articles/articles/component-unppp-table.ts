import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of UnpppTable. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_UNPPP_TABLE_ARTICLE: EditorialArticle = {
  slug: 'component-unppp-table',
  title: 'UNPPP TABLE.',
  subtitle: 'every project, one table.',
  description: 'Every project with its price, hours and kind of build, with columns that sort and tabs by kind.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'UnpppTable', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Unppp Table'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'unppp table.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'every project with its price, hours and kind of build, with columns that sort and tabs by kind.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'UnpppTable', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'no props. it reads your projects.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'UnpppTable\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Unppp Table.' }
    }
  ]
};

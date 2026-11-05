import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of Strike. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_STRIKE_ARTICLE: EditorialArticle = {
  slug: 'component-strike',
  title: 'STRIKE.',
  subtitle: 'cross it out.',
  description: 'Text with a line through it, for the idea you left behind.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'Strike', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Strike'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'strike.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'text with a line through it, for the idea you left behind.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'Strike', componentProps: { text: 'strike it out.' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give it text. font, style and color are optional.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'Strike\', componentProps: { text: \'strike it out.\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Strike.' }
    }
  ]
};

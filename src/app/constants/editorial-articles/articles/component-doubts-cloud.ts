import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of DoubtsCloud. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_DOUBTS_CLOUD_ARTICLE: EditorialArticle = {
  slug: 'component-doubts-cloud',
  title: 'DOUBTS CLOUD.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-15',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  presents: { component: 'DoubtsCloud', needs: ['clerk'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Doubts Cloud'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'doubts cloud.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'DoubtsCloud', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'DoubtsCloud\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Doubts Cloud.' }
    }
  ]
};

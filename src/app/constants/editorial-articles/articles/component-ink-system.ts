import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of InkSystem. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_INK_SYSTEM_ARTICLE: EditorialArticle = {
  slug: 'component-ink-system',
  title: 'INK SYSTEM.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-11-02',
  published: false,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'InkSystem', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Ink System'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'ink system.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'InkSystem', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'InkSystem\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Ink System.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/how-unparty-was-built · STARTING SOMEWHERE.
    {
      id: 'where-article-how-unparty-was-built',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

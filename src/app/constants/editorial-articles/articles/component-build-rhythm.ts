import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of BuildRhythm. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_BUILD_RHYTHM_ARTICLE: EditorialArticle = {
  slug: 'component-build-rhythm',
  title: 'BUILD RHYTHM.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-21',
  published: false,
  coverColor: 'theme',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'BuildRhythm', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Build Rhythm'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'build rhythm.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'BuildRhythm', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'BuildRhythm\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Build Rhythm.' }
    }
  ]
};

import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of BuildYours. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_BUILD_YOURS_ARTICLE: EditorialArticle = {
  slug: 'component-build-yours',
  title: 'BUILD YOURS.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-10-29',
  published: false,
  coverColor: 'theme',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'BuildYours', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Build Yours'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'build yours.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'BuildYours', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'BuildYours\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Build Yours.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/unparty-app-story · unparty.app
    {
      id: 'where-article-unparty-app-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

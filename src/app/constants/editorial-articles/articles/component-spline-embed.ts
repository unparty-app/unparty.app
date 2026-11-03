import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of SplineEmbed. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_SPLINE_EMBED_ARTICLE: EditorialArticle = {
  slug: 'component-spline-embed',
  title: 'SPLINE EMBED.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'SplineEmbed', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Spline Embed'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'spline embed.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'SplineEmbed', componentProps: { scene: 'https://prod.spline.design/tLK98DRBRgvzrMYb/scene.splinecode' } }
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
      content: '{ type: \'component\', metadata: { componentName: \'SplineEmbed\', componentProps: { scene: \'https://prod.spline.design/tLK98DRBRgvzrMYb/scene.splinecode\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Spline Embed.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/how-to-create-an-about · How to create an ABOUT.
    {
      id: 'where-story-how-to-create-an-about',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};

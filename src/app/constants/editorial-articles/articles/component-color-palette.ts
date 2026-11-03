import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ColorPalette. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_COLOR_PALETTE_ARTICLE: EditorialArticle = {
  slug: 'component-color-palette',
  title: 'COLOR PALETTE.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs, found by npm run create:component-article -- --needs:
  //   clerk: src/app/components/ImportColorsCssModal.tsx
  //   neon: src/app/api/user/brand-colors/route.ts
  presents: { component: 'ColorPalette', needs: ['clerk', 'neon'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Color Palette'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'color palette.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ColorPalette', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'ColorPalette\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Color Palette.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /color · /color
    {
      id: 'where-color',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/color' },
    },
    // /theunpartycharette · Explore Your Ideas, Find Your Focus
    {
      id: 'where-theunpartycharette',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

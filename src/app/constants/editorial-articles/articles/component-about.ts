import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of AboutComponent. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_ABOUT_ARTICLE: EditorialArticle = {
  slug: 'component-about',
  title: 'ABOUT.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs, found by npm run create:component-article -- --needs:
  //   clerk: src/app/hooks/useUnpppVisitTracking.ts
  //   neon: src/app/api/unppp/[unpppId]/steps/route.ts
  //   github: src/app/api/stories/[storyId]/route.ts
  presents: { component: 'AboutComponent', needs: ['clerk', 'neon', 'github'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'About'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'about.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'AboutComponent', componentProps: { unpppId: 'theunpartyapp' } }
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
      content: '{ type: \'component\', metadata: { componentName: \'AboutComponent\', componentProps: { unpppId: \'theunpartyapp\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed About.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // 37 more places embed it; these are the first 6
    // /about · /about
    {
      id: 'where-about',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/about' },
    },
    // /theunpartyapi · unparty - Building an API for Non-Technical Founders & Small Business Owners
    {
      id: 'where-theunpartyapi',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartyapp · unparty-app
    {
      id: 'where-theunpartyapp',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartybq · Brand Guidelines & CSS Generator for Founders
    {
      id: 'where-theunpartybq',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartybrand · theunpartybrand
    {
      id: 'where-theunpartybrand',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartybudget · theunpartybudget
    {
      id: 'where-theunpartybudget',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

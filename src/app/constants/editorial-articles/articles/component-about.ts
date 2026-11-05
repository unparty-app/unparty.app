import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of AboutComponent. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_ABOUT_ARTICLE: EditorialArticle = {
  slug: 'component-about',
  title: 'ABOUT.',
  subtitle: 'your project, told by your own site.',
  description: 'A project\'s own page: its hours, the stories and docs about it, and where it leads, from what your site already holds.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
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
      content: 'a project\'s own page: its hours, the stories and docs about it, and where it leads, from what your site already holds.'
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
      content: 'give it a project id. its chapters fill in as you write about that project.'
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
      content: 'the about page.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/about' },
    },
    // /theunpartyapi · unparty - Building an API for Non-Technical Founders & Small Business Owners
    {
      id: 'where-theunpartyapi',
      type: 'personal',
      content: 'unparty - building an api for non-technical founders & small business owners.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartyapp · unparty-app
    {
      id: 'where-theunpartyapp',
      type: 'personal',
      content: 'unparty-app.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartybq · Brand Guidelines & CSS Generator for Founders
    {
      id: 'where-theunpartybq',
      type: 'personal',
      content: 'brand guidelines & css generator for founders.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartybrand · theunpartybrand
    {
      id: 'where-theunpartybrand',
      type: 'personal',
      content: 'theunpartybrand.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartybudget · theunpartybudget
    {
      id: 'where-theunpartybudget',
      type: 'personal',
      content: 'theunpartybudget.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

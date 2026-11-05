import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of TypeStatline. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_TYPE_STATLINE_ARTICLE: EditorialArticle = {
  slug: 'component-type-statline',
  title: 'TYPE STATLINE.',
  subtitle: 'what you build, as one line.',
  description: 'Your work by kind of build, as one line in each kind\'s color. point at a segment to read it.',
  category: 'MAKE.',
  date: '2026-10-21',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'TypeStatline', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Type Statline'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'type statline.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'your work by kind of build, as one line in each kind\'s color. point at a segment to read it.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'TypeStatline', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'no props. highlight raises one kind.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'TypeStatline\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Type Statline.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // / · every page (the site layout)
    {
      id: 'where-home',
      type: 'personal',
      content: 'every page (the site layout).',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/' },
    },
    // /about · about
    {
      id: 'where-about',
      type: 'personal',
      content: 'about.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/about' },
    }
  ]
};

import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of DeleteYourDoubts. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_DELETE_YOUR_DOUBTS_ARTICLE: EditorialArticle = {
  slug: 'component-delete-your-doubts',
  title: 'DELETE YOUR DOUBTS.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-15',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  presents: { component: 'DeleteYourDoubts', needs: ['clerk'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Delete Your Doubts'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'delete your doubts.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'DeleteYourDoubts', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'DeleteYourDoubts\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Delete Your Doubts.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/unparty-unppp-story · do you unppp?
    {
      id: 'where-article-unparty-unppp-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};

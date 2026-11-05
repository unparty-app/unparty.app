import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of DeleteYourDoubts. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_DELETE_YOUR_DOUBTS_ARTICLE: EditorialArticle = {
  slug: 'component-delete-your-doubts',
  title: 'DELETE YOUR DOUBTS.',
  subtitle: 'two minutes. write them. delete them.',
  description: 'A two minute timer to write down every doubt, then delete them one at a time with a stroke of the pen.',
  category: 'MAKE.',
  date: '2026-10-15',
  updated: '2026-11-04',
  published: true,
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
      content: 'a two minute timer to write down every doubt, then delete them one at a time with a stroke of the pen.'
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
      content: 'no props. your doubts stay yours unless you are the owner and choose to keep them.'
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
      content: 'do you unppp?.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};

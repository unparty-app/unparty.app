import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of YourWords. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_YOUR_WORDS_ARTICLE: EditorialArticle = {
  slug: 'component-your-words',
  title: 'YOUR WORDS.',
  subtitle: 'what you keep coming back to.',
  description: 'Write a few lines about what you keep coming back to. Your words rise into the same field as the words this site uses most, and the ones you share light up.',
  category: 'MAKE.',
  date: '2026-10-19',
  updated: '2026-10-19',
  published: true,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // needs: none. It reads /api/words, which counts this site's own writing
  presents: { component: 'YourWords', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Build', 'Word Bank', 'Your Words'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'your words.'
    },
     {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'YourWords', componentProps: {} }
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'I think it is important to know your most used words when building.'
    },
   
    {
      id: 'columns-example',
      type: 'columns',
      metadata: { layout: '1:1' },
      leftSections: [
        {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
      ],
      rightSections: [
        {
      id: 'why-you-should',
      type: 'personal',
      content: 'As you build **your** own version of unparty you will fill up articles and stories with your own work. The ***your-words*** component takes these words from your own published stories and articles to create a ***word-bank*** so that you have a visually driven way to understand your development focus. The more you write, the more your ***word-bank*** grows.'
    },
      ]
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'build it.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'YourWords\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Your Words.' }
    }
  ]
};

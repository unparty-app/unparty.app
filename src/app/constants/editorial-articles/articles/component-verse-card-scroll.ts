import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of VerseCardScroll. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_VERSE_CARD_SCROLL_ARTICLE: EditorialArticle = {
  slug: 'component-verse-card-scroll',
  title: 'VERSE CARD SCROLL.',
  subtitle: 'the words you keep coming back to.',
  description: 'A row of verses or quotes, each on its own card.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'VerseCardScroll', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Verse Card Scroll'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'verse card scroll.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a row of verses or quotes, each on its own card.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'VerseCardScroll', componentProps: { title: 'VERSES.', cards: [{ label: 'VERSE.', verse: 'write a line worth keeping.', attribution: 'you' }] } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give it a title and a list of cards.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'VerseCardScroll\', componentProps: { title: \'VERSES.\', cards: [{ label: \'VERSE.\', verse: \'write a line worth keeping.\', attribution: \'you\' }] } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Verse Card Scroll.' }
    }
  ]
};

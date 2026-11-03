import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of VerseCardScroll. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_VERSE_CARD_SCROLL_ARTICLE: EditorialArticle = {
  slug: 'component-verse-card-scroll',
  title: 'VERSE CARD SCROLL.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
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
      content: 'TODO. What it does, in a sentence or two.'
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
      content: 'TODO. When to use it, and what to change.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'VerseCardScroll\', componentProps: { title: \'VERSES.\', cards: [{ label: \'VERSE.\', verse: \'write a line worth keeping.\', attribution: \'you\' }] } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Verse Card Scroll.' }
    }
  ]
};

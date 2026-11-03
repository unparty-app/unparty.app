import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of InkWords. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_INK_WORDS_ARTICLE: EditorialArticle = {
  slug: 'component-ink-words',
  title: 'INK WORDS.',
  subtitle: 'what do you keep coming back to?',
  description: 'The words you use most across your stories, articles or both, sized by how often you use them, the biggest rising first. Counted from your own writing.',
  category: 'MAKE.',
  date: '2026-10-12',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'InkWords', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Ink Words'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'ink words.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'the words you use most, sized by how often, the biggest rising first. switch between your stories, articles and both to visualize what you are writing about the most.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'InkWords', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'nothing to set up, your app auto it counts your own published writing.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'InkWords\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Ink Words.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/vibe-coding-invisible-to-google · There Is No Such Thing As Vibe Coding.
    {
      id: 'where-article-vibe-coding-invisible-to-google',
      type: 'personal',
      content: 'your words, next to the case for writing your own.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};

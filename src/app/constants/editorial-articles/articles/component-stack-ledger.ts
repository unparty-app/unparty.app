import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of StackLedger. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_STACK_LEDGER_ARTICLE: EditorialArticle = {
  slug: 'component-stack-ledger',
  title: 'STACK LEDGER.',
  subtitle: 'what does it cost to run?',
  description: 'Every service your site runs on, by what it costs a month, as hand-drawn bars that sweep in longest first. Drawn from the stack in your FoundersConfig.',
  category: 'MAKE.',
  date: '2026-10-12',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'StackLedger', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Stack Ledger'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'what you depend on.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'every depend your app runs on, listed by what it costs you a month.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'StackLedger', componentProps: { source: 'stack' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'put what you pay in **stack** in your FoundersConfig. yearly bills are spread over twelve months.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'StackLedger\', componentProps: { source: \'stack\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Stack Ledger.' }
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
      content: 'the stack, next to what a copy of your own would cost.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};

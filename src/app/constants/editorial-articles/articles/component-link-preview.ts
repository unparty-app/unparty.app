import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of LinkPreview. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_LINK_PREVIEW_ARTICLE: EditorialArticle = {
  slug: 'component-link-preview',
  title: 'LINK PREVIEW.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-14',
  published: false,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // Runs on nothing but the site itself: /api/og draws the card from FoundersConfig
  presents: { component: 'LinkPreview', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Link Preview'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'link preview.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'LinkPreview', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'LinkPreview\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Link Preview.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /og · LINKS.
    {
      id: 'where-og',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/og' },
    },
    // /theunpartychatty · Chatty
    {
      id: 'where-theunpartychatty',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/setup-identity · MAKE IT YOURS.
    {
      id: 'where-article-setup-identity',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-identity' },
    }
  ]
};

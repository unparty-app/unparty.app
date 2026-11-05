import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of LinkPreview. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_LINK_PREVIEW_ARTICLE: EditorialArticle = {
  slug: 'component-link-preview',
  title: 'LINK PREVIEW.',
  subtitle: 'what people see when you share your link.',
  description: 'Your real share card, as it shows up in Messages, X and Slack. type a title and it redraws.',
  category: 'MAKE.',
  date: '2026-10-14',
  updated: '2026-11-04',
  published: true,
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
      content: 'your real share card, as it shows up in Messages, X and Slack. type a title and it redraws.'
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
      content: 'no props. pick one of your pages, or type your own title.'
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
      content: 'links.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/og' },
    },
    // /theunpartychatty · Chatty
    {
      id: 'where-theunpartychatty',
      type: 'personal',
      content: 'chatty.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/setup-identity · MAKE IT YOURS.
    {
      id: 'where-article-setup-identity',
      type: 'personal',
      content: 'make it yours.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-identity' },
    }
  ]
};

import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of TikTokEmbed. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_TIKTOK_EMBED_ARTICLE: EditorialArticle = {
  slug: 'component-tiktok-embed',
  title: 'TIKTOK EMBED.',
  subtitle: 'a TikTok, in your story.',
  description: 'A TikTok video, right where you are writing about it.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'TikTokEmbed', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'TikTok Embed'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'tiktok embed.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a TikTok video, right where you are writing about it.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'TikTokEmbed', componentProps: { videoUrl: 'https://www.tiktok.com/@cristienorman_somm/video/7626250481697950990', title: 'Cost of Goods Formula by @cristienorman_somm' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give it the video\'s url.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'TikTokEmbed\', componentProps: { videoUrl: \'https://www.tiktok.com/@cristienorman_somm/video/7626250481697950990\', title: \'Cost of Goods Formula by @cristienorman_somm\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed TikTok Embed.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/debt-043 · DEBT.
    {
      id: 'where-story-debt-043',
      type: 'personal',
      content: 'debt.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

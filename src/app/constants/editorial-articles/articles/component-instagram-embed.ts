import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of InstagramEmbed. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_INSTAGRAM_EMBED_ARTICLE: EditorialArticle = {
  slug: 'component-instagram-embed',
  title: 'INSTAGRAM EMBED.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'InstagramEmbed', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Instagram Embed'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'instagram embed.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'InstagramEmbed', componentProps: { postUrl: 'https://www.instagram.com/reel/DOOaqIjggTN/', title: 'ig.' } }
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
      content: '{ type: \'component\', metadata: { componentName: \'InstagramEmbed\', componentProps: { postUrl: \'https://www.instagram.com/reel/DOOaqIjggTN/\', title: \'ig.\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Instagram Embed.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/personal-044 · PERSONAL.
    {
      id: 'where-story-personal-044',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

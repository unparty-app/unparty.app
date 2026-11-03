import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ColorMatchingGame. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_COLOR_MATCHING_GAME_ARTICLE: EditorialArticle = {
  slug: 'component-color-matching-game',
  title: 'COLOR MATCHING GAME.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'ColorMatchingGame', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Color Matching Game'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'color matching game.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ColorMatchingGame', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'ColorMatchingGame\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Color Matching Game.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /color · /color
    {
      id: 'where-color',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/color' },
    },
    // /theunpartycharette · Explore Your Ideas, Find Your Focus
    {
      id: 'where-theunpartycharette',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/unparty-brand-story · RULE 02:
    {
      id: 'where-article-unparty-brand-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /story/source · SOURCE.
    {
      id: 'where-story-source',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /story/i-noticed · I noticed.
    {
      id: 'where-story-i-noticed',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};

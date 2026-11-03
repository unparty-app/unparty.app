import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of Cta
export const COMPONENT_CTA_ARTICLE: EditorialArticle = {
  slug: 'component-cta',
  title: 'CTA.',
  subtitle: 'one ask, anywhere: a pill that says where to go next.',
  description: 'Cta is your site\'s ask as a pill you can put in any story or article: your words, where it leads, and an arrow. Every click is counted the same way, with where it was clicked, so you can see which ask works.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-10-15',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  presents: { component: 'Cta', needs: [] },
  unpppType: 'app',
  author: 'justin-murry',
  tags: ['Component', 'Make', 'CTA'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'cta.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'A story or an article should end somewhere. Cta is the one thing you ask the reader to do next, in your words, and it goes where you send it.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'Cta', componentProps: { label: 'express yourself.', href: '/article/setup-start-here' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'Give it a label and an href. Use one per page, at the moment the reader is ready: after the line that makes the point. Every click is counted as cta_clicked with its label and the page it was on, once the visitor accepts cookies, so you can compare one ask against another.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'Cta\', componentProps: { label: \'express yourself.\', href: \'/article/setup-start-here\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed CTA.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /founders · founders
    {
      id: 'where-founders',
      type: 'personal',
      content: 'build yours, on the founder\'s page.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/founders' },
    },
    // /story/personal-mission · MY FRIENDS DO NOT LIKE MY WRITING.
    {
      id: 'where-story-personal-mission',
      type: 'personal',
      content: 'express yourself, after the poem.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    },
    {
      id: 'where-story-learn',
      type: 'personal',
      content: 'draw yours, beside the icon pad.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

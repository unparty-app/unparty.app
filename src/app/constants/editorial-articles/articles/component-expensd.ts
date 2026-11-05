import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of Expensd. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_EXPENSD_ARTICLE: EditorialArticle = {
  slug: 'component-expensd',
  title: 'EXPENSD.',
  subtitle: 'keep time on what you build.',
  description: 'A clock for your work: start, stop or add hours, and see what your time is worth.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'Expensd', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Expensd'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'expensd.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a clock for your work: start, stop or add hours, and see what your time is worth.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'Expensd', componentProps: { unpppId: 'theunpartyapp', showNavigation: true } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give it a project id. the rate comes from your baseline, and you can edit it in place.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'Expensd\', componentProps: { unpppId: \'theunpartyapp\', showNavigation: true } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Expensd.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /theunpartyrunway · Track Your Baseline & Runway
    {
      id: 'where-theunpartyrunway',
      type: 'personal',
      content: 'track your baseline & runway.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/unparty-works-story · HOW unparty-app BUILDS.
    {
      id: 'where-article-unparty-works-story',
      type: 'personal',
      content: 'how unparty-app builds.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /story/story · STORY.
    {
      id: 'where-story-story',
      type: 'personal',
      content: 'story.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

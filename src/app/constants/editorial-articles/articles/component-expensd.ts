import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of Expensd. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_EXPENSD_ARTICLE: EditorialArticle = {
  slug: 'component-expensd',
  title: 'EXPENSD.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
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
      content: 'TODO. What it does, in a sentence or two.'
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
      content: 'TODO. When to use it, and what to change.'
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
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/unparty-works-story · HOW unparty-app BUILDS.
    {
      id: 'where-article-unparty-works-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /story/story · STORY.
    {
      id: 'where-story-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

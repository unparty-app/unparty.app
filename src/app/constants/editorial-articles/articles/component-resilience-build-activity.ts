import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ResilienceBuildActivity. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_RESILIENCE_BUILD_ACTIVITY_ARTICLE: EditorialArticle = {
  slug: 'component-resilience-build-activity',
  title: 'RESILIENCE BUILD ACTIVITY.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'ResilienceBuildActivity', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Resilience Build Activity'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'resilience build activity.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ResilienceBuildActivity', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'ResilienceBuildActivity\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Resilience Build Activity.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/deck · DECK.
    {
      id: 'where-story-deck',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

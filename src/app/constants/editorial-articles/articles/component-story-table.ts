import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of StoryTable. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_STORY_TABLE_ARTICLE: EditorialArticle = {
  slug: 'component-story-table',
  title: 'STORY TABLE.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs, found by npm run create:component-article -- --needs:
  //   github: src/app/api/stories/[storyId]/route.ts
  presents: { component: 'StoryTable', needs: ['github'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Story Table'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'story table.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'StoryTable', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'StoryTable\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Story Table.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/stage · STAGE.
    {
      id: 'where-story-stage',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

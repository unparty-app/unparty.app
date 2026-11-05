import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of AIWrappedVisualization. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_AI_WRAPPED_ARTICLE: EditorialArticle = {
  slug: 'component-ai-wrapped',
  title: 'AI WRAPPED.',
  subtitle: 'a year with an LLM, drawn big.',
  description: 'A year of LLM use as one big picture: the total, the hours, the timeline and the peak days. tap through each view.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  // theunpartyrunway's ae-v* releases (the AI Energy Impact Analyzer) ship it (#1033)
  presents: { component: 'AIWrappedVisualization', needs: [], release: 'ae' },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'AI Wrapped'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'ai wrapped.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a year of LLM use as one big picture: the total, the hours, the timeline and the peak days. tap through each view.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'AIWrappedVisualization', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'it ships with unparty\'s year. swap in your own numbers.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'AIWrappedVisualization\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed AI Wrapped.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/how-unparty-wrapped-year · WRAPPED.
    {
      id: 'where-story-wrapped',
      type: 'personal',
      content: 'wrapped.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

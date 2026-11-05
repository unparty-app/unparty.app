import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ResilienceReflection. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_RESILIENCE_REFLECTION_ARTICLE: EditorialArticle = {
  slug: 'component-resilience-reflection',
  title: 'RESILIENCE REFLECTION.',
  subtitle: 'an ethos over three pillars.',
  description: 'A values statement standing over three pillars — grounded progress, resilience through reflection, community impact — each with one line for the action you will actually take.',
  category: 'MAKE.',
  date: '2026-10-14',
  published: true,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'ResilienceReflection', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Resilience Reflection'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'resilience reflection.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: "a values statement, held up by three pillars. each pillar says what it means and leaves one input: the action you'll take on it. nothing saves anywhere — it's a reflection, not a form."
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ResilienceReflection', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: "swap the `valuesStatement` and the three pillars in the component for your own ethos. it was written in the site's first month, when resilience was the whole pitch — the oldest statement of what this place is for."
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'ResilienceReflection\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Resilience Reflection.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /theunpartycore · How unparty Uses Reflection to Understand Focus
    {
      id: 'where-theunpartycore',
      type: 'personal',
      content: 'on the core concept page, where the ethos came from.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

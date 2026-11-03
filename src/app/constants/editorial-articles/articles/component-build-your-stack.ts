import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of BuildYourStack. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_BUILD_YOUR_STACK_ARTICLE: EditorialArticle = {
  slug: 'component-build-your-stack',
  title: 'BUILD YOUR STACK.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'BuildYourStack', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Build Your Stack'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'build your stack.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'BuildYourStack', componentProps: {} }
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
      content: '{ type: \'component\', metadata: { componentName: \'BuildYourStack\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Build Your Stack.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/unparty-app-story · unparty.app
    {
      id: 'where-article-unparty-app-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

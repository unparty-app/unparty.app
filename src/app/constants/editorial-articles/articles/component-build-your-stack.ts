import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of BuildYourStack. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_BUILD_YOUR_STACK_ARTICLE: EditorialArticle = {
  slug: 'component-build-your-stack',
  title: 'BUILD YOUR STACK.',
  subtitle: 'build yours for what you choose to spend.',
  description: 'Pick what your copy runs on and see the monthly cost, and which features that stack lets you build.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
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
      content: 'pick what your copy runs on and see the monthly cost, and which features that stack lets you build.'
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
      content: 'no props. pick a starting point with lens, and point start building wherever you want.'
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
      content: 'unparty.app.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

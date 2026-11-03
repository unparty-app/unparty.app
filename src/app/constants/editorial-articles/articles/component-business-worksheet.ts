import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of BusinessWorksheet. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_BUSINESS_WORKSHEET_ARTICLE: EditorialArticle = {
  slug: 'component-business-worksheet',
  title: 'BUSINESS WORKSHEET.',
  subtitle: 'Add questions and rank to find connections for your small business based on your standards, budget, product, growth, to focus your core idea.',
  description: 'An unparty.app idea for you to make connections using .',
  category: 'MAKE.',
  coverColor: 'theme',
  coverStyle: 'compound-eye',   // or 'tile' / 'kaleidoscope'
  date: '2026-10-09',
  updated: '2026-10-09',
  published: true,
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'BusinessWorksheet', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Business Worksheet'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'business worksheet.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'BusinessWorksheet', componentProps: { initialCategory: 'core' } }
    },
    {
      id: 'what-it-does',
      type: 'personal',
      content: 'I think the original idea here was to create connections based on how users answered questions. Might be worth pursuing if you have connection points you know you want to make, for me it was premature because I did not yet know the needs of my business.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'add questions, give them a score, and set your standards.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'BusinessWorksheet\', componentProps: { initialCategory: \'core\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Business Worksheet.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'learn more.'
    },
    {
      id: 'where-dashboard',
      type: 'personal',
      content: 'create questions across categories.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    {
      id: 'where-demo',
      type: 'personal',
      content: 'to try it out. pick a category and answer just those questions.',
      metadata: { avatar: '/covers/cover-002.png', storyLink: '/business-test' },
    }
  ]
};

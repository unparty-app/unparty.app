import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ArticlePreview. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_ARTICLE_PREVIEW_ARTICLE: EditorialArticle = {
  slug: 'component-article-preview',
  title: 'ARTICLE PREVIEW.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'ArticlePreview', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Article Preview'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'article preview.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ArticlePreview', componentProps: { slug: 'theunpartycharette-unlocal_status', sourceComponentName: 'ColorPalette' } }
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
      content: '{ type: \'component\', metadata: { componentName: \'ArticlePreview\', componentProps: { slug: \'theunpartycharette-unlocal_status\', sourceComponentName: \'ColorPalette\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Article Preview.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/unparty-charette-story · the future is human or something like that.
    {
      id: 'where-article-unparty-charette-story',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

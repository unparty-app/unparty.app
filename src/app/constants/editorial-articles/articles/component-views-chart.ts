import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ViewsChart. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_VIEWS_CHART_ARTICLE: EditorialArticle = {
  slug: 'component-views-chart',
  title: 'VIEWS CHART.',
  subtitle: 'is anyone reading?',
  description: "Thirty days of your site's pageviews as one hand-drawn line ending on today, then the five pages people read most. Drawn from your analytics, and off until you turn it on.",
  category: 'MAKE.',
  date: '2026-10-12',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'ViewsChart', needs: ['neon', 'drains'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Views Chart'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'views chart.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'thirty days of pageviews as one pen line, ending on today, then the pages people read most. your traffic is yours to share, so it stays empty until you turn it on.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ViewsChart', componentProps: { source: 'views' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'turn on **founder.resume.views** in FoundersConfig. it reads the analytics drain, so it needs your database and analytics connected.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'ViewsChart\', componentProps: { source: \'views\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Views Chart.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /founders · founders
    {
      id: 'where-founders',
      type: 'personal',
      content: 'VIEWS. on your founder page, once you turn it on.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/founders' },
    }
  ]
};

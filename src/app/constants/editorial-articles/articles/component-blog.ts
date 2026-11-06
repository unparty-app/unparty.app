import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of Blog. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_BLOG_ARTICLE: EditorialArticle = {
  slug: 'component-blog',
  title: 'BLOG.',
  subtitle: 'one project, told as a card.',
  description: 'One of your projects as a card: its cover, its name linked to where it lives, its tagline, and its description with your keywords lit in your theme color.',
  category: 'MAKE.',
  date: '2026-10-14',
  updated: '2026-11-06',
  published: true,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'Blog', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Blog'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'blog.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'one project, told as a card: its cover, its name linked to where it lives, its tagline, and its description with the words you keep coming back to lit in your theme color. it started in april 2025 announcing unppp., the iOS app unparty began as, back when the whole ask was a TestFlight link.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'Blog', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: "it shows your first project in `FoundersConfig.json`: its `name`, `tagline`, `description`, `cover` and `url`. pass `projectId` to show a different one. the lit words are your keywords (KeywordsConfig). with no projects yet, it shows nothing."
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'Blog\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Blog.' }
    }
  ]
};

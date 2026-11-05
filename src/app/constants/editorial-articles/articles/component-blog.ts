import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of Blog. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_BLOG_ARTICLE: EditorialArticle = {
  slug: 'component-blog',
  title: 'BLOG.',
  subtitle: 'the first product card.',
  description: 'The card that announced unppp., the iOS app unparty started as: a phone-frame screenshot, a TestFlight link, and every keyword lit in your theme color. A piece of the site from april 2025, kept working.',
  category: 'MAKE.',
  date: '2026-10-14',
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
      content: 'one product, told as a card: name, pitch, a description with its keywords lit in your theme color, platform and audience pills, and a phone-frame screenshot. it announced unppp., the iOS app unparty began as, back when the whole ask was a TestFlight link.'
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
      content: "the post lives in the component's own `posts` array: swap in your product's name, description, screenshot and link, and the keyword highlighting (KeywordsConfig) keeps working on your words. it reads best announcing one thing, not listing many — it isn't mounted on any page today, so this article is where it lives."
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'Blog\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Blog.' }
    }
  ]
};

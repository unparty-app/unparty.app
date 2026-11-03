import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of LanguageVisualization. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_LANGUAGE_VISUALIZATION_ARTICLE: EditorialArticle = {
  slug: 'component-language-visualization',
  title: 'LANGUAGE VISUALIZATION.',
  subtitle: 'what the org is written in.',
  description: 'A D3 pie-or-bars view of every language across your repositories, weighted by bytes of code, drawn from the repo metadata the site already tracks.',
  category: 'MAKE.',
  date: '2026-10-14',
  published: false,
  coverColor: 'theme',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'LanguageVisualization', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Language Visualization'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'language visualization.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'every language across your repositories, weighted by bytes of code, as a pie you can flip into bars. it loads the repo metadata itself, so it draws the same org the rest of the site reports on.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'LanguageVisualization', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'nothing to pass: `{}` draws everything, `repositories` scopes it, `width` and `height` size it. it was born on the admin dashboard in mid-2025; the languages page has since moved on to StackBars, but this stays the quickest one-glance answer to what the org is made of.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'LanguageVisualization\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Language Visualization.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /theunpartymac · Sunset Your Ideas — when to let go
    {
      id: 'where-theunpartymac',
      type: 'personal',
      content: 'on the mac concept page, showing what the org is built from.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};

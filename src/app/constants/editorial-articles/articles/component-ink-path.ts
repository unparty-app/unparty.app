import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of InkPath. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_INK_PATH_ARTICLE: EditorialArticle = {
  slug: 'component-ink-path',
  title: 'INK PATH.',
  subtitle: "what's real, and where does it lead?",
  description: 'Your projects in one hand-drawn row, grouped by stage from idea to selling, with an arc from each project to the ones it leads to. Drawn from the projects in your FoundersConfig.',
  category: 'MAKE.',
  date: '2026-10-12',
  published: true,
  coverColor: 'theme',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'InkPath', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Ink Path'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'ink path.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'every project you build tells a story of a problem you aim to solve.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'InkPath', componentProps: { source: 'path' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give each of your projects a **stage** and where you hope that completing them **leadsTo**.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'InkPath\', componentProps: { source: \'path\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Ink Path.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/vibe-coding-invisible-to-google · There Is No Such Thing As Vibe Coding.
    {
      id: 'where-article-vibe-coding-invisible-to-google',
      type: 'personal',
      content: 'the path, as what owning the next step looks like.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};

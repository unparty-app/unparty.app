import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ArticleTable. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_ARTICLE_TABLE_ARTICLE: EditorialArticle = {
  slug: 'component-article-table',
  title: 'ARTICLE TABLE.',
  subtitle: 'every article, one table.',
  description: 'Every published article in one searchable, paginated table. Tag links from any article land here narrowed to that tag, across every unppp, with a hand-drawn × back to everything.',
  category: 'MAKE.',
  date: '2026-10-14',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs, found by npm run create:component-article -- --needs:
  //   github: src/lib/github.ts
  presents: { component: 'ArticleTable', needs: ['github'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Article Table'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'article table.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'every published article in one place: search it, page through it, or arrive from a tag link — ?tag= narrows the table to that tag across every unppp, matched whole, ignoring case, with a hand-drawn × to clear it.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ArticleTable', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'drop it on any page that needs an index: it loads the articles itself, and the only prop is `className`. it powers /article, and every tag pill on an article links back into it filtered — write more, and the table keeps up on its own.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'ArticleTable\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Article Table.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article · /article
    {
      id: 'where-article',
      type: 'personal',
      content: 'the article index itself: search, tags and pagination over everything published.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article' },
    }
  ]
};

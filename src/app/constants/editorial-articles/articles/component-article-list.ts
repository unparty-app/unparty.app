import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ArticleList. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_ARTICLE_LIST_ARTICLE: EditorialArticle = {
  slug: 'component-article-list',
  title: 'ARTICLE LIST.',
  subtitle: 'every doc a project keeps.',
  description: 'A project\'s markdown articles as stamped balls, newest first, with a list view for when there are more than a glance can take.',
  category: 'MAKE.',
  date: '2026-10-19',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: none. It reads the markdown files in the project's own folder
  presents: { component: 'ArticleList', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Article List'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'article list.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a project\'s docs, newest first, as stamped balls. when there are more than a glance can take, the list view shows them all, a page at a time.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ArticleList', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'Write a markdown file with frontmatter (title, description, date, published: true) into your project\'s folder, **src/app/your-project/**, and it joins the row. Give **unpppId** to list one project\'s docs; leave it out to list every article.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'ArticleList\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Article List.' }
    }
  ]
};

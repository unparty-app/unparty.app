import { getEditorialArticlesForUnppp, type EditorialArticle, type EditorialSection } from '@/app/constants/editorial-articles';

/**
 * A project page's DOC. row: ArticleList, the same stamped balls (and list
 * view) that the older pages show through AboutComponent (UnpppArticleDisplay),
 * for its markdown articles (src/app/<project>/*.md, published: true).
 *
 * Pages that are one article (the /theunpartyunppp pattern) add it with
 * withProjectDocs, before the site's ask. A project with no markdown gets
 * nothing. Runs on the server, since the markdown is read from disk.
 */
export function withProjectDocs(article: EditorialArticle, projectId: string): EditorialArticle {
  if (getEditorialArticlesForUnppp(projectId).length === 0) return article;

  const row: EditorialSection = {
    id: 'docs',
    type: 'component',
    metadata: { componentName: 'ArticleList', componentProps: { unpppId: projectId, title: 'DOC.' } },
  };

  // Before the site's ask when the article ends on it, so the ask stays last
  const sections = [...article.sections];
  const last = sections[sections.length - 1];
  const endsOnAsk = last?.type === 'component' && last.metadata?.componentName === 'BuildYours';
  sections.splice(endsOnAsk ? sections.length - 1 : sections.length, 0, row);
  return { ...article, sections };
}

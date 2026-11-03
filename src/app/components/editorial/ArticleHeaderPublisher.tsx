'use client';

import { useEffect } from 'react';
import { useArticleHeader } from '../../contexts/ArticleHeaderContext';
import type { EditorialArticle } from '../../constants/editorial-articles/types';

// Renders nothing — publishes the article to ArticleHeaderContext so the
// global Banner byline row stays visible on server-rendered pages (the
// reader view) that don't mount EditorialArticle. Same publish-upward
// pattern as EditorialArticle.
export default function ArticleHeaderPublisher({ article }: { article: EditorialArticle }) {
  const { setArticle, clearArticle } = useArticleHeader();

  useEffect(() => {
    setArticle(article);
    return () => {
      clearArticle(article);
    };
  }, [article, setArticle, clearArticle]);

  return null;
}

"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { EditorialArticle } from '../constants/editorial-articles/types';

// Same page-publishes-upward pattern as CoverContext: EditorialArticle
// publishes its article on mount so global chrome (Banner) can render the
// byline row, and clears it on unmount so the bar hides on non-article pages.
type ArticleHeaderContextType = {
  article: EditorialArticle | null;
  setArticle: (article: EditorialArticle) => void;
  clearArticle: (ifCurrent?: EditorialArticle) => void;
};

const ArticleHeaderContext = createContext<ArticleHeaderContextType | undefined>(undefined);

export function ArticleHeaderProvider({ children }: { children: React.ReactNode }) {
  const [article, setArticleState] = useState<EditorialArticle | null>(null);

  const setArticle = useCallback((next: EditorialArticle) => {
    setArticleState(next);
  }, []);

  // Pass the publishing page's article so a stale unmount cleanup can't wipe
  // a sibling page's publish (visual ⇄ reader navigation under /article/[slug])
  const clearArticle = useCallback((ifCurrent?: EditorialArticle) => {
    setArticleState(prev => (ifCurrent && prev !== ifCurrent ? prev : null));
  }, []);

  const value = {
    article,
    setArticle,
    clearArticle,
  };

  return (
    <ArticleHeaderContext.Provider value={value}>
      {children}
    </ArticleHeaderContext.Provider>
  );
}

export function useArticleHeader() {
  const context = useContext(ArticleHeaderContext);
  if (context === undefined) {
    throw new Error('useArticleHeader must be used within an ArticleHeaderProvider');
  }
  return context;
}

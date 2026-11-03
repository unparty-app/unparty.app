'use client';

import React, { useState, useEffect } from 'react';
import { EditorialArticle as EditorialArticleType } from '../constants/editorial-articles';
import EditorialArticle from './editorial/EditorialArticle';

interface ArticleProps {
  slug: string;
  className?: string;
}

const Article: React.FC<ArticleProps> = ({ slug, className = "" }) => {
  const [article, setArticle] = useState<EditorialArticleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        // Fetch article data from API
        const response = await fetch(`/api/articles/${slug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch article');
        }

        const { article: articleData, type } = await response.json();

        if (type === 'editorial') {
          setArticle(articleData);
        } else {
          throw new Error('Unsupported article type');
        }
      } catch (err) {
        console.error('Failed to load article:', err);
        setError(`Failed to load article: ${slug}`);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className={`animate-pulse p-6 ${className}`}>
        <div className="mx-auto max-w-4xl text-left">
          <div className="mx-auto mb-6 h-4 w-24 rounded bg-gray-300 dark:bg-gray-700"></div>
          <div className="mb-6 h-12 rounded bg-gray-300 dark:bg-gray-700"></div>
          <div className="mx-auto mb-8 h-6 w-3/4 rounded bg-gray-300 dark:bg-gray-700"></div>
          <div className="space-y-4">
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-300 p-6 dark:border-red-500 ${className} mx-auto max-w-4xl`}>
        <h3 className="mb-2 font-bold text-red-600 dark:text-red-400">Error Loading Article</h3>
        <p className="text-red-500 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className={`rounded-lg border border-gray-300 p-6 dark:border-gray-600 ${className} mx-auto max-w-4xl`}>
        <p className="text-gray-600 dark:text-gray-400">Article not found.</p>
      </div>
    );
  }

  return (
    <EditorialArticle
      article={article}
      className={className}
    />
  );
};

export default Article;

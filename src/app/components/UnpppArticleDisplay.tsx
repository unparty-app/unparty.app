'use client';

import ArticleList from './ArticleList';

interface UnpppArticleDisplayProps {
  unpppId?: string; // The unppp whose markdown articles (src/app/<unpppId>/*.md) to list
}

/**
 * The DOC. section on an unppp page. AboutComponent passes the unppp it
 * resolved, so this works on every route that mounts it, /theunpartyapp
 * included (#1017).
 */
const UnpppArticleDisplay: React.FC<UnpppArticleDisplayProps> = ({ unpppId }) => {
  if (!unpppId) return null;

  return (
    <section id="articles-section" className="w-full border-t border-gray-200 py-8 sm:py-12 lg:py-16 dark:border-gray-800">
      <div className="mx-auto font-google-sans-code max-w-screen-xl">
        <ArticleList unpppId={unpppId} title="DOC." />
      </div>
    </section>
  );
};

export default UnpppArticleDisplay;

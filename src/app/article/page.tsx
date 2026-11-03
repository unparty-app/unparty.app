import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import { SITE_NAME } from '@/app/constants/organization';
import { getPublishedEditorialArticles } from '@/app/constants/editorial-articles';
import ArticleTable from '../components/ArticleTable';
import ArticleIndexHeader from './ArticleIndexHeader';

export const metadata: Metadata = generatePageMetadata({
  title: `articles. | ${SITE_NAME}`,
  description: `Every article on ${SITE_NAME}: setup guides, stories, and the components that run inside them.`,
  category: 'LEARN',
  path: '/article',
});

// Server component: counted here, where getPublishedEditorialArticles()
// includes the markdown and JSON articles (the browser only has the TS ones)
export default function ArticlePage() {
  const articles = getPublishedEditorialArticles();
  const categoryCount = new Set(articles.map((a) => a.category)).size;

  return (
    <main className="min-h-screen w-full px-4 pt-32 pb-16 sm:px-6 lg:px-8 xl:px-12">
      <div className="mx-auto max-w-6xl">
      <ArticleIndexHeader articleCount={articles.length} categoryCount={categoryCount} />

      {/* Article Table (reads ?tag= from the URL, so it needs a Suspense boundary) */}
      <Suspense>
        <ArticleTable />
      </Suspense>
      </div>
    </main>
  );
}

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEditorialArticle, getPublishedEditorialArticles } from '../../constants/editorial-articles/registry';
import EditorialArticle from '../../components/editorial/EditorialArticle';
import JsonLd from '../../components/JsonLd';
import { generateArticleMetadata } from '../../utils/ogMetadata';
import { generateArticleJsonLd, generateBreadcrumbJsonLd } from '../../utils/structuredData';
import { SITE_URL } from '../../constants/organization';
import { withReleaseRow } from '@/lib/project-belt';
import { withOnboarding } from '../../constants/setup-path';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  // A component's home article carries its release files under the component;
  // a SETUP. step's article ends on its chapter's challenge (#589)
  const found = getEditorialArticle(slug);
  const article = found ? withOnboarding(withReleaseRow(found)) : found;

  // Drafts (published: false) preview on npm run dev, so an article can be
  // written while looking at it; in production they stay a 404
  const preview = process.env.NODE_ENV === 'development';
  if (!article || (!article.published && !preview)) {
    notFound();
  }

  const breadcrumb = generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: 'Articles', url: `${SITE_URL}/article` },
    { name: article.title },
  ]);

  return (
    <div className="min-h-screen">
      <JsonLd data={generateArticleJsonLd(article, `${SITE_URL}/article/${slug}`)} />
      <JsonLd data={breadcrumb} />
      {!article.published && (
        <p className="mx-auto max-w-4xl px-6 pt-24 font-google-sans-code text-xs uppercase tracking-wide text-[var(--text-muted)]">
          DRAFT. only you see this, on npm run dev. set published: true to publish it.
        </p>
      )}
      <EditorialArticle article={article} />
    </div>
  );
}

export async function generateStaticParams() {
  return getPublishedEditorialArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getEditorialArticle(slug);

  if (!article) {
    return { title: 'Article not found' };
  }

  // A draft previewing on npm run dev is never indexed
  return article.published ? generateArticleMetadata(article) : { ...generateArticleMetadata(article), robots: { index: false } };
}

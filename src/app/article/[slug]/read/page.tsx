import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEditorialArticle, getPublishedEditorialArticles } from '../../../constants/editorial-articles/registry';
import ReaderArticle from '../../../components/editorial/ReaderArticle';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ArticleReadPage({ params }: Props) {
  const { slug } = await params;
  const article = getEditorialArticle(slug);

  // Same visibility rules as /api/articles/[slug]
  if (!article || !article.published) {
    notFound();
  }

  return <ReaderArticle article={article} />;
}

export async function generateStaticParams() {
  return getPublishedEditorialArticles().map(article => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getEditorialArticle(slug);

  if (!article) {
    return { title: 'Article not found' };
  }

  return {
    title: `${article.title} | unparty`,
    description: article.description,
    // Reader pages mirror the visual article — canonicalize to it so the two
    // never compete in search results
    alternates: { canonical: `/article/${slug}` },
  };
}

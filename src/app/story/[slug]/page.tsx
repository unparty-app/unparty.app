import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import StorySchema from '../../../utils/StorySchema';
import { convertStoryToEditorialArticle } from '../../utils/storyToEditorialConverter';
import EditorialArticle from '../../components/editorial/EditorialArticle';
import JsonLd from '../../components/JsonLd';
import { generateArticleJsonLd, generateBreadcrumbJsonLd } from '../../utils/structuredData';
import { SITE_NAME, SITE_URL } from '../../constants/organization';
import { ogImageUrl } from '../../utils/ogMetadata';
import storiesManifest from '@/data/storiesManifest.json';

interface StoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;

  // Backwards compat: /story/cover-004 → /story/workflow
  if (/^cover-\d+$/.test(slug)) {
    const prettySlug = (storiesManifest.coverIdToSlug as Record<string, string>)[slug];
    if (prettySlug) redirect(`/story/${prettySlug}`);
    notFound();
  }

  const coverId = (storiesManifest.slugToCoverId as Record<string, string>)[slug];
  if (!coverId) notFound();

  const story = await StorySchema.getStoryByCoverId(coverId);
  if (!story || !story.metadata.published) notFound();

  const editorialArticle = convertStoryToEditorialArticle(story);

  const breadcrumb = generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: 'Stories', url: `${SITE_URL}/story` },
    { name: editorialArticle.title },
  ]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <JsonLd data={generateArticleJsonLd(editorialArticle, `${SITE_URL}/story/${slug}`)} />
      <JsonLd data={breadcrumb} />
      {/* Stories have no THOUGHTS. thread: the thoughts API only serves articles and videos (#1083) */}
      <EditorialArticle article={editorialArticle} coverId={coverId} showThoughts={false} />
    </main>
  );
}

export async function generateStaticParams() {
  return storiesManifest.published.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const coverId = (storiesManifest.slugToCoverId as Record<string, string>)[slug];
  if (!coverId) return { title: `Story Not Found | ${SITE_NAME}`, description: 'The requested story could not be found.' };

  const story = await StorySchema.getStoryByCoverId(coverId);
  if (!story) return { title: `Story Not Found | ${SITE_NAME}`, description: 'The requested story could not be found.' };

  const ogImage = ogImageUrl({
    title: story.metadata.title,
    subtitle: story.metadata.subtitle,
    author: story.metadata.author,
    category: story.metadata.category || 'STORY',
    cover: coverId,
  });

  const url = `${SITE_URL}/story/${slug}`;
  const title = story.metadata['seo-title'] ?? story.metadata.title;
  return {
    title: `${title} | ${SITE_NAME}`,
    description: story.metadata.description || story.metadata.subtitle || `A cover story from ${SITE_NAME}`,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: story.metadata.description || story.metadata.subtitle,
      type: 'article',
      url,
      publishedTime: story.metadata.date,
      authors: [story.metadata.author],
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${story.metadata.title} - ${story.metadata.author}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: story.metadata.description || story.metadata.subtitle,
      images: [ogImage],
    },
  };
}

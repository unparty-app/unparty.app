import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import StorySchema from '../../../../utils/StorySchema';
import { convertStoryToEditorialArticle } from '../../../utils/storyToEditorialConverter';
import ReaderArticle from '../../../components/editorial/ReaderArticle';
import storiesManifest from '@/data/storiesManifest.json';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StoryReadPage({ params }: Props) {
  const { slug } = await params;

  const coverId = (storiesManifest.slugToCoverId as Record<string, string>)[slug];
  if (!coverId) notFound();

  const story = await StorySchema.getStoryByCoverId(coverId);

  // Same visibility rules as /story/[slug]
  if (!story || !story.metadata.published) {
    notFound();
  }

  const article = convertStoryToEditorialArticle(story);

  // Stories have no THOUGHTS. thread: the thoughts API only serves articles and videos (#1083)
  return <ReaderArticle article={article} showThoughts={false} />;
}

export async function generateStaticParams() {
  return storiesManifest.published.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const coverId = (storiesManifest.slugToCoverId as Record<string, string>)[slug];
  if (!coverId) {
    return { title: 'Story not found' };
  }

  const story = await StorySchema.getStoryByCoverId(coverId);

  if (!story) {
    return { title: 'Story not found' };
  }

  return {
    title: `${story.metadata.title} | unparty`,
    description: story.metadata.description || story.metadata.subtitle,
    // Reader pages mirror the visual story — canonicalize to it so the two
    // never compete in search results
    alternates: { canonical: `/story/${slug}` },
  };
}

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getVideoEntry, getPublishedVideoEntries } from '../../constants/video-registry';
import JsonLd from '../../components/JsonLd';
import Thoughts from '../../components/editorial/Thoughts';
import { generateVideoJsonLd, generateBreadcrumbJsonLd } from '../../utils/structuredData';
import { generateVideoMetadata } from '../../utils/ogMetadata';
import { SITE_URL } from '../../constants/organization';

interface Props {
  params: Promise<{ slug: string }>;
}

// A real, self-canonical watch page — the video is the primary content
// (native controls, full width, nothing competing above the fold), not the
// ambient background loop CoverVideo renders elsewhere. That distinction is
// what makes this page eligible as a Google "watch page"; see #956.
export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const video = getVideoEntry(slug);

  if (!video || !video.published) {
    notFound();
  }

  const pageUrl = `${SITE_URL}/watch/${slug}`;
  const breadcrumb = generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: video.sourceLabel, url: `${SITE_URL}${video.sourceHref}` },
    { name: video.title },
  ]);

  return (
    <div className="min-h-screen">
      <JsonLd data={generateVideoJsonLd(video, pageUrl)} />
      <JsonLd data={breadcrumb} />

      <main className="mx-auto max-w-4xl px-6 py-12 text-start">
        {/* Full-bleed player - breaks out of the max-w-4xl container, same
            convention as EditorialArticle's cover image/video. */}
        <div className="mb-8 w-screen mx-[calc(50%-50vw)]">
          <video
            src={video.contentUrl}
            poster={video.thumbnailUrl}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <h1
          className="mb-4 font-vt323 text-3xl leading-none sm:text-4xl"
          style={{ color: 'var(--theme-color)' }}
        >
          {video.title}
        </h1>

        <p className="mb-8 font-space-grotesk text-base leading-relaxed">
          {video.description}
        </p>

        <Link
          href={video.sourceHref}
          className="mb-16 inline-block font-google-sans-code text-xs uppercase tracking-wider underline decoration-dotted underline-offset-4"
          style={{ color: 'var(--text-muted)' }}
        >
          ← back to {video.sourceLabel}
        </Link>

        <Thoughts articleSlug={video.slug} />
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return getPublishedVideoEntries().map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = getVideoEntry(slug);

  if (!video) {
    return { title: 'Video not found' };
  }

  return generateVideoMetadata(video);
}

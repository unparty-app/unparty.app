import { notFound } from 'next/navigation';
import { getVideoEntry } from '../../../constants/video-registry';
import WatchLightbox from '../../../components/WatchLightbox';

interface Props {
  params: Promise<{ slug: string }>;
}

// Intercepted counterpart of /watch/[slug]/page.tsx (#956) - rendered
// instead of the full page when navigation happens client-side (a Link
// click from elsewhere in the app); a direct/hard navigation or refresh
// still resolves the real page, since there's no client router state to
// intercept from.
export default async function WatchModal({ params }: Props) {
  const { slug } = await params;
  const video = getVideoEntry(slug);

  if (!video || !video.published) {
    notFound();
  }

  return <WatchLightbox video={video} />;
}

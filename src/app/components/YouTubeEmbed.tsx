'use client';

import { useTheme } from '../contexts/ThemeContext';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
}

/**
 * Extract YouTube video ID from various URL formats or return the ID if already provided
 * Supports:
 * - Full URLs: https://www.youtube.com/watch?v=VIDEO_ID
 * - Short URLs: https://youtu.be/VIDEO_ID
 * - Embed URLs: https://www.youtube.com/embed/VIDEO_ID
 * - Plain video IDs: VIDEO_ID
 */
function extractVideoId(input: string): string {
  // If it's already a video ID (no slashes or dots), return as-is
  if (!input.includes('/') && !input.includes('.')) {
    return input;
  }

  // Try to match various YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID pattern
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If no pattern matched, assume it's already a video ID
  return input;
}

export default function YouTubeEmbed({
  videoId: videoIdOrUrl,
  title = 'YouTube video',
  aspectRatio = '16:9',
}: YouTubeEmbedProps) {
  const { colorValue } = useTheme();

  // Extract clean video ID from URL or use provided ID
  const videoId = extractVideoId(videoIdOrUrl);

  // Map aspect ratio to Tailwind classes
  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
  }[aspectRatio];

  // Use privacy-enhanced YouTube embed URL
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  return (
    <div className="mx-auto my-8 w-full max-w-4xl">
      <div
        className={`relative overflow-hidden rounded-xl border-2 bg-black shadow-lg transition-all duration-200 hover:shadow-xl ${aspectRatioClass}`}
        style={{ borderColor: `${colorValue}30` }}
      >
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {title && title !== 'YouTube video' && (
        <p className="mt-2 text-center font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
          {title}
        </p>
      )}
    </div>
  );
}

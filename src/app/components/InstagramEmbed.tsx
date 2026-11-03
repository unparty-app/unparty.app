'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface InstagramEmbedProps {
  postUrl: string;
  title?: string;
  aspectRatio?: '1:1' | '4:5' | '9:16';
}

function extractInstagramPostId(input: string): string | null {
  try {
    const match = input.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function normalizeInstagramUrl(input: string): string {
  const postId = extractInstagramPostId(input);
  if (!postId) return input;
  // Determine type from original URL
  if (input.includes('/reel/')) return `https://www.instagram.com/reel/${postId}/`;
  if (input.includes('/tv/')) return `https://www.instagram.com/tv/${postId}/`;
  return `https://www.instagram.com/p/${postId}/`;
}

export default function InstagramEmbed({
  postUrl,
  title,
  aspectRatio = '1:1',
}: InstagramEmbedProps) {
  const { colorValue } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const aspectRatioClass = {
    '1:1': 'aspect-square',
    '4:5': 'aspect-[4/5]',
    '9:16': 'aspect-[9/16]',
  }[aspectRatio];

  const normalizedUrl = normalizeInstagramUrl(postUrl);
  const postId = extractInstagramPostId(postUrl);
  const error = !postId;

  useEffect(() => {
    if (!postId) return; // rendered as the error state

    const scriptId = 'instagram-embed-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Poll until Instagram replaces the blockquote with an iframe
    const checkEmbed = setInterval(() => {
      if (containerRef.current?.querySelector('iframe')) {
        setIsLoading(false);
        clearInterval(checkEmbed);
      }
    }, 200);

    const timeout = setTimeout(() => {
      setIsLoading(false);
      clearInterval(checkEmbed);
    }, 10000);

    if (window.instgrm) {
      window.instgrm.Embeds.process();
    }

    return () => {
      clearInterval(checkEmbed);
      clearTimeout(timeout);
    };
  }, [postUrl, postId]);

  if (error) {
    return (
      <div className="mx-auto my-8 w-full max-w-lg">
        <div
          className="rounded-xl border-2 bg-red-50 p-6 text-center dark:bg-red-950/20"
          style={{ borderColor: `${colorValue}30` }}
        >
          <p className="font-google-sans-code text-sm text-red-600 dark:text-red-400">
            Unable to load Instagram post. Please check the URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto my-8 w-full max-w-lg">
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-xl border-2 bg-black shadow-lg transition-all duration-200 hover:shadow-xl ${aspectRatioClass}`}
        style={{ borderColor: `${colorValue}30` }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80">
            <div className="font-google-sans-code text-sm text-gray-300">
              thinking...
            </div>
          </div>
        )}

        <blockquote
          className="instagram-media absolute inset-0 m-0"
          data-instgrm-permalink={normalizedUrl}
          data-instgrm-version="14"
          style={{ maxWidth: '100%', minWidth: '100%' }}
        >
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={normalizedUrl}
            className="text-gray-300 hover:text-white"
          >
            View on Instagram
          </a>
        </blockquote>
      </div>

      {title && (
        <p className="mt-2 text-center font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
          {title}
        </p>
      )}
    </div>
  );
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

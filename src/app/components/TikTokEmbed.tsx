'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface TikTokEmbedProps {
  videoUrl: string;
  title?: string;
  aspectRatio?: '9:16' | '1:1' | '16:9';
}

/**
 * Extract TikTok video ID and username from various URL formats
 * Supports:
 * - Standard: https://www.tiktok.com/@username/video/VIDEO_ID
 * - Short: https://vm.tiktok.com/SHORT_CODE
 * - Alt Short: https://www.tiktok.com/t/SHORT_CODE
 * - Direct: @username/video/VIDEO_ID
 */
function extractTikTokInfo(input: string): { username: string; videoId: string; url: string } | null {
  try {
    // If it's a full URL, extract username and video ID
    const standardMatch = input.match(/@([a-zA-Z0-9._]+)\/video\/(\d+)/);
    if (standardMatch) {
      const username = standardMatch[1];
      const videoId = standardMatch[2];
      const url = `https://www.tiktok.com/@${username}/video/${videoId}`;
      return { username, videoId, url };
    }

    // For short URLs, we need to preserve the original URL
    // TikTok's embed will handle the redirect
    if (input.includes('vm.tiktok.com') || input.includes('tiktok.com/t/')) {
      return { username: '', videoId: '', url: input };
    }

    // If no pattern matched, return null
    return null;
  } catch (error) {
    console.error('Error extracting TikTok info:', error);
    return null;
  }
}

export default function TikTokEmbed({
  videoUrl,
  title,
  aspectRatio = '9:16',
}: TikTokEmbedProps) {
  const { colorValue } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const error = !extractTikTokInfo(videoUrl);

  // Map aspect ratio to Tailwind classes
  const aspectRatioClass = {
    '9:16': 'aspect-[9/16]',
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
  }[aspectRatio];

  useEffect(() => {
    // Extract video info
    const videoInfo = extractTikTokInfo(videoUrl);
    
    if (!videoInfo) return; // rendered as the error state

    // Load TikTok embed script if not already loaded
    const scriptId = 'tiktok-embed-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Wait for script to load and initialize
    const checkEmbed = setInterval(() => {
      if (containerRef.current?.querySelector('iframe')) {
        setIsLoading(false);
        clearInterval(checkEmbed);
      }
    }, 200);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      setIsLoading(false);
      clearInterval(checkEmbed);
    }, 10000);

    // Trigger script to process embeds
    if (window.tiktok) {
      window.tiktok.reset();
    }

    return () => {
      clearInterval(checkEmbed);
      clearTimeout(timeout);
    };
  }, [videoUrl]);

  if (error) {
    return (
      <div className="mx-auto my-8 w-full max-w-md">
        <div
          className="rounded-xl border-2 bg-red-50 p-6 text-center dark:bg-red-950/20"
          style={{ borderColor: `${colorValue}30` }}
        >
          <p className="font-google-sans-code text-sm text-red-600 dark:text-red-400">
            Unable to load TikTok video. Please check the URL.
          </p>
        </div>
      </div>
    );
  }

  const videoInfo = extractTikTokInfo(videoUrl);

  return (
    <div className="mx-auto my-8 w-full max-w-md">
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-xl border-2 bg-black shadow-lg transition-all duration-200 hover:shadow-xl ${aspectRatioClass}`}
        style={{ borderColor: `${colorValue}30` }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80">
            <div className="font-google-sans-code text-sm text-gray-300">
              Loading TikTok...
            </div>
          </div>
        )}
        
        <blockquote
          className="tiktok-embed absolute inset-0 m-0"
          cite={videoInfo?.url}
          data-video-id={videoInfo?.videoId}
          style={{ maxWidth: '100%', minWidth: '100%' }}
        >
          <section>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={videoInfo?.url}
              className="text-gray-300 hover:text-white"
            >
              View on TikTok
            </a>
          </section>
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

// Extend Window interface for TikTok embed script
declare global {
  interface Window {
    tiktok?: {
      reset: () => void;
    };
  }
}

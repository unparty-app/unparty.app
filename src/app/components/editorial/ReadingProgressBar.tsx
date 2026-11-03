'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHydrated } from '@/hooks/useHydrated';

/**
 * ReadingProgressBar - scroll progress line just under the site header, for
 * editorial-style pages without the Banner dock (/languages, /founders;
 * article pages show their progress along the dock instead).
 *
 * Portaled to document.body: inside .page-transition-wrapper (which keeps a
 * transform) `position: fixed` anchors to the wrapper, so the bar drew ~80px
 * down the page instead of at the header. Its top follows #site-chrome's live
 * height, which grows when the header wraps on narrow screens.
 * Per-scroll state stays in here so the page content doesn't re-render.
 */
export const ReadingProgressBar: React.FC<{
  articleRef: React.RefObject<HTMLElement | null>;
  color: string;
}> = ({ articleRef, color }) => {
  const mounted = useHydrated();
  const [progress, setProgress] = useState(0);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const chrome = document.getElementById('site-chrome');
    if (!chrome) return;
    const update = () => setTop(chrome.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(chrome);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const article = articleRef.current;
      if (!article) return;

      setProgress(Math.max(0, Math.min(1,
        (window.scrollY - article.offsetTop + window.innerHeight * 0.3) / article.scrollHeight
      )));
    };

    const handleScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    measure(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [articleRef]);

  if (!mounted) return null;

  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-x-0 z-40 h-1" style={{ top }}>
      <div
        className="h-full rounded-r-full transition-all duration-300 ease-out"
        style={{ width: `${progress * 100}%`, backgroundColor: color }}
      />
    </div>,
    document.body
  );
};

export default ReadingProgressBar;

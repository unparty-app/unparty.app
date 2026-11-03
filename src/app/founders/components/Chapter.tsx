'use client';

import { useEffect, useRef, useState } from 'react';

interface ChapterProps {
  id: string;
  /** Register this chapter's element for the OutlineRail scrollspy */
  onRef: (id: string, el: HTMLDivElement | null) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Editorial chapter wrapper: registers itself as a scrollspy target
 * (data-section-id, same contract as EditorialArticle sections) and fades
 * in on first viewport entry, matching the article scroll animation.
 */
export default function Chapter({ id, onRef, children, className = '' }: ChapterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    onRef(id, el);
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { threshold: 0.05, rootMargin: '50px 0px -50px 0px' }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      onRef(id, null);
    };
  }, [id, onRef]);

  return (
    <div
      ref={ref}
      data-section-id={id}
      className={`transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

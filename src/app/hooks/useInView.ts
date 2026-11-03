'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has scrolled into view (then stays true), so an
 * entrance animation plays where the reader can see it instead of on mount.
 * Used by the .step-rings lists (SetupCurriculum, ChallengeSteps).
 */
export function useInView<T extends Element>(rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}

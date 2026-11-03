'use client';

import { useEffect, useRef, useState } from 'react';

interface LazyMountProps {
  /** Reserved height while unmounted, to keep scroll position stable */
  height: string;
  children: React.ReactNode;
}

/**
 * Mounts children only while near the viewport (±600px) and unmounts them
 * again when scrolled far away. Used for the Three.js effort spheres so a
 * long editorial page never keeps more than ~one canvas alive.
 */
export default function LazyMount({ height, children }: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => setInView(entry.isIntersecting));
      },
      { rootMargin: '600px 0px 600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {inView ? children : null}
    </div>
  );
}

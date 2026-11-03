'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { resolveCoverSrc } from '../../utils/coverPath';

// Re-exported for existing client-side callers - the real definitions live
// in utils/coverPath.ts (a plain module, not 'use client') so server code
// can call them directly too. Every export of a 'use client' file becomes a
// client-only reference under Next's RSC bundler, even a pure function.
export { resolveCoverSrc, isVideoCover } from '../../utils/coverPath';

/**
 * CoverImageBackground - Lazy-loaded, skeleton-backed cover image with a
 * gradient scrim, absolutely filling its positioned parent. Never blocks or
 * shifts page load (no priority, fades in on load). Shared by the challenge
 * card background and the challenge step cards so both read from the same
 * visual language. `scrim={false}` drops the dark gradient when no text sits
 * on the image (a ChallengeSteps card's cover).
 */
const CoverImageBackground: React.FC<{ cover: string; roundedClassName?: string; scrim?: boolean; className?: string }> = ({
  cover,
  roundedClassName = 'rounded-2xl',
  scrim = true,
  className = '',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) return null;

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${roundedClassName}`}>
      {!loaded && <div className="image-loading-skeleton" />}
      <Image
        src={resolveCoverSrc(cover)}
        alt=""
        fill
        sizes="(min-width: 1024px) 896px, 100vw"
        className={`object-cover image-fade-in ${loaded ? 'loaded' : ''} ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
      {scrim && <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/60" />}
    </div>
  );
};

export default CoverImageBackground;

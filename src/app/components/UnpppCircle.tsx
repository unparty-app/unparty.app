'use client';

import { useState } from 'react';
import Image from 'next/image';

interface UnpppCircleProps {
  src?: string;
  color?: string | null;
  alt?: string;
  title?: string;
  size?: number;
}

const UnpppCircle = ({
  src,
  color,
  alt = '',
  title,
  size = 24,
}: UnpppCircleProps) => {
  const [errored, setErrored] = useState(false);
  const fallbackColor = color ?? 'var(--text-muted)';
  const decorative = alt.length === 0;

  if (!src || errored) {
    return (
      <div
        title={title}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : alt}
        aria-hidden={decorative ? true : undefined}
        className="shrink-0 rounded-full border"
        style={{
          width: size,
          height: size,
          backgroundColor: fallbackColor,
          borderColor: fallbackColor,
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      title={title}
      width={size}
      height={size}
      className="shrink-0 rounded-full border object-cover"
      style={{
        width: size,
        height: size,
        borderColor: fallbackColor,
      }}
      onError={() => setErrored(true)}
    />
  );
};

export default UnpppCircle;

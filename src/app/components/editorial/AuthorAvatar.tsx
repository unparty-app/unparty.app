'use client';

import React, { useState } from 'react';
import Image from 'next/image';

/**
 * AuthorAvatar - author image sized/cropped to fit whatever box its parent
 * gives it, with an initials fallback when the image fails to load.
 * Normalizes bare filenames (e.g. "founder.png") to root-relative paths.
 */
const AuthorAvatar: React.FC<{ src: string; alt: string; link?: string }> = ({ src, alt, link }) => {
  const [imageError, setImageError] = useState(false);
  const normalizedSrc = src.startsWith('/') ? src : `/${src}`;

  const getInitials = (name: string): string => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const content = !imageError ? (
    <Image
      src={normalizedSrc}
      alt={alt}
      width={96}
      height={96}
      className="size-full object-cover"
      onError={() => setImageError(true)}
    />
  ) : (
    <div
      className="flex size-full items-center justify-center font-google-sans-code text-sm font-bold"
      style={{ color: 'var(--foreground)' }}
    >
      {getInitials(alt)}
    </div>
  );

  return link ? (
    <a href={link} className="block size-full transition-opacity duration-200 hover:opacity-80">
      {content}
    </a>
  ) : (
    content
  );
};

export default AuthorAvatar;

'use client';

import Image from 'next/image';


interface SVGMediaProps {
  filename: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
}

const SVGMedia: React.FC<SVGMediaProps> = ({ 
  filename, 
  alt = '', 
  caption, 
  width = 400, 
  height = 300, 
  className = '' 
}) => {
  return (
    <figure className={`my-8 ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-background">
        <Image
          src={`/svgs/${filename}`}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          className="h-auto w-full object-contain"
        />
      </div>
      {caption && (
        <figcaption className="mt-4 text-center font-vt323 text-sm italic" style={{ color: 'var(--text-muted)' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default SVGMedia;
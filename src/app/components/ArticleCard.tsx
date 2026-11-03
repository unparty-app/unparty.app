'use client';

import { useId } from 'react';
import { EditorialArticle } from '../constants/editorial-articles';
import Link from 'next/link';


interface ArticleCardProps {
  article: EditorialArticle;
  colorValue: string;
  index?: number; // Position in the row, so neighbouring balls float out of step
}

/** Perceived-brightness check (YIQ) so text stays readable on any mood color */
const isLightColor = (hex: string): boolean => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
};

/**
 * Circular article card: a theme-colored ball (top-left specular highlight,
 * shaded rim, soft glow), like a beer pong ball, with the title stamped on
 * it in ink: a fixed-size hand-drawn box in the middle of the ball, the same
 * on every ball whatever the title's length (it clamps to three lines),
 * tilted slightly, its edges roughened by an SVG filter and blended into the
 * ball's shading.
 *
 * Motion (globals.css .article-ball): the ball floats gently, out of step
 * with its neighbours; on hover the stamp rolls toward the rim as if the
 * ball turned. Reduced motion holds both still.
 */
const ArticleCard: React.FC<ArticleCardProps> = ({ article, colorValue, index = 0 }) => {
  const lightBall = isLightColor(colorValue);
  const ink = lightBall ? '#0D0C1D' : '#FFF1D6';
  const filterId = `stamp-${useId().replace(/:/g, '')}`;

  return (
    <Link
      href={`/article/${article.slug}`}
      aria-label={article.title}
      className="article-ball group relative flex size-64 shrink-0 items-center justify-center overflow-hidden rounded-full text-left transition-[filter] duration-300 hover:brightness-110 motion-reduce:transition-none"
      style={{
        background: `radial-gradient(circle at 32% 24%, rgba(255,255,255,0.3), transparent 30%), radial-gradient(circle at 30% 25%, ${colorValue} 40%, color-mix(in srgb, ${colorValue} 65%, black) 100%)`,
        boxShadow: `inset -10px -14px 28px rgba(0,0,0,0.28), 0 14px 36px -16px ${colorValue}AA`,
        animationDelay: `${index * -1.3}s`,
      }}
    >
      {/* The ink: roughened edges, like a rubber stamp on a curved surface */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={index + 3} />
          <feDisplacementMap in="SourceGraphic" scale="1.8" />
        </filter>
      </svg>

      <span
        className="article-ball__stamp relative flex h-28 w-44 flex-col justify-center gap-1.5 px-4 py-3"
        style={{
          color: ink,
          filter: `url(#${filterId})`,
          mixBlendMode: lightBall ? 'multiply' : 'screen',
          opacity: 0.9,
        }}
      >
        <svg
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <path
            className="article-ball__ring"
            pathLength={1}
            d="M7 6.5c19-2.4 56-3 86-1.6 2.6.1 3.9 1.6 4 4.2.6 13.5.5 27.6-.5 40.6-.2 2.8-1.8 4.3-4.6 4.4-28.5 1.4-57.6 1.7-83 .3-2.7-.2-4.3-1.8-4.4-4.5-.7-12.8-.9-25.9-.3-38.9.1-2.1 1.2-3.5 3.2-3.8 6.6-.9 13.3-1.4 20.6-1.7"
            stroke="currentColor"
            strokeWidth={0.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="line-clamp-3 font-vt323 text-xl uppercase leading-none">
          {article.title}
        </span>
        {article.tags && article.tags.length > 0 && (
          <span className="font-vt323 text-[11px] uppercase opacity-80">
            #{article.tags[0]}
          </span>
        )}
      </span>
    </Link>
  );
};

export default ArticleCard;

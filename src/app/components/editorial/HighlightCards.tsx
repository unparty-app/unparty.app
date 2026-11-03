'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '../../contexts/ThemeContext';
import type { EditorialSection } from '../../constants/editorial-articles/types';
import UnpppCircle from '../UnpppCircle';
import { ArrowRight } from '../icons';
import { inkOn } from '../build-yours/BuildYours';

/**
 * HighlightCards - a piece shown inside another as its highlights (#1647):
 * StoryPreview for a story, ArticlePreview for an article. On the theme band
 * (EditorialSection), a row of cards a little larger than ScrollRow's, each
 * in the Header's glass (blur, a faint theme-color edge, a shadow), from the
 * left, swiping where they run past the screen.
 *
 * On a wide screen the row counts in quarters: the piece takes two, each
 * highlight one. Every card opens the piece. The first is the piece itself
 * ("read <title>"): its cover on the cover's own color under a pane of
 * glass, with its title, subtitle and whatever details its caller adds (a
 * story's author, dates and song). Each next one is a line its author set
 * big, set as the heading it is, with the subheading above it as its
 * kicker, and opens the piece at that line (?mention=, which story and
 * article pages scroll to). The highlights take turns: the theme color, then
 * clear glass.
 */

/** A highlight: a heading, and the subheading that leads into it */
export interface Highlight {
  heading: string;
  sub?: string;
}

// A line the author set big: a `# ` heading, or a hero
const isBigLine = (section: EditorialSection) => (section.type === 'heading' && section.metadata?.size === 'large') || section.type === 'hero';
// A `## ` line: the subheading that leads into the next big line
const isSubheading = (section: EditorialSection) => section.type === 'heading' && section.metadata?.size === 'medium';

// A section's words as plain text (inline HTML and Markdown left out)
const plainText = (html = '') => html.replace(/<[^>]+>/g, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

/**
 * A piece's highlights: the sections its embed names (sectionIds), else its
 * big lines, each with the last subheading before it (since the previous big
 * line) as its kicker, else its first heading or paragraph, so it always
 * shows at least one line of its own. A line that only repeats the piece's
 * title (a hero set to it) is skipped: the first card already says it
 */
export function pickHighlights(sections: EditorialSection[], sectionIds?: string[], title?: string): Highlight[] {
  const pool = sectionIds?.length ? sections.filter((s) => sectionIds.includes(s.id)) : sections;
  const found: Highlight[] = [];
  const same = (words: string) => !!title && words.toLowerCase().replace(/[^a-z0-9]/g, '') === title.toLowerCase().replace(/[^a-z0-9]/g, '');
  let sub: string | undefined;
  for (const section of pool) {
    const words = plainText(section.content);
    if (!words || same(words)) continue;
    // A section the embed names is a highlight of its own, whatever its size
    if (isSubheading(section) && !sectionIds?.length) sub = words;
    else if (isBigLine(section) || sectionIds?.length) {
      found.push({ heading: words, sub });
      sub = undefined;
    }
  }
  if (found.length) return found;
  const first = sections.find((s) => (s.type === 'heading' || s.type === 'paragraph') && plainText(s.content));
  return first ? [{ heading: plainText(first.content) }] : [];
}

/** Highlights when the embed doesn't say: with the piece's card, four */
export const HIGHLIGHTS = 3;

// The row: from the left, swiping where it runs past the screen (a phone's
// cards run to its edge, the next one peeking in)
const ROW = 'flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 pb-2 scrollbar-hide sm:scroll-pl-0 sm:px-0';
// A card: a little larger than ScrollRow's 280px cards, its content in the
// middle, the whole card one link (a story's song play button sits above it),
// in the Header's glass: blur, a shadow and a faint theme-color edge. The
// Header's bg-background/85 computes to transparent (Tailwind can't put an
// opacity on var(--background)), so the glass is clear, as there
const CARD = 'group relative flex h-[23rem] w-[300px] shrink-0 snap-start flex-col justify-center gap-4 overflow-hidden rounded-xl border p-6 shadow-lg backdrop-blur-md transition-colors duration-300 sm:h-[25rem] sm:w-[320px]';
// A wide screen counts in quarters: the piece takes two, each highlight one,
// so the piece and two highlights fill the row (more swipe in from the right)
const PIECE_WIDE = 'lg:w-[calc((100%-1rem)/2)]';
const LINE_WIDE = 'lg:w-[calc((100%-3rem)/4)]';

/** The row's shape while the piece loads, so the page doesn't jump */
export function HighlightCardsLoading({ className = '' }: { className?: string }) {
  const { colorValue } = useTheme();
  return (
    <div className={`${ROW} ${className}`} aria-busy="true" aria-label="Loading">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${CARD} ${i === 0 ? PIECE_WIDE : LINE_WIDE} animate-pulse`} style={{ borderColor: `${colorValue}40` }} />
      ))}
    </div>
  );
}

interface HighlightCardsProps {
  title: string;
  subtitle?: string;
  href: string; // The piece's own page
  coverSrc?: string; // Its cover, resolved; without one the card is its color
  coverColor?: string; // The cover's own color (cover-colors.json), the theme color by default
  details?: React.ReactNode; // More on the first card, under the title (a story's author, dates, song)
  highlights: Highlight[];
  label: string; // The row, for screen readers
  className?: string;
}

export default function HighlightCards({ title, subtitle, href, coverSrc, coverColor, details, highlights, label, className = '' }: HighlightCardsProps) {
  const { colorValue } = useTheme();
  const edge = `${colorValue}40`;
  const hover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = colorValue;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = edge;
    },
  };
  // What a card says it does, in the site's small uppercase, in the card's ink
  const cue = (words: string, ink: string) => (
    <span className="flex items-center gap-2 font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: ink }}>
      {words}
      <ArrowRight size={14} strokeWidth={1.4} className="transition-transform group-hover:translate-x-0.5" />
    </span>
  );
  // The whole card as one link: an overlay over everything but the details' controls
  const stretched = 'absolute inset-0 z-[1] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

  // The first card: the cover on its own color, and a pane of glass whose ink
  // reads on that color (--foreground and --text-muted, for its details too)
  const color = coverColor ?? colorValue;
  const coverInk = inkOn(color);
  const themeInk = inkOn(colorValue);
  const joiner = href.includes('?') ? '&' : '?';

  return (
    <div className={`${ROW} ${className}`} aria-label={label} role="list">
      <article role="listitem" className={`${CARD} ${PIECE_WIDE} justify-end p-3`} style={{ borderColor: edge, backgroundColor: color }} {...hover}>
        {coverSrc && <Image src={coverSrc} alt="" fill sizes="(min-width: 1024px) 50vw, 320px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />}
        <Link href={href} className={stretched} style={{ outlineColor: colorValue }} aria-label={`Read ${title}`} />
        <div
          className="relative flex flex-col gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-md lg:max-w-md"
          style={{ borderColor: edge, ['--foreground' as string]: coverInk, ['--text-muted' as string]: coverInk } as React.CSSProperties}
        >
          <div className="flex items-center gap-3">
            {coverSrc && <UnpppCircle src={coverSrc} color={colorValue} size={40} />}
            <div className="min-w-0">
              <h3 className="font-vt323 text-4xl uppercase leading-none" style={{ color: coverInk }}>
                {title}
              </h3>
              {subtitle && (
                <p className="mt-1 line-clamp-2 font-space-grotesk text-sm leading-snug" style={{ color: coverInk, opacity: 0.85 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {details}
          {cue(`read ${title}`, coverInk)}
        </div>
      </article>

      {/* Its highlights, taking turns: the theme color, then clear glass.
          Each opens the piece at that line */}
      {highlights.map((line, i) => {
        const filled = i % 2 === 0;
        // The glass shows the band, which is the theme color too: one ink reads on both
        const ink = themeInk;
        return (
          <article key={`line-${i}`} role="listitem" className={`${CARD} ${LINE_WIDE}`} style={{ borderColor: edge, backgroundColor: filled ? colorValue : undefined }} {...hover}>
            <Link
              href={`${href}${joiner}mention=${encodeURIComponent(line.heading.slice(0, 60))}`}
              className={stretched}
              style={{ outlineColor: themeInk }}
              aria-label={`${line.heading}: read it in ${title}`}
            />
            {line.sub && (
              <p className="line-clamp-2 font-space-grotesk text-sm leading-snug" style={{ color: ink, opacity: 0.8 }}>
                {line.sub}
              </p>
            )}
            <h4 className="line-clamp-4 font-vt323 text-5xl font-bold leading-none tracking-tight" style={{ color: ink }}>
              {line.heading}
            </h4>
            {cue('read from here', ink)}
          </article>
        );
      })}
    </div>
  );
}

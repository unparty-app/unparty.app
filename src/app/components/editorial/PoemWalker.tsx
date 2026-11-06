'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { ChevronUp } from '@/app/components/icons';
import { FOUNDER, ICON_DEFAULTS } from '@/app/constants/organization';
import { useTheme } from '../../contexts/ThemeContext';
import PoemVerse from './PoemVerse';
import NamedIcon from '../icons/NamedIcon';

// One trip across its lane and back, in seconds (globals.css .poem-walker)
const WALK_SECONDS = 32;

interface PoemWalkerProps {
  id: string;
  verseHtml: string;
  title?: string;
  icon?: string; // An icon's export name (```poem Heart); the Poem icon when unset or unknown
  ink?: string; // The poem's handwriting, shown instead of the typed verse (PoemVerse)
  author?: string; // Whose poem it is; unset, the site's founder
}

/**
 * PoemWalker - a ```poem, carried by its hand-drawn icon. The poem belongs to
 * its story, so its icon stays there: where the poem was written, it waddles
 * back and forth across the story's column, like an old desktop assistant,
 * on the story's page and inside a preview of it alike. Tapping it stops it
 * and unfolds the poem right there, in the page, so the reader never leaves
 * the story: its title, the verse as written (or its handwriting), and whose
 * it is. Tapping it again, or "hide poem", folds it back.
 *
 * The poem still lives in the page, visually hidden at that same place, so
 * search engines and screen readers read it where it was written. Hovering
 * or focusing the icon stops it; with reduced motion it stands still at the
 * left.
 */
const PoemWalker: React.FC<PoemWalkerProps> = ({ id, verseHtml, title, icon, ink, author }) => {
  const { colorValue } = useTheme();
  const [open, setOpen] = useState(false);
  // The poem's own icon (```poem Heart), the owner's default (#589), then Poem
  // Two poems on one page shouldn't walk in step: each starts somewhere
  // else on the trip, the same place every load
  const start = [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % WALK_SECONDS;
  const name = title || 'poem';
  // A poem is its owner's unless it names someone else, so a copy's poems
  // carry the copy's founder, with their picture and their page
  const byFounder = !author || author === FOUNDER.name;
  const by = author || FOUNDER.name;
  const panelId = `${id}-poem`;

  const toggle = (via: 'icon' | 'hide poem') => {
    track(open ? 'poem_closed' : 'poem_opened', open ? { poem: name, via } : { poem: name });
    setOpen(!open);
  };

  return (
    <>
      <figure className="sr-only">
        {title && <figcaption>{title}</figcaption>}
        <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: verseHtml }} />
        <p>{by}</p>
      </figure>

      <div className="poem-walker-lane relative mt-8 h-16 w-full" style={{ ['--poem-walk' as string]: `${WALK_SECONDS}s` } as React.CSSProperties}>
        <div className="poem-walker absolute bottom-0 left-0" data-open={open || undefined} style={{ animationDelay: `-${start}s` }}>
          <button
            type="button"
            onClick={() => toggle('icon')}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? 'Hide' : 'Read'} the poem${title ? `: ${title}` : ''}`}
            title={title ? `a poem: ${title}` : 'a poem'}
            className="poem-walker__body flex size-14 items-center justify-center rounded-full border-2 bg-background/85 shadow-lg backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
            style={{ borderColor: colorValue }}
          >
            <span className="poem-walker__face flex" style={{ animationDelay: `-${start}s` }}>
              <NamedIcon name={icon} fallback={[ICON_DEFAULTS.poem, 'Poem']} size={30} themed className="poem-walker__icon" />
            </span>
          </button>
        </div>
      </div>

      {/* The poem, unfolded under its icon. Its words are already in the
          figure above, so only the title, byline and fold are read out */}
      <div id={panelId} className="poem-unfold mb-8" data-open={open || undefined} inert={!open}>
        <div className="min-h-0 overflow-hidden">
          <div className="mt-4 border-y py-8" style={{ borderColor: `${colorValue}30` }}>
            <p className="font-google-sans-code text-[10px] uppercase leading-tight tracking-wide md:text-xs" style={{ color: 'var(--text-muted)' }}>
              poem.
            </p>
            <h3 className="mt-0.5 font-space-grotesk text-base font-medium leading-tight text-[var(--foreground)] md:text-lg">
              {name}
            </h3>

            <div className="mt-8" aria-hidden>
              <PoemVerse verseHtml={verseHtml} icon={icon} ink={ink} hideIcon />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              {byFounder ? (
                <Link
                  href="/founders"
                  className="flex items-center gap-2 rounded-full pr-2 font-space-grotesk text-sm text-[var(--foreground)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
                >
                  {FOUNDER.image && (
                    <span className="relative size-6 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={FOUNDER.image.startsWith('/') ? FOUNDER.image : `/${FOUNDER.image}`}
                        alt=""
                        width={24}
                        height={24}
                        className="size-full object-cover"
                      />
                    </span>
                  )}
                  {by.toLowerCase()}
                </Link>
              ) : (
                <p className="font-space-grotesk text-sm text-[var(--foreground)]">{by.toLowerCase()}</p>
              )}
              <button
                type="button"
                onClick={() => toggle('hide poem')}
                className="flex h-10 items-center gap-1 rounded-full border pl-4 pr-3 font-google-sans-code text-xs transition-transform duration-200 hover:scale-105 hover:bg-[var(--background-highlight)] active:scale-95"
                style={{ borderColor: colorValue, color: colorValue }}
              >
                hide poem
                <ChevronUp className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PoemWalker;

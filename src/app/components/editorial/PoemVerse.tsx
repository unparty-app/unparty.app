'use client';

import { ICON_DEFAULTS } from '@/app/constants/organization';
import NamedIcon from '../icons/NamedIcon';

/**
 * PoemVerse - a poem as its artist wrote it: its hand-drawn icon drawing
 * itself in, then every line, indent and stanza break, in a monospace face so
 * the indents line up. A poem with its handwriting (`ink`) shows that
 * instead, in the theme's ink color, and keeps the typed verse for screen
 * readers. Shared by the poem unfolded in place (PoemWalker) and the reader
 * view (ReaderArticle), where the poem shows in full.
 */
export default function PoemVerse({ verseHtml, icon, ink, hideIcon }: { verseHtml: string; icon?: string; ink?: string; hideIcon?: boolean }) {
  // The poem's own icon (```poem Heart), the owner's default (#589), then Poem
  return (
    <>
      {!hideIcon && <NamedIcon name={icon} fallback={[ICON_DEFAULTS.poem, 'Poem']} size={56} themed className="poem-viewer-icon mb-8" />}
      {ink && (
        // The ink is a mask over the page's foreground, so the hand reads on
        // light and dark alike; the invisible copy gives it its proportions
        <div className="relative w-full max-w-md" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ink} alt="" className="invisible block h-auto w-full" />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'var(--foreground)',
              WebkitMaskImage: `url(${ink})`,
              maskImage: `url(${ink})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }}
          />
        </div>
      )}
      <p
        className={ink ? 'sr-only whitespace-pre-wrap' : 'whitespace-pre-wrap font-google-sans-code text-[15px] leading-7 text-[var(--foreground)] sm:text-base sm:leading-8'}
        dangerouslySetInnerHTML={{ __html: verseHtml }}
      />
    </>
  );
}

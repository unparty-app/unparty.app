'use client';

import { useTheme } from '../contexts/ThemeContext';
import { useInView } from '../hooks/useInView';
import ActionPill from './build-yours/ActionPill';
import { BUILD_YOURS_DONE } from './build-yours/BuildYours';
import { Download } from './icons';
import type { ReleaseTake } from '@/lib/project-belt';

// The chips pop in once the verb has written itself, one after another
const CHIPS_FROM_MS = 1300;
const CHIP_STAGGER_MS = 70;

/**
 * ReleaseRow - a component's latest release, under the component on its home
 * article: try it above, take it here. One pill in "build yours"'s hand,
 * "take it" with its version, opens the release's chapter on /releases
 * (every file and the notes); beside it a chip per file saves that file
 * straight away (counted, ReleaseDownloads). Floats and wraps, nothing to
 * scroll. Agents read the same files, named, in /llms.txt.
 */
export default function ReleaseRow({ release }: { release: ReleaseTake }) {
  const { colorValue } = useTheme();
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} role="group" aria-label="take it" className="build-yours flex flex-wrap items-center gap-2" data-paused={!seen || undefined} style={BUILD_YOURS_DONE}>
      <ActionPill verb="take it" note={`v${release.version}`} href={release.href} icon={Download} color={colorValue} label={release.label} />
      {release.files.map((file, i) => (
        <a
          key={file.url}
          href={file.url}
          download
          aria-label={file.label}
          title={file.label}
          className="build-yours__brain inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--foreground)] transition-colors hover:bg-[var(--background-highlight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ borderColor: colorValue, outlineColor: colorValue, animationDelay: `${CHIPS_FROM_MS + i * CHIP_STAGGER_MS}ms` }}
        >
          <Download size={13} color={colorValue} className="shrink-0" />
          {file.name}
        </a>
      ))}
    </div>
  );
}

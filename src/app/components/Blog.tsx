"use client";

import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';
import { getAllKeywordTerms } from '../utils/keywordDetection';
import { resolveCoverSrc } from '../utils/coverPath';
import { findProjectById, listFounderProjects, type ResolvedProject } from '@/lib/projects';
import InkStage, { beatDelay, beatMs, useInked } from './ink/InkStage';
import { InkLine, InkWord } from './ink/primitives';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';

// The site's own words (KeywordsConfig), without their "(…)" notes, longest
// first so a longer term wins over one it contains, and only as whole words
// ("app" doesn't light inside "happy")
const KEYWORDS = getAllKeywordTerms()
  .map((term) => term.replace(/\s\([^)]+\)/, '').trim())
  .filter(Boolean)
  .sort((a, b) => b.length - a.length);
const KEYWORD_PATTERN = KEYWORDS.length
  ? new RegExp(`(?<![\\w])(${KEYWORDS.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w])`, 'gi')
  : null;

interface BlogProps {
  projectId?: string; // Which project to announce; the owner's first project when unset
}

/**
 * Blog: one of the owner's projects, announced as a card. Its cover, its
 * name (linked to where it lives, when it has a url), its tagline, and its
 * description with the site's own keywords lit in the theme color.
 *
 * Everything comes from the owner's projects (FoundersConfig `projects`,
 * through src/lib/projects.ts), so a copy shows its own work. With no
 * project to show it renders nothing.
 *
 * It draws in with the site's ink (components/ink) once it's in view: the
 * cover's outline draws, the cover fades in inside it, the words rise, and
 * last the keywords light up one after another, like a highlighter over
 * words already on the page.
 */
export default function Blog({ projectId }: BlogProps) {
  const project = projectId ? findProjectById(projectId) : listFounderProjects()[0];
  if (!project) return null;
  return (
    <InkStage className="w-full">
      <BlogCard project={project} />
    </InkStage>
  );
}

// The cover's outline, as a pen stroke around a rounded square (0–100 units,
// corners 7 round: the cover sits 1 inside it, 6 round)
const OUTLINE = 'M8 1 H92 Q99 1 99 8 V92 Q99 99 92 99 H8 Q1 99 1 92 V8 Q1 1 8 1 Z';

function BlogCard({ project }: { project: ResolvedProject }) {
  const { colorValue } = useTheme();
  const inked = useInked();

  const name = project.name ?? project.id;
  const cover = project.cover ? resolveCoverSrc(project.cover) : null;
  const words = project.description || project.need;

  // Each keyword lights after the words have risen, one after another
  const lit = (text: string) =>
    KEYWORD_PATTERN
      ? text.split(KEYWORD_PATTERN).map((part, index) =>
          index % 2 === 1 ? (
            <span
              key={index}
              className="transition-colors duration-700 motion-reduce:transition-none"
              style={{ color: inked ? colorValue : undefined, transitionDelay: `${beatMs(12 + index / 2)}ms` }}
            >
              {part}
            </span>
          ) : (
            part
          )
        )
      : text;

  return (
    <article className="flex w-full flex-col items-start gap-6 text-left sm:flex-row sm:items-center sm:gap-8">
      {cover && (
        <div className="relative aspect-square w-40 shrink-0 sm:w-56">
          {/* Inset and rounded in percent, so its corners stay concentric with the outline's at any width */}
          <div className={`absolute overflow-hidden ${inked ? 'ink-fade' : 'opacity-0'}`} style={{ inset: '2%', borderRadius: '6%', ...beatDelay(4) }}>
            <Image src={cover} alt={`${name}'s cover`} fill sizes="(min-width: 640px) 224px, 160px" className="object-cover" />
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
            <InkLine d={OUTLINE} length={700} width={1} />
          </svg>
        </div>
      )}
      <div className="flex min-w-0 flex-col items-start gap-3">
        {project.tagline && (
          <InkWord beat={6} className={LABEL}>
            {project.tagline}
          </InkWord>
        )}
        <InkWord as="div" beat={7} className="font-vt323 text-4xl leading-none text-[var(--foreground)]">
          {project.url ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
            >
              {name}
            </a>
          ) : (
            name
          )}
        </InkWord>
        {words && (
          <InkWord as="div" beat={9} className="max-w-prose font-space-grotesk text-sm leading-relaxed text-[var(--text-muted)]">
            {lit(words)}
          </InkWord>
        )}
      </div>
    </article>
  );
}

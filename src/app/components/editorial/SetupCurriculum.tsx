'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import { useInView } from '../../hooks/useInView';
import SleekTabs from '../SleekTabs';
import { CHAPTERS, SETUP_STEPS, resolveSetupStep, type SetupChapter } from '../../constants/setup-path';
import { resolveCoverSrc } from '../../utils/coverPath';
import UnpppCircle from '../UnpppCircle';
import StepNumberOverlay from './StepNumberOverlay';

/**
 * SetupCurriculum — the SETUP. curriculum (#1094) as a reading path.
 *
 * Steps come from prisma/setup-steps.ts (order + chapter) and each step's copy
 * from its article's subtitle, so a new step or a reworded article shows up
 * here without touching this file. A step whose article is not registered or
 * not published yet is listed without a link instead of pointing at a 404.
 *
 * Every row reads like a `personal` section: the numbered ring (the same
 * StepNumberOverlay as ChallengeSteps), the chapter's cover circle (colorValue
 * until a chapter has a cover), the chapter, then the copy in Space Grotesk.
 * Rings draw in once the list scrolls into view; .step-ring in globals.css.
 *
 * variant="preview" (homepage): one row per chapter, linking to its first step.
 * variant="full" (/article/setup-start-here): every step, then the optional ones,
 * one chapter at a time behind the house tab bar (SleekTabs).
 */

const MORE: { label: string; promise: string; cover?: string } = {
  label: 'MORE',
  promise: 'add more when you want it. every one is optional.',
};

const chapterCover = (id?: SetupChapter) => {
  const cover = id ? CHAPTERS.find((chapter) => chapter.id === id)?.cover : MORE.cover;
  return cover ? resolveCoverSrc(cover) : undefined;
};

export const SETUP_START_HERE = '/article/setup-start-here';

// A step's link and words (constants/setup-path)
const resolve = resolveSetupStep;

const requiredPath = SETUP_STEPS.filter((step) => step.chapter);
const optionalSteps = SETUP_STEPS.filter((step) => !step.chapter);

interface SetupCurriculumProps {
  variant?: 'preview' | 'full';
}

export default function SetupCurriculum({ variant = 'full' }: SetupCurriculumProps) {
  const { colorValue } = useTheme();
  const [listRef, inView] = useInView<HTMLOListElement>();
  const listClass = `step-rings w-full text-left ${inView ? 'is-in' : ''}`;
  // The full list's own observer and the phone layout's active chapter tab
  const [fullRef, fullInView] = useInView<HTMLDivElement>();
  const [tab, setTab] = useState<string>(CHAPTERS[0].id);

  if (variant === 'preview') {
    return (
      <div className="w-full text-left">
        <ol ref={listRef} className={listClass}>
          {CHAPTERS.map((chapter, index) => {
            const steps = requiredPath.filter((step) => step.chapter === chapter.id);
            const first = steps.map(resolve).find((step) => step.href);
            return (
              <Row
                key={chapter.id}
                index={index}
                number={index + 1}
                chapter={chapter.id}
                cover={chapterCover(chapter.id)}
                href={first?.href ?? SETUP_START_HERE}
                title={chapter.promise}
                meta={`${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`}
                colorValue={colorValue}
              />
            );
          })}
        </ol>
        <Link
          href={SETUP_START_HERE}
          className="mt-4 inline-block px-2 font-vt323 text-xl uppercase transition-opacity hover:opacity-70"
          style={{ color: colorValue }}
        >
          start here →
        </Link>
      </div>
    );
  }

  // Every row of the full list, tagged with its chapter (MORE for optional)
  const fullRows = [
    ...requiredPath.map((step, index) => {
      const { href, blurb } = resolve(step);
      return {
        key: step.key,
        chapter: step.chapter as string,
        row: {
          index,
          number: index as number | string,
          chapter: step.chapter as string,
          cover: chapterCover(step.chapter),
          href,
          title: step.title,
          blurb: href ? blurb : 'not written yet.',
          meta: step.optional ? 'optional' : undefined,
          spaced: index > 0 && requiredPath[index - 1].chapter !== step.chapter,
        },
      };
    }),
    ...optionalSteps.map((step, index) => {
      const { href, blurb } = resolve(step);
      return {
        key: step.key,
        chapter: MORE.label,
        row: {
          index: requiredPath.length + index,
          number: '+' as number | string,
          chapter: MORE.label,
          cover: chapterCover(),
          href,
          title: step.title,
          blurb: href ? blurb : 'not written yet.',
          meta: undefined,
          spaced: index === 0,
        },
      };
    }),
  ];
  const chapterTabs = [...CHAPTERS.map((c) => ({ id: c.id as string, promise: c.promise })), { id: MORE.label, promise: MORE.promise }];
  const activeChapter = chapterTabs.find((c) => c.id === tab) ?? chapterTabs[0];

  return (
    <div ref={fullRef} className={`step-rings w-full text-left ${fullInView ? 'is-in' : ''}`}>
      {/* One chapter at a time behind the house tab bar, with the chapter's
          promise, instead of every row stacked down the screen */}
      <div>
        <SleekTabs
          label="SETUP. chapters"
          tabs={chapterTabs.map((c) => ({ id: c.id, label: `${c.id}.` }))}
          activeId={activeChapter.id}
          onChange={setTab}
          accent={colorValue}
        />
        <p className="px-2 pb-1 pt-3 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
          {activeChapter.promise}
        </p>
        <ol key={activeChapter.id} className="animate-in fade-in duration-200">
          {fullRows
            .filter((r) => r.chapter === activeChapter.id)
            .map(({ key, row }) => (
              <Row key={key} {...row} spaced={false} showChapter={false} colorValue={colorValue} />
            ))}
        </ol>
      </div>
    </div>
  );
}

interface RowProps {
  index: number;
  number: number | string;
  chapter: string;
  cover?: string;
  href: string | null;
  title: string;
  blurb?: string;
  meta?: string;
  spaced?: boolean;
  /** false inside a chapter tab, where the tab already names the chapter */
  showChapter?: boolean;
  colorValue: string;
}

// One row: ring · chapter circle · CHAPTER. · copy (on phones CHAPTER. sits
// above the copy), typeset like `personal`
// (Space Grotesk, text-xs → md:text-sm, leading-relaxed, muted) with its
// hover: the title takes the theme color and grows from the left
function Row({ index, number, chapter, cover, href, title, blurb, meta, spaced, showChapter = true, colorValue }: RowProps) {
  const body = (
    <>
      <span className="step-ring relative size-7 shrink-0" style={{ ['--i' as string]: index }}>
        <StepNumberOverlay number={number} colorValue={colorValue} weight="thin" className="h-full w-full overflow-visible" />
      </span>
      {showChapter && (
        <>
          <UnpppCircle src={cover} color={colorValue} size={28} />
          <span className="hidden w-14 shrink-0 font-vt323 text-lg leading-none sm:block" style={{ color: colorValue }}>
            {chapter}.
          </span>
        </>
      )}
      <span className="min-w-0 flex-1 font-space-grotesk text-xs leading-relaxed md:text-sm">
        {/* Phones: the chapter rides above the copy instead of taking a column */}
        {showChapter && (
          <span className="block font-vt323 text-base leading-none sm:hidden" style={{ color: colorValue }}>
            {chapter}.
          </span>
        )}
        <span
          className={`inline-block origin-left transition-transform duration-200 ${
            href ? 'text-[var(--foreground)] group-hover:scale-105 group-hover:text-[var(--theme-color,_#f9c22e)]' : 'text-[var(--text-muted)]'
          }`}
        >
          {title}
        </span>
        {meta && (
          <span className="ml-4 whitespace-nowrap font-google-sans-code text-[10px] uppercase text-[var(--text-muted)]">{meta}</span>
        )}
        {blurb && <span className="block text-[var(--text-muted)]">{blurb}</span>}
      </span>
    </>
  );

  const rowClass = 'flex items-center gap-2 px-2 py-2 sm:gap-3';
  return (
    <li className={spaced ? 'mt-5' : undefined}>
      {href ? (
        <Link href={href} className={`group ${rowClass}`}>
          {body}
        </Link>
      ) : (
        <div className={`${rowClass} opacity-60`}>{body}</div>
      )}
    </li>
  );
}

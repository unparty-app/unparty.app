'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import { useSetupProgress } from '../../hooks/useSetupProgress';
import { setupStepByKey, type SetupStepView } from '../../constants/setup-path';
import { useInView } from '../../hooks/useInView';
import type { ChallengeStep } from '../../constants/editorial-articles/types';
import { useUser } from '@/lib/auth-stub.client';
import { FOUNDER, FOUNDER_ANSWERS } from '../../constants/organization';
import { MAX_ANSWER_LENGTH } from '@/lib/answer-slots';
import { setReaderAnswer, useReaderAnswers } from '@/lib/challenge-answers';
import { OwnerAnswersSave, useOwnerAnswers } from '../YourAnswers';
import { WordField, wordField } from '../YourWords';
import { InkCircle, InkUnderline } from '../depend/ink';
import { wordsOf } from '@/lib/words';
import { RankingDone } from './RankingParts';
import { parseMarkdownText } from '../../utils/textParsing';
import { resolveCoverSrc } from '../../utils/coverPath';
import UnpppCircle from '../UnpppCircle';
import CoverImageBackground from './CoverImageBackground';
import StepNumberOverlay from './StepNumberOverlay';
import SleekTabs from '../SleekTabs';
import NamedIcon, { hasNamedIcon } from '../icons/NamedIcon';

/**
 * Challenge steps as borderless cards: the step's cover on top (when it has
 * one), then the same row as a `personal` section and SetupCurriculum — the
 * thin numbered ring, the ACTION. in vt323, and the description in Space
 * Grotesk. Everything is on the page; there is no modal to open.
 *
 * The rings draw in once the row scrolls into view and wobble on hover
 * (.step-rings in globals.css). On phones the steps sit behind the house tab
 * bar (SleekTabs), one at a time, instead of stacking. Keycap emoji (1️⃣ 2️⃣ 3️⃣) repeat the ring's
 * number, so only other emoji are shown, after the action.
 *
 * Above the steps, the challenge's own cover and caption read like a
 * `personal` row: a 32px cover circle, then the caption in Space Grotesk.
 *
 * The onboarding (#589): a step that names a SETUP. step (`step: 'github'`)
 * shows that step, its title and words unless the article sets its own, and
 * its title opens it. Its ring turns to a tick once the reader has done it,
 * and for a signed-in builder the ring is what ticks it (useSetupProgress);
 * the caption counts how many are done.
 *
 * A step that names an answer (`answer: 'about'`, #265) shows the owner's
 * answer (FoundersConfig `answers`) and takes the reader's, kept in this tab
 * until it goes with their worksheet. For the owner, the box is their own
 * public answer. `answer: true` only asks the reader, whoever they are, and
 * the step's description is the question. They write on a pen line, and what
 * they write rises below as words (WordField) until, with every step answered,
 * the site's ask writes itself on. A step can name a hand-drawn icon in place
 * of its numbered ring, and an ink ring draws around it once it's answered. The
 * answers live above the cards: phones remount a card each
 * time its tab changes, and wider screens render the steps separately.
 */

type Shown = ChallengeStep & { setup?: SetupStepView };
type AnswerBox = { value: string; onChange: (value: string) => void; theirs?: string };

const KEYCAP = /^[0-9#*]\uFE0F?\u20E3$/u;

const StepCard: React.FC<{ step: Shown; index: number; colorValue: string; done?: boolean; onTick?: () => void; answerBox?: AnswerBox }> = ({
  step,
  index,
  colorValue,
  done = false,
  onTick,
  answerBox,
}) => {
  const stepIcon = hasNamedIcon(step.icon);
  const emoji = !stepIcon && step.emoji && !KEYCAP.test(step.emoji.trim()) ? step.emoji : null;
  const action = step.action || step.setup?.title || '';
  const description = step.description || step.setup?.blurb || '';
  const href = step.setup?.href;
  const ring = <StepNumberOverlay number={done ? '✓' : index + 1} colorValue={colorValue} weight={done ? 'bold' : 'thin'} className="h-full w-full overflow-visible" />;

  return (
    <li className="group min-w-0">
      {step.cover && (
        <div className="relative mb-3 aspect-video overflow-hidden rounded-xl sm:aspect-[4/3]">
          <CoverImageBackground
            cover={step.cover}
            roundedClassName="rounded-xl"
            scrim={false}
            className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        </div>
      )}
      <div className="flex items-start gap-3">
        {stepIcon ? (
          <span className="relative grid size-7 shrink-0 place-items-center" data-answered={answerBox?.value.trim() ? '' : undefined}>
            <NamedIcon name={step.icon} size={answerBox?.value.trim() ? 18 : 28} color={colorValue} className="transition-all duration-300" />
            {answerBox?.value.trim() && <InkCircle color={colorValue} className="absolute -left-1 -top-1 size-9" />}
          </span>
        ) : onTick ? (
          <button
            type="button"
            onClick={onTick}
            aria-pressed={done}
            aria-label={`${action}: ${done ? 'done, tap to undo' : 'mark done'}`}
            className="step-ring relative size-7 shrink-0 rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
            style={{ ['--i' as string]: index, outlineColor: colorValue }}
          >
            {ring}
          </button>
        ) : (
          <span className="step-ring relative size-7 shrink-0" style={{ ['--i' as string]: index }} aria-label={done ? 'done' : undefined}>
            {ring}
          </span>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          {(action || emoji) && (
            <p className="font-vt323 text-lg uppercase leading-none" style={{ color: colorValue }}>
              {href ? (
                <Link href={href} className="group/step inline-flex items-center gap-1 hover:underline hover:underline-offset-4">
                  {action}
                  <span className="transition-transform group-hover/step:translate-x-0.5">→</span>
                </Link>
              ) : (
                action
              )}
              {emoji && <span className="ml-2 align-middle text-base normal-case">{emoji}</span>}
            </p>
          )}
          <p
            className="mt-1 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm"
            dangerouslySetInnerHTML={{ __html: parseMarkdownText(description) }}
          />
          {answerBox?.theirs && (
            <p className="mt-3 font-space-grotesk text-sm leading-relaxed text-[var(--foreground)]">
              <span className="mb-1 block font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: colorValue }}>{FOUNDER.name}.</span>
              {answerBox.theirs}
            </p>
          )}
          {answerBox && (
            <label className="group/answer relative mt-2 block">
              <textarea
                value={answerBox.value}
                onChange={(e) => answerBox.onChange(e.target.value)}
                maxLength={MAX_ANSWER_LENGTH}
                rows={2}
                aria-label={description}
                className="block min-h-12 w-full resize-none bg-transparent pb-2 font-space-grotesk text-base leading-relaxed text-[var(--foreground)] outline-none [field-sizing:content]"
              />
              <InkUnderline color={colorValue} className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-44 opacity-50 transition-opacity duration-200 group-focus-within/answer:opacity-100" />
            </label>
          )}
        </div>
      </div>
    </li>
  );
};

/** What they've written, as words, in ink: the only place it shows until they send it */
const AnswerWords: React.FC<{ answers: string[]; prompts: string[] }> = ({ answers, prompts }) => {
  const written = useDeferredValue(answers.join(' '));
  const promptKey = prompts.join(' ');
  const { field } = useMemo(() => wordField([], written, new Set(wordsOf(promptKey))), [written, promptKey]);
  // Quieter than a cloud's: with a few words each used once, every one would be its largest
  const quiet = field.map((entry) => ({ ...entry, size: Math.round(18 + entry.weight * 12) }));
  if (!quiet.length) return null;
  return <WordField field={quiet} writing label="your words" className="mt-8" />;
};

const ChallengeSteps: React.FC<{ steps: ChallengeStep[]; cover: string; caption: string }> = ({
  steps,
  cover,
  caption,
}) => {
  const { colorValue } = useTheme();
  const [ringsRef, inView] = useInView<HTMLDivElement>();
  const [active, setActive] = useState('0');
  const { user } = useUser();
  const isOwner = user?.publicMetadata?.role === 'admin';
  const owner = useOwnerAnswers();
  const readerAnswers = useReaderAnswers();
  const activeIndex = Math.min(Number(active), steps.length - 1);
  // Steps that name a SETUP. step, with that step's words, link and progress
  const shown: Shown[] = steps.map((step) => (step.step ? { ...step, setup: setupStepByKey(step.step) } : step));
  const setupIds = shown.flatMap((step) => (step.setup ? [step.setup.id] : []));
  const progress = useSetupProgress(setupIds);
  const doneCount = setupIds.filter((id) => progress.done.has(id)).length;
  const counted =
    setupIds.length && progress.signedIn
      ? doneCount === setupIds.length
        ? ' every step done.'
        : ` ${doneCount} of ${setupIds.length} done.`
      : '';
  const answerBox = (step: Shown): AnswerBox | undefined => {
    const slot = step.answer;
    if (!slot) return undefined;
    if (isOwner && slot !== true) return { value: owner.values[slot], onChange: (value) => owner.setValue(slot, value) };
    const prompt = step.description || step.action || String(slot);
    return { value: readerAnswers[prompt] ?? '', onChange: (value) => setReaderAnswer(prompt, value), theirs: slot === true ? undefined : FOUNDER_ANSWERS[slot] };
  };
  const asksForAnswers = shown.some((step) => step.answer);
  const ownerAnswers = isOwner && shown.some((step) => step.answer && step.answer !== true);
  const asked = shown.filter((step) => step.answer).map((step) => answerBox(step)?.value ?? '');
  const everyStepAnswered = asked.length > 0 && asked.every((value) => value.trim());
  const cardProps = (step: Shown) => ({
    answerBox: answerBox(step),
    ...(step.setup ? { done: progress.done.has(step.setup.id), onTick: progress.signedIn ? () => progress.toggle(step.setup!.id) : undefined } : {}),
  });

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <UnpppCircle src={resolveCoverSrc(cover)} color={colorValue} size={32} />
        <p className="font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm" aria-live="polite">
          {caption}
          {counted && <span style={{ color: colorValue }}>{counted}</span>}
          {progress.notice && <span className="block">{progress.notice}</span>}
        </p>
      </div>

      {steps.length > 0 && (
        <div ref={ringsRef} className={`step-rings text-left ${inView ? 'is-in' : ''}`}>
          {/* sm and up: every step side by side */}
          <ol className="hidden gap-6 sm:grid sm:grid-cols-3">
            {shown.map((step, index) => (
              <StepCard key={index} step={step} index={index} colorValue={colorValue} {...cardProps(step)} />
            ))}
          </ol>

          {/* Phones: one step at a time behind the house tab bar, instead of
              three cards stacked down the screen */}
          <div className="sm:hidden">
            <SleekTabs
              label="Challenge steps"
              tabs={shown.map((step, index) => ({
                id: String(index),
                label: step.icon ? step.action || `Step ${index + 1}` : `${index + 1} · ${step.action || step.setup?.title || `Step ${index + 1}`}`,
              }))}
              activeId={String(activeIndex)}
              onChange={setActive}
              accent={colorValue}
              className="mb-4"
            />
            <ol key={activeIndex} className="animate-in fade-in duration-200">
              <StepCard step={shown[activeIndex]} index={activeIndex} colorValue={colorValue} {...cardProps(shown[activeIndex])} />
            </ol>
          </div>

          {asksForAnswers &&
            (ownerAnswers ? (
              <div className="mt-6">
                <OwnerAnswersSave owner={owner} />
              </div>
            ) : (
              <>
                <AnswerWords answers={asked} prompts={shown.map((step) => step.description ?? '')} />
                {everyStepAnswered && <RankingDone />}
              </>
            ))}
        </div>
      )}
    </>
  );
};

export default ChallengeSteps;

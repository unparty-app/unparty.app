'use client';

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { InkRing } from './depend/ink';
import { palette } from '../constants/colors';
import { WORD_TYPES } from '../constants/organization';
import { BUILD_TYPES, classifyWords } from '@/lib/word-types';
import InkWords from './resume/InkWords';
import BuildTypePicker from './BuildTypePicker';
import { useSiteCloud, wordField, type FieldEntry } from './YourWords';
import { WriteYourWords } from './editorial/RankingParts';
import { wordsOf } from '@/lib/words';
import { fillMissingReaderAnswers, fillMissingReaderRankings, useReaderAnswers, useReaderRankings, type ReaderAnswers } from '@/lib/challenge-answers';

interface WorksheetEntry {
  email: string;
  name: string;
  ideaName: string;
  deadline: string;
  color?: string;
  updatedAt?: string;
}

// A problem's color: its card on /party and its article cover
const PROBLEM_COLORS = [...new Set(Object.values(palette))];

// Each question is answered with this many words from the site's own cloud
const WORDS_PER_ANSWER = 5;

// The worksheet's questions, asked in words. Drafts of the founder's ranking
// questions (label / beliefs / effort / building it alone), reworded for
// picking words; each answer travels with the submission as its prompt and
// five words, so the ranking questions' own answers never change
const QUESTIONS = [
  { id: 'label', label: 'CORE', prompt: 'which five words sound most like you?', description: 'to start with unparty-app you must assign yourself a label.' },
  { id: 'beliefs', label: 'PROBLEM', prompt: 'which five words are you least familiar with?', description: '' },
  { id: 'effort', label: 'deadlines', prompt: 'which five words take you the most effort?', description: 'my self-imposed deadlines often lacked a good understanding of effort.' },
  { id: 'alone', label: 'QUESTION', prompt: 'which five words do you connect with the most?', description: '' },
];

// Signed out, the picks wait in this tab for sign in
const PICKS_KEY = 'problem-worksheet-picks';
const TAGS_KEY = 'problem-worksheet-tags';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide md:text-xs';

const loadSaved = <T,>(key: string): Record<string, T> => {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
};

/**
 * ProblemWorksheet - the problem, answered in words (#389). Each question is
 * answered by picking five words from the site's own word cloud (InkWords,
 * /api/words), and as the words add up, they point to the kind of build the
 * problem is, by the words the owner tagged (/admin → Your words). Then the
 * details (email, name, idea, deadline, its color) send it on as a waitlist
 * application (/api/problem/send).
 *
 * Anyone can pick and see what their words point to. Sending takes sign in:
 * picks made signed out wait in the tab until then. Each answer travels with
 * the submission as its prompt and five words (answeredQuestions), which a
 * problem's article lists, along with the kind of build they point to.
 *
 * Someone who answered a challenge's questions (ChallengeSteps, #265) picks
 * from their own words among the site's: wordField, counted from what they
 * wrote. Those travel with the submission too. The owner hasn't tagged words
 * only they use, so a slide asks them what theirs point to, and never guesses.
 */
const ProblemWorksheet: React.FC = () => {
  const { colorValue } = useTheme();
  const pathname = usePathname();
  const [isFetching, setIsFetching] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingEntry, setExistingEntry] = useState<WorksheetEntry | null>(null);
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [formValues, setFormValues] = useState<WorksheetEntry>({ email: '', name: '', ideaName: '', deadline: '' });
  const [theirTags, setTheirTags] = useState<Record<string, string>>({});
  const [tagging, setTagging] = useState<string[]>([]);
  const answers = useDeferredValue(useReaderAnswers());
  const rankings = useReaderRankings();
  const { words: site, loaded: siteLoaded } = useSiteCloud();

  // Who's here, their last problem, and each question's text and saved words
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let signedIn = false;
      let prefill: Record<string, string[]> = {};
      let prefillTags: Record<string, string> = {};
      try {
        const response = await fetch('/api/problem/send', { cache: 'default' });
        if (response.ok) {
          signedIn = true;
          const data = await response.json();
          if (!cancelled && data.entry) {
            setExistingEntry(data.entry);
            setFormValues({ email: data.entry.email, name: data.entry.name, ideaName: data.entry.ideaName, deadline: data.entry.deadline, color: data.entry.color });
            // Their last words, by prompt, under anything picked in this tab
            const last: Record<string, string[]> = {};
            for (const q of QUESTIONS) {
              const words = (data.entry.answeredQuestions ?? []).find((a: { text: string }) => a.text === q.prompt)?.responseData;
              if (Array.isArray(words)) last[q.id] = words.filter((w: unknown) => typeof w === 'string');
            }
            prefill = last;
            prefillTags = data.entry.wordTypes ?? {};
            // Their last written answers: any answer in words of their own
            const written: ReaderAnswers = {};
            for (const answer of data.entry.answeredQuestions ?? []) {
              if (typeof answer.responseData === 'string') written[answer.text] = answer.responseData;
            }
            fillMissingReaderAnswers(written);
            // And their last word rankings: any answer in words that isn't one of these questions
            const ranked: Record<string, string[]> = {};
            for (const answer of data.entry.answeredQuestions ?? []) {
              if (Array.isArray(answer.responseData) && !QUESTIONS.some((q) => q.prompt === answer.text)) ranked[answer.text] = answer.responseData;
            }
            fillMissingReaderRankings(ranked);
          }
        }
      } catch (error) {
        console.warn('Failed to load existing entry:', error);
      }
      if (cancelled) return;
      setIsAuthenticated(signedIn);
      setPicks({ ...prefill, ...loadSaved<string[]>(PICKS_KEY) });
      setTheirTags({ ...prefillTags, ...loadSaved<string>(TAGS_KEY) });
      setIsFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Only once they've loaded: on the way in, picks is still empty, and writing
  // that would wipe the words waiting here before anything could read them
  useEffect(() => {
    if (isFetching) return;
    try {
      sessionStorage.setItem(PICKS_KEY, JSON.stringify(picks));
      sessionStorage.setItem(TAGS_KEY, JSON.stringify(theirTags));
    } catch {
      // Private windows can refuse storage; the picks still work on this page
    }
  }, [isFetching, picks, theirTags]);

  const allWords = useMemo(() => Object.values(picks).flat(), [picks]);
  const tags = useMemo(() => ({ ...WORD_TYPES, ...theirTags }), [theirTags]);
  const reading = useMemo(() => classifyWords(allWords, tags), [allWords, tags]);
  const tagsExist = Object.keys(tags).length > 0;
  const topType = BUILD_TYPES.find((t) => t.id === reading.top);

  // Their own words among the site's, once they've written any. The questions'
  // own words echo back in answers, so they don't count
  const ownCloud = useMemo(() => {
    const text = Object.values(answers).join(' ');
    if (!text.trim()) return null;
    const { field } = wordField(site, text, new Set(Object.keys(answers).flatMap(wordsOf)));
    return field.length ? field : null;
  }, [answers, site]);

  // The picked words only they can say anything about
  const ownWords = useMemo(() => [...new Set(allWords)].filter((word) => !WORD_TYPES[word]), [allWords]);
  const asksToTag = !!ownCloud && ownWords.length > 0;
  const formSlide = QUESTIONS.length + (asksToTag ? 1 : 0);
  const current = Math.min(slide, formSlide);
  const isFormSlide = current === formSlide;
  const isTagSlide = asksToTag && current === QUESTIONS.length;
  const question = current < QUESTIONS.length ? QUESTIONS[current] : null;
  const shownWords = (questionId: string): FieldEntry[] | undefined => {
    if (!ownCloud) return undefined;
    // A word they picked stays on the page to let go of, even once their answers change
    const here = new Set(ownCloud.map((entry) => entry.word));
    const gone = (picks[questionId] ?? []).filter((word) => !here.has(word));
    return [...ownCloud, ...gone.map((word): FieldEntry => ({ word, weight: 0.2, kind: 'yours', size: 18 }))];
  };
  const shown = question ? shownWords(question.id) : undefined;
  // Short answers on a site with little writing can leave fewer than five to pick
  const needed = shown ? Math.min(WORDS_PER_ANSWER, shown.length) : WORDS_PER_ANSWER;

  const toggle = (questionId: string) => (word: string) =>
    setPicks((now) => {
      const current = now[questionId] ?? [];
      const next = current.includes(word) ? current.filter((w) => w !== word) : current.length < WORDS_PER_ANSWER ? [...current, word] : current;
      return { ...now, [questionId]: next };
    });

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setSlide(index);
  };

  const theseFive = () => {
    setMessage(null);
    goTo(current + 1);
  };

  const toggleTagging = (word: string) => setTagging((now) => (now.includes(word) ? now.filter((w) => w !== word) : [...now, word]));

  // Their own tags stay with their worksheet; only the owner's reach FoundersConfig
  const tagPicked = (type: string | null) => {
    setTheirTags((now) => {
      const next = { ...now };
      for (const word of tagging) {
        if (type) next[word] = type;
        else delete next[word];
      }
      return next;
    });
    setTagging([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const wordAnswers = [
        ...QUESTIONS.filter((q) => (picks[q.id] ?? []).length).map((q) => ({ text: q.prompt, words: picks[q.id] })),
        ...Object.entries(rankings).map(([text, words]) => ({ text, words })),
      ];
      const textAnswers = Object.entries(answers).map(([text, answer]) => ({ text, answer }));
      const wordTypes = Object.fromEntries(Object.entries(theirTags).filter(([word]) => allWords.includes(word)));
      const response = await fetch('/api/problem/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formValues, wordAnswers, textAnswers, wordTypes, ...(reading.top && { buildType: reading.top }) }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Submission failed');
      }
      const result = await response.json();
      setMessage({ ok: true, text: existingEntry ? 'updated. your problem has its new words.' : 'sent. your problem is in.' });
      setExistingEntry(result.entry);
      try {
        sessionStorage.removeItem(PICKS_KEY);
        sessionStorage.removeItem(TAGS_KEY);
      } catch {}
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Submission failed. Please try again.' });
      console.error('Form submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <p className="py-8 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>thinking...</p>;
  }

  const answered = QUESTIONS.filter((q) => (picks[q.id] ?? []).length >= Math.min(WORDS_PER_ANSWER, shownWords(q.id)?.length ?? WORDS_PER_ANSWER)).length;
  const field = 'w-full rounded-lg border bg-transparent px-3 py-2 font-space-grotesk text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-color)]';
  const pill = 'inline-flex h-10 items-center rounded-full border px-4 font-google-sans-code text-xs transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100';

  return (
    <div className="w-full">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <p className={LABEL} style={{ color: 'var(--text-muted)' }}>
          {isFormSlide ? 'your details.' : isTagSlide ? 'your words.' : `question ${current + 1} of ${QUESTIONS.length}.`}
        </p>
        {existingEntry?.updatedAt && (
          <p className={LABEL} style={{ color: colorValue }}>
            last sent {new Date(existingEntry.updatedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {question ? (
              <div>
                <p className={LABEL} style={{ color: colorValue }}>{question.label.toLowerCase()}.</p>
                <h3 className="mt-1 font-space-grotesk text-lg font-medium leading-snug text-[var(--foreground)] md:text-xl">
                  {question.prompt}
                </h3>
                {question.description && (
                  <p className="mt-1 font-space-grotesk text-sm" style={{ color: 'var(--text-muted)' }}>{question.description}</p>
                )}
                <p className="mb-6 mt-4 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                  answer with {needed} words from {ownCloud ? 'what you wrote and ' : ''}what this site keeps writing about.
                </p>

                {siteLoaded && !site.length && !ownCloud && (
                  <div className="mb-6">
                    <WriteYourWords cloudIsEmpty />
                  </div>
                )}
                <InkWords limit={40} filter={false} selected={picks[question.id] ?? []} onToggle={toggle(question.id)} max={WORDS_PER_ANSWER} field={shown} />

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={theseFive}
                    disabled={(picks[question.id] ?? []).length !== needed}
                    className={pill}
                    style={{ borderColor: colorValue, color: colorValue }}
                  >
                    {(picks[question.id] ?? []).length === needed ? (needed === WORDS_PER_ANSWER ? 'these five.' : 'these words.') : `${(picks[question.id] ?? []).length} of ${needed} words`}
                  </button>
                  {!isAuthenticated && <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>your words wait here until you sign in.</span>}
                </div>
              </div>
            ) : isTagSlide ? (
              <div>
                <h3 className="font-space-grotesk text-lg font-medium leading-snug text-[var(--foreground)] md:text-xl">what do your words point to?</h3>
                <p className="mb-6 mt-1 font-space-grotesk text-sm" style={{ color: 'var(--text-muted)' }}>
                  this site hasn&apos;t tagged these, so only you can say. pick words, then a kind of build.
                </p>
                <InkWords
                  filter={false}
                  selected={tagging}
                  onToggle={toggleTagging}
                  tags={theirTags}
                  field={ownWords.map((word) => ({ word, weight: 0.6, kind: 'yours' as const, size: 32 }))}
                />
                <div className="mt-6">
                  <BuildTypePicker disabled={!tagging.length} canUntag={tagging.some((word) => theirTags[word])} onPick={tagPicked} />
                </div>
                <div className="mt-6">
                  <button type="button" onClick={theseFive} className={pill} style={{ borderColor: colorValue, color: colorValue }}>
                    {ownWords.some((word) => theirTags[word]) ? 'next.' : 'skip this.'}
                  </button>
                </div>
              </div>
            ) : !isAuthenticated ? (
              <div>
                <h3 className="font-space-grotesk text-lg font-medium text-[var(--foreground)] md:text-xl">send your problem.</h3>
                <p className="mt-2 font-space-grotesk text-sm" style={{ color: 'var(--text-muted)' }}>
                  {answered} of {QUESTIONS.length} questions answered. <Link href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`} className="underline underline-offset-4" style={{ color: colorValue }}>sign in</Link> to save your words and send it. they&apos;ll be here when you&apos;re back.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                {([
                  ['email', 'your email', 'email', 'info@unparty.app'],
                  ['name', 'your name', 'text', ''],
                  ['ideaName', 'the idea', 'text', 'unparty.app'],
                  ['deadline', 'finish by', 'date', ''],
                ] as const).map(([name, label, type, placeholder]) => (
                  <label key={name} className="grid gap-1">
                    <span className={LABEL} style={{ color: 'var(--text-muted)' }}>{label}.</span>
                    <input type={type} name={name} required value={formValues[name]} onChange={handleChange} placeholder={placeholder} className={field} style={{ borderColor: `${colorValue}66` }} />
                  </label>
                ))}
                <fieldset>
                  <legend className={`${LABEL} mb-2`} style={{ color: 'var(--text-muted)' }}>its color.</legend>
                  <div className="flex flex-wrap gap-1">
                    {PROBLEM_COLORS.map((hex) => {
                      const on = formValues.color === hex;
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setFormValues((prev) => ({ ...prev, color: on ? undefined : hex }))}
                          aria-label={`Color ${hex}`}
                          aria-pressed={on}
                          className="relative grid size-9 place-items-center"
                        >
                          <span className="size-5 rounded-full" style={{ backgroundColor: hex, boxShadow: `inset 0 0 0 1px ${colorValue}66` }} />
                          {on && <InkRing color="var(--foreground)" on className="absolute inset-0 size-9" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                {Object.keys(answers).length + Object.keys(rankings).length > 0 && (
                  <p className="font-space-grotesk text-xs" style={{ color: 'var(--text-muted)' }}>your answers go with this. whoever runs this site can read them.</p>
                )}
                <div>
                  <button type="submit" disabled={isLoading} className={pill} style={{ backgroundColor: colorValue, borderColor: colorValue, color: 'var(--background)' }}>
                    {isLoading ? 'sending...' : existingEntry ? 'connect a new idea' : 'build your idea'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* What the words add up to, by the owner's tags: the classification, shown as it forms */}
      <div className="mt-8 border-t pt-4" style={{ borderColor: `${colorValue}33` }} aria-live="polite">
        {!allWords.length ? (
          <p className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>pick words and see what kind of build they point to.</p>
        ) : !tagsExist ? (
          <p className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>this site hasn&apos;t tagged its words yet, so they can&apos;t point to a kind of build.</p>
        ) : !topType ? (
          <p className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>none of these words are tagged yet. try a few more.</p>
        ) : (
          <p className="font-space-grotesk text-base text-[var(--foreground)]">
            your words point to <span className="font-vt323 text-2xl" style={{ color: colorValue }}>{topType.id}.</span>{' '}
            <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
              {Math.round((reading.ranked[0]?.share ?? 0) * 100)}% of your tagged words · {topType.definition}
            </span>
          </p>
        )}
        {message && (
          <p className="mt-2 font-google-sans-code text-xs" style={{ color: message.ok ? colorValue : 'var(--foreground)' }}>{message.text}</p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2" aria-label="Questions">
        {Array.from({ length: formSlide + 1 }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={index === formSlide ? 'Go to your details' : index === QUESTIONS.length ? 'Go to your words' : `Go to question ${index + 1}`}
            aria-current={index === current}
            className="h-2 rounded-full transition-all duration-200"
            style={{ width: index === current ? '20px' : '8px', backgroundColor: index === current ? colorValue : `${colorValue}40` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProblemWorksheet;

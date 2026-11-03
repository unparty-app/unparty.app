"use client";

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FOUNDER_ANSWERS } from '@/app/constants/organization';
import { ANSWER_SLOTS, MAX_ANSWER_LENGTH, type AnswerSlot } from '@/lib/answer-slots';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';

type Saved = { applied: 'now' } | { applied: 'after-deploy'; prUrl: string };
type Values = Record<AnswerSlot, string>;

const fromConfig = (): Values => ({
  about: FOUNDER_ANSWERS.about ?? '',
  build: FOUNDER_ANSWERS.build ?? '',
  connect: FOUNDER_ANSWERS.connect ?? '',
});

export interface OwnerAnswers {
  values: Values;
  setValue: (slot: AnswerSlot, value: string) => void;
  changed: boolean;
  saving: boolean;
  saved: Saved | null;
  error: string | null;
  save: () => Promise<void>;
}

/** The owner's answers while they write them, saved to FoundersConfig `answers` */
export function useOwnerAnswers(): OwnerAnswers {
  const [values, setValues] = useState<Values>(fromConfig);
  const [lastSaved, setLastSaved] = useState<Values>(fromConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const r = await fetch('/api/admin/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: values }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.line ? `${d.error}: ${d.line}` : d.error);
      setSaved(d);
      setLastSaved(values);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return {
    values,
    setValue: (slot, value) => setValues((now) => ({ ...now, [slot]: value })),
    changed: ANSWER_SLOTS.some(({ id }) => values[id].trim() !== lastSaved[id].trim()),
    saving,
    saved,
    error,
    save,
  };
}

/** Save, and where the answers stand: live now, or once the change deploys */
export function OwnerAnswersSave({ owner }: { owner: OwnerAnswers }) {
  const { colorValue } = useTheme();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={owner.save}
        disabled={!owner.changed || owner.saving}
        className="inline-flex h-10 items-center rounded-full border px-4 font-google-sans-code text-xs transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        style={{ borderColor: colorValue, color: colorValue }}
      >
        {owner.saving ? 'saving…' : 'save your answers'}
      </button>
      <p className="font-space-grotesk text-xs text-[var(--text-muted)]" aria-live="polite">
        {owner.error ? (
          <span style={{ color: colorValue }}>{owner.error}</span>
        ) : owner.saved?.applied === 'now' ? (
          'saved. in your copy now.'
        ) : owner.saved?.applied === 'after-deploy' ? (
          <>
            saved. live once{' '}
            <a href={owner.saved.prUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>
              the change
            </a>{' '}
            deploys.
          </>
        ) : (
          'anyone can read your answers, and they count toward your words.'
        )}
      </p>
    </div>
  );
}

/**
 * YourAnswers - the owner's answers to the challenge's questions (/admin →
 * Your answers, #265). The same three a reader answers on a challenge, kept in
 * FoundersConfig `answers`, shown on the steps that ask them and counted with
 * the owner's writing, so they reach the word cloud, its tags and the worksheet.
 */
export default function YourAnswers() {
  const { colorValue } = useTheme();
  const owner = useOwnerAnswers();
  return (
    <div className="max-w-2xl space-y-4">
      {ANSWER_SLOTS.map(({ id, label, prompt }) => (
        <label key={id} className="block">
          <span className={LABEL}>{label} {prompt}</span>
          <textarea
            value={owner.values[id]}
            onChange={(e) => owner.setValue(id, e.target.value)}
            maxLength={MAX_ANSWER_LENGTH}
            rows={3}
            className="mt-2 w-full resize-y rounded-lg border bg-transparent px-3 py-2 font-space-grotesk text-base text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] md:text-sm"
            style={{ borderColor: `${colorValue}66` }}
          />
        </label>
      ))}
      <OwnerAnswersSave owner={owner} />
    </div>
  );
}

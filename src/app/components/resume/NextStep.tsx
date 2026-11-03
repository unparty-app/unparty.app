'use client';

import { useState } from 'react';
import { track } from '@vercel/analytics';
import { useTheme } from '../../contexts/ThemeContext';
import { InkCircle } from '../depend/ink';
import InkPath from './InkPath';
import LlmKeyControl from '../llm/LlmKeyControl';
import { useLlmKey } from '../llm/useLlmKey';
import type { PathStop } from './types';

interface NextStepProps {
  stops: PathStop[]; // Every project on the owner's path
  startingPoints: string[]; // "a brand", "a journal": from the projects' startsFrom
  label: string;
  canMatch?: boolean; // The owner has a model, so anyone can say it in their own words
}

interface Recommendation {
  start: PathStop;
  next: PathStop[];
  why?: string; // From a model, when matched from someone's own words
}

/**
 * Where to start, and where to go next (#624): "where are you starting
 * from?" over the owner's path. Picking a starting point asks
 * /api/recommendations, then lights up the project that suits it and the
 * projects it leads to on the path below, dimming the rest; the project to
 * start with breathes. Picking it again shows the whole path.
 *
 * Or in their own words: a model (the owner's, or the reader's own key)
 * picks the starting point and says why in a sentence. Without either, the
 * box waits for a key of their own.
 */
export default function NextStep({ stops, startingPoints, label, canMatch = false }: NextStepProps) {
  const { colorValue } = useTheme();
  const llmKey = useLlmKey();
  const [picked, setPicked] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [words, setWords] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // From their own words: a model picks the starting point (POST /api/recommendations)
  const match = async () => {
    const text = words.trim();
    if (!text || matching) return;
    setMatching(true);
    setMatchError(null);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...llmKey.headers() },
        body: JSON.stringify({ text }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMatchError(response.status === 501 ? 'pick a starting point above, or use your own key.' : data?.error ?? 'pick a starting point above.');
        return;
      }
      track('next_step_matched', { from: data.from, via: data.via });
      setPicked(data.from);
      setRecommendation(data);
    } catch {
      setMatchError('pick a starting point above.');
    } finally {
      setMatching(false);
    }
  };

  const choose = async (point: string) => {
    if (point === picked) {
      setPicked(null);
      setRecommendation(null);
      return;
    }
    setPicked(point);
    track('next_step_chosen', { from: point });
    try {
      const response = await fetch(`/api/recommendations?from=${encodeURIComponent(point)}`);
      setRecommendation(response.ok ? await response.json() : null);
    } catch {
      setRecommendation(null);
    }
  };

  const highlight = recommendation ? [recommendation.start.id, ...recommendation.next.map(stop => stop.id)] : undefined;

  return (
    <div>
      {startingPoints.length > 0 && (
        <div role="radiogroup" aria-label="Where are you starting from?" className="mb-10 flex flex-wrap gap-x-6 gap-y-3">
          {startingPoints.map(point => (
            <button
              key={point}
              type="button"
              role="radio"
              aria-checked={point === picked}
              onClick={() => choose(point)}
              className="relative px-1 font-vt323 text-xl transition-colors"
              style={{ color: point === picked ? 'var(--foreground)' : 'var(--text-muted)' }}
            >
              {point === picked && <InkCircle key={point} color={colorValue} className="absolute -inset-x-3 -inset-y-1" />}
              {point}
            </button>
          ))}
        </div>
      )}
      <form
        className="mb-10 flex flex-wrap items-center gap-3"
        onSubmit={event => {
          event.preventDefault();
          void match();
        }}
      >
        <input
          value={words}
          onChange={event => setWords(event.target.value.slice(0, 600))}
          placeholder="or say it in your own words"
          aria-label="Where you're starting from, in your own words"
          disabled={!canMatch && !llmKey.hasKey}
          className="min-w-0 flex-1 border-b bg-transparent py-2 font-space-grotesk text-base outline-none disabled:opacity-50"
          style={{ borderColor: colorValue }}
        />
        <button
          type="submit"
          disabled={!words.trim() || matching || (!canMatch && !llmKey.hasKey)}
          className="font-vt323 text-xl disabled:opacity-40"
          style={{ color: colorValue }}
        >
          {matching ? '…' : 'find it.'}
        </button>
        {matchError && (
          <p className="w-full font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>{matchError}</p>
        )}
      </form>
      <LlmKeyControl className="-mt-7 mb-10" />
      {recommendation?.why && (
        <p className="mb-8 max-w-2xl font-space-grotesk text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {recommendation.why}
        </p>
      )}
      <InkPath stops={stops} label={label} focus={recommendation?.start.id} highlight={highlight} />
      <p aria-live="polite" className="sr-only">
        {recommendation
          ? `Start with ${recommendation.start.name}${recommendation.next.length ? `, then ${recommendation.next.map(stop => stop.name).join(', ')}` : ''}.`
          : ''}
      </p>
    </div>
  );
}

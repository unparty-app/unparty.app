"use client";

import { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FOUNDER_ANSWERS, WORD_TYPES } from '@/app/constants/organization';
import BuildTypePicker from './BuildTypePicker';
import InkWords from './resume/InkWords';
import { useSiteWords, wordField } from './YourWords';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';

type Saved = { applied: 'now' } | { applied: 'after-deploy'; prUrl: string };

/**
 * WordTags - the tag step (/admin → Your words, #389): the words this site
 * keeps using (InkWords), each one tagged with the kind of build it points
 * to. Pick words in the field, then a kind: they carry it beside them, and a
 * worksheet's picked words classify by it (src/lib/word-types.ts). Saved to
 * FoundersConfig `wordTypes`, so a copy's owner tags their own words.
 */
export default function WordTags() {
  const { colorValue } = useTheme();
  const [tags, setTags] = useState<Record<string, string>>(WORD_TYPES);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState<string | null>(null);
  const site = useSiteWords();
  // Their answers stay in reach: on a site with a lot of writing, three short
  // answers would never make the top of the cloud
  const answers = Object.values(FOUNDER_ANSWERS).join(' ');
  const field = useMemo(() => (answers.trim() ? wordField(site, answers, new Set(), 60).field : undefined), [site, answers]);

  const toggle = (word: string) => setPicked((now) => (now.includes(word) ? now.filter((w) => w !== word) : [...now, word]));

  // Tag every picked word with `type`, or untag them with null, and save them all
  const tagPicked = async (type: string | null) => {
    const next = { ...tags };
    for (const word of picked) {
      if (type) next[word] = type;
      else delete next[word];
    }
    const before = tags;
    setTags(next);
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const r = await fetch('/api/admin/word-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wordTypes: next }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.line ? `${d.error}: ${d.line}` : d.error);
      setSaved(d);
      setPicked([]);
    } catch (e) {
      setTags(before);
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const tagged = Object.keys(tags).length;
  return (
    <div className="space-y-6">
      <InkWords limit={60} filter={false} selected={picked} onToggle={toggle} tags={tags} field={field} />

      <div>
        <p className={LABEL}>{picked.length ? `tag ${picked.length === 1 ? picked[0] : `${picked.length} words`} as` : 'pick words, then a kind of build'}</p>
        <BuildTypePicker disabled={!picked.length || saving} canUntag={picked.some((w) => tags[w]) && !saving} onPick={tagPicked} />
      </div>

      <p className="font-space-grotesk text-xs text-[var(--text-muted)]" aria-live="polite">
        {error ? (
          <span style={{ color: colorValue }}>{error}</span>
        ) : saving ? (
          'saving…'
        ) : saved?.applied === 'now' ? (
          `saved. ${tagged} ${tagged === 1 ? 'word' : 'words'} tagged, in your copy now.`
        ) : saved?.applied === 'after-deploy' ? (
          <>
            saved. live once{' '}
            <a href={saved.prUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>
              the change
            </a>{' '}
            deploys.
          </>
        ) : (
          `${tagged} ${tagged === 1 ? 'word' : 'words'} tagged. a worksheet's words point to the kind most of them carry.`
        )}
      </p>
    </div>
  );
}

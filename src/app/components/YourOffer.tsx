"use client";

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FOUNDER } from '@/app/constants/organization';
import type { FounderOfferLine } from '@/app/constants/organization';
import { iconByName } from './icons/byName';
import { DRAWABLE_ICONS } from './icons/drawable';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
const MAX_LINES = 6;

type Saved = { applied: 'now' } | { applied: 'after-deploy'; prUrl: string };
type Line = { title: string; text: string; href: string; icon: string };

const toRows = (lines: FounderOfferLine[] | undefined): Line[] => (lines ?? []).map((l) => ({ title: l.title, text: l.text, href: l.href ?? '', icon: l.icon ?? '' }));

/** One list of lines, each a title, its text and (for `links`) where its proof is */
function Lines({ label, hint, rows, setRows, links, titleHint }: {
  label: string;
  hint: string;
  rows: Line[];
  setRows: (rows: Line[]) => void;
  links: boolean;
  titleHint: string;
}) {
  const { colorValue } = useTheme();
  const field = 'w-full rounded-lg border bg-transparent px-3 py-2 font-space-grotesk text-base text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] md:text-sm';
  const set = (k: number, patch: Partial<Line>) => setRows(rows.map((r, i) => (i === k ? { ...r, ...patch } : r)));
  return (
    <fieldset className="space-y-3">
      <legend className={LABEL}>{label}</legend>
      <p className="font-space-grotesk text-xs text-[var(--text-muted)]">{hint}</p>
      {rows.map((r, k) => (
        <div key={k} className="space-y-2 border-l-2 pl-3" style={{ borderColor: `${colorValue}40` }}>
          <div className="flex items-center gap-2">
            {/* The hand-drawn icon that leads the line, by name, shown as it's typed */}
            <span className="grid size-9 shrink-0 place-items-center">{(() => { const Icon = iconByName(r.icon); return Icon ? <Icon size={22} color={colorValue} /> : null; })()}</span>
            <input value={r.icon} onChange={(e) => set(k, { icon: e.target.value })} list="offer-icons" placeholder="icon" aria-label={`${label}, line ${k + 1}: icon`} className={`${field} w-28 shrink-0`} style={{ borderColor: `${colorValue}40` }} />
            <input value={r.title} onChange={(e) => set(k, { title: e.target.value })} maxLength={80} placeholder={titleHint} aria-label={`${label}, line ${k + 1}: title`} className={field} style={{ borderColor: `${colorValue}66` }} />
            <button type="button" onClick={() => setRows(rows.filter((_, i) => i !== k))} aria-label={`Remove line ${k + 1}`} className="grid size-9 shrink-0 place-items-center rounded-full border font-google-sans-code text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]" style={{ borderColor: `${colorValue}40` }}>
              ×
            </button>
          </div>
          <textarea value={r.text} onChange={(e) => set(k, { text: e.target.value })} maxLength={280} rows={2} placeholder="the rest of the line" aria-label={`${label}, line ${k + 1}: text`} className={`${field} resize-y`} style={{ borderColor: `${colorValue}66` }} />
          {links && (
            <input value={r.href} onChange={(e) => set(k, { href: e.target.value })} placeholder="where its proof is: /build, https://… (optional)" aria-label={`${label}, line ${k + 1}: link`} className={field} style={{ borderColor: `${colorValue}40` }} />
          )}
        </div>
      ))}
      {rows.length < MAX_LINES && (
        <button type="button" onClick={() => setRows([...rows, { title: '', text: '', href: '', icon: '' }])} className="font-google-sans-code text-xs transition-opacity hover:opacity-70" style={{ color: colorValue }}>
          + add a line
        </button>
      )}
    </fieldset>
  );
}

/**
 * YourOffer - what the owner does, how it translates for each kind of reader,
 * and the ask for them (/admin → Your offer): FoundersConfig founder.offer and
 * founder.hire, shown under their bio on /founders, so someone who finds the
 * work can see what the owner can do for them, and reach them, not only take
 * a copy. Empty, /founders shows none of it.
 */
export default function YourOffer() {
  const { colorValue } = useTheme();
  const [does, setDoes] = useState<Line[]>(() => toRows(FOUNDER.offer?.does));
  const [translates, setTranslates] = useState<Line[]>(() => toRows(FOUNDER.offer?.translates));
  const [hire, setHire] = useState({ label: FOUNDER.hire?.label ?? '', href: FOUNDER.hire?.href ?? '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const r = await fetch('/api/admin/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: { does, translates }, hire }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.line ? `${d.error}: ${d.line}` : d.error);
      setSaved(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-lg border bg-transparent px-3 py-2 font-space-grotesk text-base text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] md:text-sm';

  return (
    <div className="max-w-2xl space-y-8">
      <datalist id="offer-icons">{DRAWABLE_ICONS.map((name) => <option key={name} value={name} />)}</datalist>
      <Lines label="what I do." hint="an icon, a bold title, then a few words: a skill a line, linked to its proof. measured numbers stay true as the work grows: {projects}, {shipped}, {hours}, {first}, {releases}, {pieces}, {icons}, {components}, {prs}, {issues}, {year}, and across your account {orgPrs}, {orgIssues}, {repos}." rows={does} setRows={setDoes} links titleHint="product, end to end." />
      <Lines label="how it translates." hint="what your work means for each kind of reader: an icon, who, then a few words, linked to where they'd go next." rows={translates} setRows={setTranslates} links titleHint="for a founder or small business:" />

      <fieldset className="space-y-2">
        <legend className={LABEL}>the ask for you</legend>
        <p className="font-space-grotesk text-xs text-[var(--text-muted)]">a second button beside &quot;build yours&quot;, for people who want you. leave both empty to ask only for the copy.</p>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <input value={hire.label} onChange={(e) => setHire({ ...hire, label: e.target.value })} maxLength={40} placeholder="work with me" aria-label="The ask's label" className={field} style={{ borderColor: `${colorValue}66` }} />
          <input value={hire.href} onChange={(e) => setHire({ ...hire, href: e.target.value })} placeholder="mailto:you@…, https://cal…, or /contact" aria-label="Where the ask goes" className={field} style={{ borderColor: `${colorValue}66` }} />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center rounded-full border px-4 font-google-sans-code text-xs transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          style={{ borderColor: colorValue, color: colorValue }}
        >
          {saving ? 'saving…' : 'save your offer'}
        </button>
        <p className="font-space-grotesk text-xs text-[var(--text-muted)]" aria-live="polite">
          {error ? (
            <span style={{ color: colorValue }}>{error}</span>
          ) : saved?.applied === 'now' ? (
            'saved. on /founders now.'
          ) : saved?.applied === 'after-deploy' ? (
            <>
              saved. live once{' '}
              <a href={saved.prUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>
                the change
              </a>{' '}
              deploys.
            </>
          ) : (
            'it opens /founders, under your bio.'
          )}
        </p>
      </div>
    </div>
  );
}

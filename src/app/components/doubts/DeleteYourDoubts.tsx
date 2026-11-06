'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/auth-stub.client';
import { useTheme } from '../../contexts/ThemeContext';
import { inkOn } from '../build-yours/BuildYours';
import { RING_PATH } from '../brand-colors/handDrawn';

const SECONDS = 120;
const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
const QUIET_LINK = 'font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]';

type Stage = 'start' | 'write' | 'delete' | 'done';
type Save = 'idle' | 'saving' | 'saved' | 'error';

/**
 * DeleteYourDoubts - the unppp exercise (iOS SeeMe) on the web: two minutes
 * to write every doubt down, then delete them one by one.
 *
 * The timer is the brand rings' hand-drawn ring, unwinding as the time runs;
 * each doubt rises in as it's written; deleting one draws a pen stroke
 * through it (globals.css .doubt-struck). When they're all gone, the founder
 * (an admin) can keep them as their doubts: private (Clerk privateMetadata,
 * /api/admin/doubts), shown only to them on /founders with every place each
 * one turns up in their writing. Anyone else: nothing is saved, nothing is
 * sent. The journal doesn't talk back.
 */
export default function DeleteYourDoubts() {
  const { colorValue } = useTheme();
  const { user } = useUser();
  const isFounder = user?.publicMetadata?.role === 'admin';
  const [stage, setStage] = useState<Stage>('start');
  const [left, setLeft] = useState(SECONDS);
  const [draft, setDraft] = useState('');
  const [doubts, setDoubts] = useState<{ text: string; deleted: boolean }[]>([]);
  const [save, setSave] = useState<Save>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // The two minutes
  useEffect(() => {
    if (stage !== 'write') return;
    const timer = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the two minutes running out moves the exercise on: a step driven by the timer
    if (stage === 'write' && left === 0) setStage('delete');
  }, [stage, left]);
  // All deleted: done
  useEffect(() => {
    if (stage === 'delete' && doubts.length > 0 && doubts.every((d) => d.deleted)) {
      const timer = window.setTimeout(() => setStage('done'), 900);
      return () => window.clearTimeout(timer);
    }
  }, [stage, doubts]);

  const start = () => {
    setDoubts([]);
    setLeft(SECONDS);
    setSave('idle');
    setStage('write');
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };
  const add = () => {
    const text = draft.trim().replace(/\s+/g, ' ');
    if (text) setDoubts((list) => [...list, { text, deleted: false }]);
    setDraft('');
  };
  const strike = (index: number) => setDoubts((list) => list.map((d, i) => (i === index ? { ...d, deleted: true } : d)));
  const keep = async () => {
    setSave('saving');
    try {
      const res = await fetch('/api/admin/doubts', { method: 'POST', body: JSON.stringify({ add: doubts.map((d) => d.text) }) });
      setSave(res.ok ? 'saved' : 'error');
    } catch {
      setSave('error');
    }
  };

  const ink = inkOn(colorValue);
  const pill = 'rounded-full px-6 py-2.5 font-google-sans-code text-xs uppercase tracking-wider transition-transform duration-200 hover:-translate-y-px disabled:opacity-60 motion-reduce:transition-none';
  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-start gap-6 text-left">
      {stage === 'start' && (
        <>
          <p className="max-w-md font-space-grotesk text-sm leading-relaxed text-[var(--text-muted)]">
            two minutes. write every doubt down, about your idea, your progress, your potential. then delete them.
          </p>
          <button type="button" onClick={start} className={pill} style={{ backgroundColor: colorValue, color: ink }}>
            start the two minutes
          </button>
        </>
      )}

      {stage === 'write' && (
        <>
          <div className="flex items-center gap-5">
            {/* The ring unwinds as the time runs */}
            <svg viewBox="0 0 64 64" className="size-20 shrink-0" role="timer" aria-label={`${time} left`}>
              <path d={RING_PATH} fill="none" stroke="var(--background-highlight)" strokeWidth={2} strokeLinecap="round" />
              <path
                d={RING_PATH}
                pathLength={1}
                fill="none"
                stroke={colorValue}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeDasharray={1}
                strokeDashoffset={1 - left / SECONDS}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <text x="32" y="37" textAnchor="middle" className="font-vt323" fontSize="15" fill="var(--foreground)">{time}</text>
            </svg>
            <p className={LABEL}>write until the ring runs out</p>
          </div>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            maxLength={80}
            placeholder="a doubt, then enter"
            aria-label="A doubt"
            className="w-full max-w-md rounded-full border bg-transparent px-4 py-2.5 font-space-grotesk text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none"
            style={{ borderColor: colorValue }}
          />
          <DoubtList doubts={doubts} />
          {doubts.length > 0 && (
            <button type="button" onClick={() => { add(); setStage('delete'); }} className={QUIET_LINK}>
              done writing
            </button>
          )}
        </>
      )}

      {stage === 'delete' && (
        <>
          <p className={LABEL}>{doubts.length === 0 ? 'nothing to delete' : 'now delete them. tap each one'}</p>
          <DoubtList doubts={doubts} onStrike={strike} />
          {doubts.length === 0 ? (
            <button type="button" onClick={start} className={QUIET_LINK}>again</button>
          ) : (
            <button type="button" onClick={() => setDoubts((list) => list.map((d) => ({ ...d, deleted: true })))} className={QUIET_LINK}>
              delete them all
            </button>
          )}
        </>
      )}

      {stage === 'done' && (
        <>
          <p className="font-vt323 text-4xl leading-none text-[var(--foreground)]">
            {doubts.length} {doubts.length === 1 ? 'doubt' : 'doubts'}, deleted.
          </p>
          {isFounder ? (
            save === 'saved' ? (
              <p className="max-w-md font-space-grotesk text-sm text-[var(--text-muted)]">
                kept. they&apos;re on{' '}
                <Link href="/founders#words" className="underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]">your resume</Link>
                , only for you, with every place each one turns up in your writing.
              </p>
            ) : (
              <>
                <p className="max-w-md font-space-grotesk text-sm text-[var(--text-muted)]">
                  keep them as your doubts: only you see them, on your resume, with every place each one turns up in your writing.
                </p>
                <button type="button" onClick={keep} disabled={save === 'saving'} className={pill} style={{ backgroundColor: colorValue, color: ink }}>
                  {save === 'saving' ? 'keeping…' : 'keep my doubts'}
                </button>
                {save === 'error' && <p className={LABEL}>that didn&apos;t save. try again.</p>}
              </>
            )
          ) : (
            <p className="max-w-md font-space-grotesk text-sm text-[var(--text-muted)]">gone. nothing was saved and nothing was sent.</p>
          )}
          <button type="button" onClick={start} className={QUIET_LINK}>again</button>
        </>
      )}
    </div>
  );
}

function DoubtList({ doubts, onStrike }: { doubts: { text: string; deleted: boolean }[]; onStrike?: (index: number) => void }) {
  const { colorValue } = useTheme();
  if (doubts.length === 0) return null;
  return (
    <ul className="flex w-full max-w-md flex-col gap-2">
      {doubts.map((doubt, i) => (
        <li key={`${i}-${doubt.text}`} className="doubt-in">
          <button
            type="button"
            onClick={() => onStrike?.(i)}
            disabled={!onStrike || doubt.deleted}
            aria-label={doubt.deleted ? `${doubt.text}, deleted` : onStrike ? `Delete: ${doubt.text}` : doubt.text}
            className={`doubt relative text-left font-vt323 text-2xl leading-tight transition-opacity duration-500 ${doubt.deleted ? 'doubt-struck opacity-40' : 'text-[var(--foreground)]'} ${onStrike && !doubt.deleted ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            style={{ ['--strike' as string]: colorValue }}
          >
            {doubt.text}
          </button>
        </li>
      ))}
    </ul>
  );
}

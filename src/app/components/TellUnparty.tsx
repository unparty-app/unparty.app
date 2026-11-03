'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { BuildBrain, BUILD_YOURS_DONE, inkOn } from './build-yours/BuildYours';
import type { BuildCard } from '@/lib/builds';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';

interface Told {
  number?: number;
  status?: string;
  sentAt?: string;
}

/**
 * Tell unparty you built yours (#589), the onboarding's ending: the card
 * unparty.app will list, exactly as it will show (only what the site already
 * shows everyone), an email if the owner wants release notices, and one
 * button. Nothing is ever sent on its own. Once told: the build's number, and
 * a way to take it off. unparty.app itself receives builds, so it points to
 * /builds instead
 */
export default function TellUnparty() {
  const { colorValue } = useTheme();
  const [card, setCard] = useState<BuildCard | null>(null);
  const [told, setTold] = useState<Told | null>(null);
  const [receives, setReceives] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/build')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setCard(d.card);
        setTold(d.told);
        setReceives(d.receives);
      })
      .catch(() => {});
  }, []);

  const send = async (method: 'POST' | 'DELETE') => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/build', { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ email }) : undefined });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setTold(d.told);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach unparty.app');
    } finally {
      setBusy(false);
    }
  };

  if (receives) return <ReleaseNotice />;
  if (!card) return <p className={LABEL}>opening…</p>;

  const color = card.colors[0] ?? colorValue;
  const ink = inkOn(color);
  return (
    <div className="build-yours space-y-5" style={BUILD_YOURS_DONE}>
      <div className="flex items-center gap-4">
        <BuildBrain color={colorValue} ink="var(--foreground)" className="size-14 shrink-0" />
        <p className="font-vt323 text-3xl leading-none text-[var(--foreground)]">{told ? `build #${told.number ?? '…'}.` : 'you built yours.'}</p>
      </div>

      {/* The card, as unparty.app will list it */}
      <div className="max-w-sm overflow-hidden rounded-xl shadow-lg" style={{ backgroundColor: color, color: ink }}>
        {card.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.cover} alt="" className="aspect-[16/9] w-full object-cover" />
        )}
        <div className="space-y-2 p-4">
          <p className="font-vt323 text-2xl uppercase leading-none">{card.name}</p>
          <p className="font-space-grotesk text-sm leading-snug opacity-85">{card.tagline}</p>
          <p className="font-google-sans-code text-[10px] uppercase tracking-wide opacity-75">{card.url.replace(/^https?:\/\//, '')}</p>
          {card.colors.length > 1 && (
            <span className="flex gap-1">
              {card.colors.map((c) => <span key={c} className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }} />)}
            </span>
          )}
          {card.projects.length > 0 && <p className="font-space-grotesk text-xs opacity-85">{card.projects.map((p) => p.name).join(' · ')}</p>}
        </div>
      </div>
      <p className={LABEL}>only what your site already shows everyone. nothing is sent until you send it.</p>

      {told ? (
        <div className="space-y-3">
          <p className="font-space-grotesk text-sm text-[var(--foreground)]">
            {told.status === 'APPROVED' ? (
              <>
                you’re on <a href="https://www.unparty.app/builds" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>unparty.app/builds</a>.
              </>
            ) : (
              'counted. it shows on unparty.app/builds once unparty says hello.'
            )}
          </p>
          <button type="button" onClick={() => send('DELETE')} disabled={busy} className={`${LABEL} transition-colors hover:text-[var(--foreground)] disabled:opacity-50`}>
            {busy ? 'taking it off…' : 'take me off'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className={LABEL}>release notices, if you want them</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yours.com (optional)"
              className="mt-1 w-full max-w-sm rounded-lg border bg-transparent px-3 py-2 font-space-grotesk text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2"
              style={{ borderColor: `${colorValue}40`, outlineColor: colorValue }}
            />
          </label>
          <button
            type="button"
            onClick={() => send('POST')}
            disabled={busy}
            className="rounded-full px-5 py-2.5 font-google-sans-code text-sm uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: colorValue, color: inkOn(colorValue) }}
          >
            {busy ? 'telling unparty…' : 'tell unparty'}
          </button>
        </div>
      )}
      {error && <p className="font-space-grotesk text-sm" style={{ color: colorValue }}>{error}</p>}
    </div>
  );
}

/**
 * On unparty.app, where builds are told: the builds, and a release notice to
 * every one that left an email (/api/admin/builds/notify, through Loops)
 */
function ReleaseNotice() {
  const { colorValue } = useTheme();
  const [version, setVersion] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch('/api/admin/builds/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version, link, notes }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(`sent to ${d.sent} of ${d.of} builds that left an email.`);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  };
  const field = 'w-full rounded-lg border bg-transparent px-3 py-2 font-space-grotesk text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]';

  return (
    <div className="max-w-md space-y-3">
      <p className="font-space-grotesk text-sm text-[var(--foreground)]">
        this is where builds are told. <Link href="/builds" className="underline underline-offset-4" style={{ color: colorValue }}>see them →</Link>
      </p>
      <p className={LABEL}>a release notice, to every build that left an email</p>
      <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="version, like 1.2.0" className={field} style={{ borderColor: `${colorValue}40` }} />
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https:// link to what changed" className={field} style={{ borderColor: `${colorValue}40` }} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="what changed, in a line or two" rows={3} className={field} style={{ borderColor: `${colorValue}40` }} />
      <button type="button" onClick={send} disabled={busy || !version.trim()} className="rounded-full px-5 py-2.5 font-google-sans-code text-sm uppercase tracking-wider disabled:opacity-50" style={{ backgroundColor: colorValue, color: inkOn(colorValue) }}>
        {busy ? 'sending…' : 'send the notice'}
      </button>
      {result && <p className="font-space-grotesk text-sm text-[var(--foreground)]">{result}</p>}
    </div>
  );
}

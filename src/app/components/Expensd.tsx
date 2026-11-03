'use client';

import { useEffect, useRef, useState } from 'react';
import { BASELINE } from '@/app/constants/organization';
import { buildCost, hourlyRate } from '@/lib/baseline';
import { parseTracked, TRACKED_KEY, writeTracked, type TrackedEntry } from '@/lib/tracked-hours';
import { useTheme } from '../contexts/ThemeContext';
import { useInView } from '../hooks/useInView';
import ActionPill from './build-yours/ActionPill';
import { BUILD_YOURS_DONE } from './build-yours/BuildYours';
import { InkUnderline } from './depend/ink';
import { Download, Hammer, Play, Plus, Square, X } from './icons';

/**
 * Expensd - keep time on what you build, and see what it's worth.
 *
 * Goal Budget's sibling, in the same band and hand. The left column is the
 * clock: TIME., a live h:mm:ss while it runs (else the hours so far), what
 * they're worth at an hour's rate (from FoundersConfig baseline, editable in
 * place), then the actions as pills: start / stop written by hand, add time
 * you've already put in, price yours (Goal Budget follows these hours,
 * ?hours=tracked) and an invoice to download. The right column lists the
 * entries, newest first, each removable.
 *
 * Entries stay in the browser (src/lib/tracked-hours.ts): they survive a
 * reload, a running entry picks back up, and Goal Budget reads them live.
 */

// An hour of the work, from FoundersConfig baseline (market pay ÷ hours a
// year), to the cent; with no baseline the rate starts empty
const BASELINE_RATE = BASELINE ? Math.round(hourlyRate(BASELINE) * 100) / 100 : 0;

interface TimeEntry {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isManual?: boolean;
}

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hoursOf = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
// An entry's length: minutes under an hour, so a short one doesn't read 0.00 h
const length = (h: number) => (h < 1 / 60 ? '<1 min' : h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(2)} h`);
const day = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const Expensd = () => {
  const { colorValue } = useTheme();
  const [rootRef, seen] = useInView<HTMLDivElement>();
  const [rate, setRate] = useState<number>(BASELINE_RATE);
  // The rate as typed, so 72.60 keeps its last zero
  const [rateText, setRateText] = useState(BASELINE_RATE ? BASELINE_RATE.toFixed(2) : '');
  const [isTracking, setIsTracking] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [manual, setManual] = useState({ date: new Date().toISOString().split('T')[0], hours: '' });

  // The entries live in the browser (src/lib/tracked-hours.ts), so they
  // survive a reload and Goal Budget can price a build from them. Loaded once,
  // picking a running entry back up; saved whenever they change (a running
  // entry's hours aren't stored: readers count it up to now). Saving waits
  // until the stored entries are back in state, or the first (empty) render
  // would overwrite them
  const [restored, setRestored] = useState(false);
  const lastSaved = useRef<string | null>(null);
  useEffect(() => {
    let stored: TrackedEntry[] = [];
    try {
      stored = parseTracked(window.localStorage.getItem(TRACKED_KEY));
    } catch {
      // storage blocked: start empty
    }
    const entries: TimeEntry[] = stored.map((e) => {
      const startTime = new Date(e.start);
      const endTime = e.end ? new Date(e.end) : undefined;
      const duration = e.hours ?? (Date.now() - startTime.getTime()) / 3_600_000;
      return { startTime, endTime, duration, isManual: e.manual };
    });
    const running = entries[entries.length - 1];
    setTimeEntries(entries);
    if (running && !running.endTime && !running.isManual) {
      setCurrentEntry(running);
      setIsTracking(true);
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    const entries: TrackedEntry[] = timeEntries.map((e) => ({
      start: e.startTime.toISOString(),
      ...(e.endTime ? { end: e.endTime.toISOString() } : {}),
      ...(e.endTime || e.isManual ? { hours: e.duration ?? 0 } : {}),
      ...(e.isManual ? { manual: true } : {}),
    }));
    const json = JSON.stringify(entries);
    if (json === lastSaved.current) return;
    lastSaved.current = json;
    writeTracked(entries);
  }, [timeEntries, restored]);

  // The running entry counts up each second
  useEffect(() => {
    if (!isTracking || !currentEntry) return;
    const interval = setInterval(() => {
      setTimeEntries((prev) =>
        prev.map((e) => (e === currentEntry || (e.startTime === currentEntry.startTime && !e.endTime) ? { ...e, duration: (Date.now() - e.startTime.getTime()) / 3_600_000 } : e))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isTracking, currentEntry]);

  const start = () => {
    const entry: TimeEntry = { startTime: new Date(), duration: 0 };
    setTimeEntries((prev) => [...prev, entry]);
    setCurrentEntry(entry);
    setIsTracking(true);
  };

  const stop = () => {
    const endTime = new Date();
    setTimeEntries((prev) =>
      prev.map((e) => (!e.endTime && !e.isManual ? { ...e, endTime, duration: (endTime.getTime() - e.startTime.getTime()) / 3_600_000 } : e))
    );
    setCurrentEntry(null);
    setIsTracking(false);
  };

  const add = () => {
    const hours = parseFloat(manual.hours);
    if (!Number.isFinite(hours) || hours <= 0 || !manual.date) return;
    const startTime = new Date(`${manual.date}T09:00`);
    const endTime = new Date(startTime.getTime() + hours * 3_600_000);
    setTimeEntries((prev) => [...prev, { startTime, endTime, duration: hours, isManual: true }]);
    setManual({ date: new Date().toISOString().split('T')[0], hours: '' });
    setAdding(false);
  };

  const remove = (entry: TimeEntry) => {
    if (!entry.endTime && !entry.isManual) {
      setCurrentEntry(null);
      setIsTracking(false);
    }
    setTimeEntries((prev) => prev.filter((e) => e !== entry));
  };

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalAmount = totalHours * rate;
  const running = isTracking && currentEntry ? timeEntries.find((e) => !e.endTime && !e.isManual) : undefined;

  const invoice = () => {
    const lines = [
      'TIME.',
      '',
      `Rate per hour: ${money(rate)}`,
      `Hours: ${totalHours.toFixed(2)}`,
      `Amount: ${money(totalAmount)}`,
      '',
      ...timeEntries.map(
        (e) =>
          `${e.startTime.toLocaleString()} – ${e.endTime ? e.endTime.toLocaleString() : 'running'} · ${(e.duration ?? 0).toFixed(2)} h · ${money((e.duration ?? 0) * rate)}${e.isManual ? ' · by hand' : ''}`
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const chip =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--foreground)] transition-colors hover:bg-[var(--background-highlight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  // By when the time was put in, newest first
  const newestFirst = [...timeEntries].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return (
    <div
      ref={rootRef}
      className="build-yours my-12 w-screen mx-[calc(50%-50vw)] px-4 py-12 text-left sm:px-6 lg:px-12"
      data-paused={!seen || undefined}
      style={{ backgroundColor: `${colorValue}08`, ...BUILD_YOURS_DONE }}
    >
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        {/* The clock */}
        <div>
          <p className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>
            TIME. <span className="ml-1 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{running ? 'running' : 'so far'}</span>
          </p>
          <p className="relative mt-2 inline-block font-vt323 text-5xl leading-tight tabular-nums sm:text-6xl" style={{ color: colorValue }} aria-live="off">
            {running ? clock(Date.now() - running.startTime.getTime()) : `${hoursOf(totalHours)} h`}
            <InkUnderline color={colorValue} className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-2/3" />
          </p>

          <p className="mt-6 flex flex-wrap items-baseline gap-x-2 font-space-grotesk text-sm text-[var(--foreground)]">
            <span className="font-vt323 text-3xl leading-none" style={{ color: colorValue }}>{money(totalAmount)}</span>
            <span>at</span>
            <label className="relative inline-flex items-baseline">
              <span className="font-vt323 text-xl" style={{ color: colorValue }}>$</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={rateText}
                onChange={(e) => {
                  setRateText(e.target.value);
                  setRate(Number(e.target.value) || 0);
                }}
                aria-label="your hourly rate"
                className="w-16 bg-transparent font-vt323 text-xl leading-none outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                style={{ color: colorValue }}
              />
              <InkUnderline color={colorValue} className="pointer-events-none absolute -bottom-1 left-0 h-2 w-full" />
            </label>
            <span>an hour</span>
          </p>
          {BASELINE_RATE > 0 && rate === BASELINE_RATE && (
            <p className="mt-2 font-space-grotesk text-xs text-[var(--text-muted)]">an hour of the work, from your baseline.</p>
          )}

          {/* What to do: keep time, add what you already put in, price it, bill it */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {running ? (
              <ActionPill verb="stop" onClick={stop} icon={Square} color={colorValue} label="Stop the clock" />
            ) : (
              <ActionPill verb="start" onClick={start} icon={Play} color={colorValue} label="Start the clock" />
            )}
            <button type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding} className={chip} style={{ borderColor: colorValue, outlineColor: colorValue }}>
              <Plus size={13} color={colorValue} />
              add time
            </button>
          </div>

          {adding && (
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <label className="relative flex items-baseline gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.25"
                  autoFocus
                  value={manual.hours}
                  onChange={(e) => setManual((m) => ({ ...m, hours: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && add()}
                  placeholder="0"
                  aria-label="hours to add"
                  className="w-16 bg-transparent font-vt323 text-2xl leading-none outline-none placeholder:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{ color: colorValue }}
                />
                <InkUnderline color={colorValue} className="pointer-events-none absolute -bottom-1.5 left-0 h-2 w-16" />
                <span className="font-space-grotesk text-xs text-[var(--text-muted)]">hours on</span>
              </label>
              <input
                type="date"
                value={manual.date}
                onChange={(e) => setManual((m) => ({ ...m, date: e.target.value }))}
                aria-label="the day"
                className="bg-transparent font-google-sans-code text-xs uppercase tracking-wide text-[var(--foreground)] outline-none"
              />
              <button type="button" onClick={add} className={chip} style={{ borderColor: colorValue, outlineColor: colorValue }}>
                add
              </button>
            </div>
          )}

          {totalHours > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {BASELINE && (
                <ActionPill
                  verb="price yours"
                  note={`$${Math.round(buildCost(totalHours, BASELINE).total).toLocaleString()}`}
                  href="/goal-budget?hours=tracked"
                  icon={Hammer}
                  color={colorValue}
                  label={`Price yours from the ${totalHours.toFixed(2)} hours you've tracked`}
                />
              )}
              <button type="button" onClick={invoice} className={chip} style={{ borderColor: colorValue, outlineColor: colorValue }}>
                <Download size={13} color={colorValue} />
                invoice
              </button>
            </div>
          )}
        </div>

        {/* The entries */}
        <div className="min-w-0">
          <p className="border-b pb-3 font-vt323 text-xl leading-none" style={{ color: colorValue, borderColor: `${colorValue}33` }}>
            ENTRIES. <span className="ml-1 text-[var(--text-muted)]">{timeEntries.length}</span>
          </p>
          {newestFirst.length === 0 ? (
            <p className="pt-3 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
              nothing tracked yet. start the clock, or add time you&apos;ve already put in.
            </p>
          ) : (
            <ol>
              {newestFirst.map((entry) => {
                const live = !entry.endTime && !entry.isManual;
                return (
                  <li key={`${entry.startTime.getTime()}-${entry.isManual ? 'm' : 't'}`} className="flex items-center gap-4 border-b py-3" style={{ borderColor: `${colorValue}20` }}>
                    <span className="w-16 shrink-0 font-vt323 text-xl leading-none" style={{ color: colorValue }}>{day(entry.startTime)}</span>
                    <span className="min-w-0 flex-1 font-space-grotesk text-xs text-[var(--text-muted)]">
                      {entry.isManual ? 'by hand' : `${time(entry.startTime)} – ${entry.endTime ? time(entry.endTime) : 'now'}`}
                    </span>
                    <span className="font-google-sans-code text-xs tabular-nums text-[var(--foreground)]">{length(entry.duration ?? 0)}</span>
                    <span className="hidden w-20 text-right font-google-sans-code text-xs tabular-nums text-[var(--foreground)] sm:inline">{money((entry.duration ?? 0) * rate)}</span>
                    <button
                      type="button"
                      onClick={() => remove(entry)}
                      aria-label={`remove ${live ? 'the running entry' : `${(entry.duration ?? 0).toFixed(2)} hours on ${day(entry.startTime)}`}`}
                      className="rounded-full p-1 transition-opacity hover:opacity-70"
                      style={{ color: colorValue }}
                    >
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expensd;

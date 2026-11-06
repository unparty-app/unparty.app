'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useInView } from '../hooks/useInView';
import { useAuth } from '@/lib/auth-stub.client';
import { useLocalStorageValue, writeLocalStorage } from '@/hooks/useLocalStorage';
import { readStackParams, stackSearchParams } from '@/utils/dependCosts';
import { GOALS, findGoal, firstGoal, goalPath, type Goal, type GoalPath } from '@/utils/goalPaths';
import { baselineProjects, buildCost, hourlyRate } from '@/lib/baseline';
import { useTrackedHours } from '@/lib/tracked-hours';
import { BASELINE } from '../constants/organization';
import { describeBaselineProject } from '../utils/baselineProject';
import SleekTabs from './SleekTabs';
import Pager from './depend/Pager';
import UnpppCircle from './UnpppCircle';
import { InkCircle, InkRing, InkUnderline } from './depend/ink';
import { Cloud, Hammer, Lightbulb, ListChecks, X, type HandDrawnIconComponent } from './icons';

/**
 * GoalBudget - a goal, what it takes, and the path to it, one step at a time.
 *
 * Pick something to build (one of DependConfig's features: "sell a project")
 * or an upgrade (a service's paid plan: "move Clerk to pro"), and rename it as
 * yours. The left column, sticky from lg, is the goal as four steps, each
 * with its hand-drawn icon:
 *
 * - BUILD. what the work is worth: hours × an hour's pay, plus the LLM. The
 *   hours are a project like yours from the baseline (LIKE.), or your own
 *   count. Rate, LLM cost and projects all come from FoundersConfig
 *   `baseline` (src/lib/baseline.ts); with none, the step is left out
 * - RUN. what it adds on top of today's stack (and what comes with it, like
 *   selling moving Vercel to Pro)
 * - GET. what it unlocks
 * - PATH. how many milestones are done
 *
 * The right column has PATH. (the milestones), LIKE. (the baseline's
 * projects, paged) and GOALS. (every goal, paged).
 *
 * A milestone is a SETUP. step. Signed in, ticking it completes that step in
 * the person's progress (POST / DELETE /api/steps/<id>/complete), and a step
 * finished anywhere else shows ticked here (GET /api/steps/progress). Signed
 * out, the path shows but nothing ticks.
 *
 * Today's stack comes from the query string (the stack builder's "see them"
 * link, or /build), else the free plans every copy starts on. `?like=<id>`
 * (a project belt's "price yours.") picks that baseline project; `?hours=<n>&of=<name>`
 * (RepoFocus's) starts from a repo's measured hours. The chosen goal,
 * its name and the build's size stay in the browser. The path is computed in
 * src/utils/goalPaths.ts.
 */

const KEY = 'goal_budget';
const PAGE_SIZE = 6;
const STACK_ARTICLE = '/build';

type Tab = 'PATH' | 'LIKE' | 'GOALS';
interface Saved {
  goalId?: string;
  names?: Record<string, string>;
  // The build's size: a baseline project it's like, or the person's own hours
  like?: string;
  hours?: number;
  // Follow the hours tracked in Expensd (src/lib/tracked-hours.ts), live
  hoursFrom?: 'tracked';
  // What `hours` were measured from, when they came with a name (RepoFocus's
  // "price yours": a repo's hours from its commits)
  hoursOf?: string;
}

const money = (n: number) => `$${Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)}`;
const dollars = (n: number) => `$${Math.round(n).toLocaleString()}`;
const hoursOf = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

function parse(raw: string | null): Saved {
  try {
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function deltaLabel(path: GoalPath) {
  if (path.reached) return path.goal.kind === 'build' ? 'your stack builds it' : 'your stack is on it';
  const parts = [];
  if (path.monthlyDelta > 0) parts.push(`+${money(path.monthlyDelta)} a month`);
  if (path.yearlyDelta > 0) parts.push(`+${money(path.yearlyDelta)} a year`);
  parts.push(...path.extras.map((e) => `+ ${e}`));
  return parts.length ? parts.join(' · ') : 'no extra cost';
}

// A baseline project as the site knows it: its name and cover when it's one
// of the site's projects, else just what the baseline calls it
const describe = describeBaselineProject;

/**
 * A pen line the width of its box, for a project's hours. InkUnderline keeps
 * its stroke (and so its draw-in dash) in screen pixels, which breaks once
 * it's stretched across a row; this one scales with the row instead.
 */
function InkLine({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 6" preserveAspectRatio="none" fill="none" aria-hidden="true" className="block h-1.5 w-full overflow-visible">
      <path className="ink-draw" pathLength={1} d="M1 4C18 2.6 36 2.2 54 2.6 70 3 84 3.6 99 2.4" stroke={color} strokeWidth={2.4} strokeLinecap="round" opacity={0.6} />
    </svg>
  );
}

// Bring a part of the goal into view when it's off screen (on a phone, the
// goal and the tabs are a scroll apart)
function bring(el: HTMLElement | null) {
  if (!el) return;
  const { top, bottom } = el.getBoundingClientRect();
  if (top >= 0 && bottom <= window.innerHeight) return;
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
}

/** One of the goal's steps: its hand-drawn icon, its label, what it says. */
function GoalStep({ icon: Icon, label, color, children, stepRef }: { icon: HandDrawnIconComponent; label: string; color: string; children: React.ReactNode; stepRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={stepRef} className="flex scroll-mt-24 gap-3 border-t pt-4" style={{ borderColor: `${color}26` }}>
      <Icon size={22} color={color} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-vt323 text-lg leading-none" style={{ color }}>{label}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

function GoalBudgetInner() {
  const { colorValue } = useTheme();
  const params = useSearchParams();
  const { isSignedIn } = useAuth();
  const [rootRef, inView] = useInView<HTMLDivElement>();

  const choice = useMemo(() => readStackParams(new URLSearchParams(params.toString())), [params]);
  const hasStack = params.has('lens') || params.has('on');
  const saved = parse(useLocalStorageValue(KEY));
  // Kept between renders, so the goal's path below isn't worked out again each time
  const goal: Goal = useMemo(() => findGoal(saved.goalId) ?? firstGoal(choice), [saved.goalId, choice]);
  const nameOf = (g: Goal) => saved.names?.[g.id] || g.name;
  const path = useMemo(() => goalPath(goal, choice), [goal, choice]);
  const save = (next: Saved) => writeLocalStorage(KEY, JSON.stringify({ ...parse(localStorageNow()), ...next }));

  // The build: its size, from a project it's like or the person's own hours
  const likes = useMemo(() => (BASELINE ? baselineProjects(BASELINE) : []), []);
  // Arriving from a project's belt ("price yours.", ?like=<project id>): that
  // project is the one yours is like, until the visitor picks another
  const likeParam = params.get('like');
  useEffect(() => {
    if (likeParam && likes.some((p) => p.id === likeParam)) save({ like: likeParam, hours: undefined, hoursFrom: undefined, hoursOf: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [likeParam, likes]);
  const liked = likes.find((p) => p.id === saved.like);
  // Arriving from Expensd ("price yours", ?hours=tracked): follow the hours
  // tracked there, live, until the visitor types their own or picks a project
  const tracked = useTrackedHours();
  const following = saved.hoursFrom === 'tracked';
  // Arriving from RepoFocus ("price yours", ?hours=<n>&of=<repo>): a repo's
  // measured hours, named, until the visitor types their own or picks a project
  const hoursParam = params.get('hours');
  const ofParam = params.get('of');
  useEffect(() => {
    const measured = Number(hoursParam);
    if (hoursParam === 'tracked') save({ hoursFrom: 'tracked', hours: undefined, hoursOf: undefined });
    else if (measured > 0) save({ hours: measured, hoursOf: ofParam || undefined, hoursFrom: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoursParam, ofParam]);
  const ownHours = following ? (tracked > 0 ? tracked : null) : typeof saved.hours === 'number' && saved.hours > 0 ? saved.hours : null;
  const hours = ownHours ?? liked?.hours ?? null;
  const build = BASELINE && hours !== null ? buildCost(hours, BASELINE) : null;
  const rate = BASELINE ? hourlyRate(BASELINE) : 0;
  const mostHours = likes[0]?.hours ?? 0;

  // Milestones done, from the person's progress
  const [done, setDone] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const allStepIds = useMemo(() => [...new Set(GOALS.flatMap((g) => goalPath(g, choice).milestones.map((m) => m.stepId)))], [choice]);
  const loaded = useRef(false);
  useEffect(() => {
    if (!isSignedIn || loaded.current) return;
    loaded.current = true;
    fetch(`/api/steps/progress?ids=${allStepIds.join(',')}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { progress?: Record<string, { completed: boolean }> } | null) => {
        if (data?.progress) setDone(new Set(Object.entries(data.progress).filter(([, p]) => p.completed).map(([id]) => id)));
      })
      .catch(() => {});
  }, [isSignedIn, allStepIds]);

  const toggle = async (stepId: string) => {
    if (!isSignedIn) return;
    const wasDone = done.has(stepId);
    const next = new Set(done);
    if (wasDone) next.delete(stepId);
    else next.add(stepId);
    setDone(next);
    setNotice(null);
    const res = await fetch(`/api/steps/${stepId}/complete`, { method: wasDone ? 'DELETE' : 'POST' }).catch(() => null);
    if (!res?.ok) {
      setDone(done);
      setNotice(res?.status === 404 ? 'that SETUP. step isn’t on this copy yet (npm run db:seed:setup).' : 'couldn’t save that. try again.');
    }
  };

  const [tab, setTab] = useState<Tab>('PATH');
  const buildRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  // To the projects to pick from, and back to the goal once one is picked
  const openLike = () => {
    setTab('LIKE');
    bring(tabsRef.current);
  };
  // Paged lists turn like pages: forward from the right, back from the left
  const [pages, setPages] = useState({ LIKE: 0, GOALS: 0 });
  const [turn, setTurn] = useState(1);
  const pager = (list: 'LIKE' | 'GOALS', length: number) => {
    const pageCount = Math.max(1, Math.ceil(length / PAGE_SIZE));
    const page = Math.min(pages[list], pageCount - 1);
    const goTo = (n: number) => {
      const clamped = Math.max(0, Math.min(pageCount - 1, n));
      if (clamped === page) return;
      setTurn(clamped > page ? 1 : -1);
      setPages((p) => ({ ...p, [list]: clamped }));
    };
    return { page, pageCount, goTo };
  };

  // Goals still ahead first (to build, then to upgrade), the ones the stack
  // has already reached last
  const groupOf = (g: Goal) => (goalPath(g, choice).reached ? 'THERE' : g.kind === 'build' ? 'BUILD' : 'UPGRADE');
  const GROUP_LABEL = { BUILD: 'BUILD.', UPGRADE: 'UPGRADE.', THERE: 'ALREADY THERE.' } as const;
  const goalsByKind = (['BUILD', 'UPGRADE', 'THERE'] as const).flatMap((group) => GOALS.filter((g) => groupOf(g) === group));
  const goalPager = pager('GOALS', goalsByKind.length);
  const shownGoals = goalsByKind.slice(goalPager.page * PAGE_SIZE, goalPager.page * PAGE_SIZE + PAGE_SIZE);
  const likePager = pager('LIKE', likes.length);
  const shownLikes = likes.slice(likePager.page * PAGE_SIZE, likePager.page * PAGE_SIZE + PAGE_SIZE);

  const doneCount = path.milestones.filter((m) => done.has(m.stepId)).length;
  const reached = path.milestones.length > 0 && doneCount === path.milestones.length;
  const buildHref = `/build?${stackSearchParams({ lens: null, ...path.target })}`;
  const unlocks = [...path.unlocks.features, ...path.unlocks.components];
  const linkClass = 'font-google-sans-code text-[10px] uppercase tracking-wide transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

  const intro: Record<Tab, string> = {
    PATH: 'each milestone is a SETUP. step. tick it when it’s done.',
    LIKE: 'how big is what you’re building? pick the closest, or count your own hours.',
    GOALS: 'something to build, or a plan to grow into. pick one, then make the name yours.',
  };

  return (
    <div
      ref={rootRef}
      className="stack my-12 w-screen mx-[calc(50%-50vw)] px-4 py-12 text-left sm:px-6 lg:px-12"
      data-paused={!inView || undefined}
      style={{ backgroundColor: `${colorValue}08` }}
    >
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        {/* The goal, step by step, in view while you work the path */}
        {/* Sticky below the article's pinned headline when there is one
            (--hero-line, StickyHeroStack), else 11rem down */}
        <div className="lg:sticky lg:top-[calc(var(--hero-line,9rem)+2rem)] lg:self-start">
          <p className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>
            GOAL. <span className="ml-1 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{goal.kind === 'build' ? 'build' : 'upgrade'}</span>
          </p>
          <label className="relative mt-2 block">
            <span className="sr-only">name your goal</span>
            <input
              type="text"
              value={nameOf(goal)}
              onChange={(e) => save({ names: { ...(saved.names ?? {}), [goal.id]: e.target.value } })}
              placeholder={goal.name}
              className="w-full bg-transparent font-vt323 text-4xl leading-tight outline-none sm:text-5xl"
              style={{ color: colorValue }}
            />
            <InkUnderline key={goal.id} color={colorValue} className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-2/3" />
          </label>
          {saved.names?.[goal.id] && saved.names[goal.id] !== goal.name && (
            <p className="mt-2 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{goal.name}</p>
          )}

          <div className="mt-8 space-y-5">
            {BASELINE && (
              <GoalStep icon={Hammer} label="BUILD." color={colorValue} stepRef={buildRef}>
                {build ? (
                  <>
                    <p className="relative inline-block font-vt323 text-3xl leading-none" style={{ color: colorValue }}>
                      {dollars(build.total)}
                      <InkUnderline key={`${hours}`} color={colorValue} className="absolute -bottom-1.5 left-0 h-2 w-full" />
                    </p>
                    <p className="mt-3 font-space-grotesk text-xs leading-relaxed text-[var(--foreground)] md:text-sm">
                      {hoursOf(build.hours)} hours,{' '}
                      {ownHours !== null ? (following ? 'tracked as you go.' : saved.hoursOf ? <>like <span style={{ color: colorValue }}>{saved.hoursOf}</span>, measured from its commits.</> : 'by your count.') : <>like <span style={{ color: colorValue }}>{describe(liked!).name}</span>{describe(liked!).name.endsWith('.') ? '' : '.'}</>}{' '}
                      <button type="button" onClick={openLike} className={linkClass} style={{ color: colorValue, outlineColor: colorValue }}>
                        change →
                      </button>
                    </p>
                    <p className="mt-1 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
                      {hoursOf(build.hours)} h × {money(Math.round(rate * 100) / 100)} an hour, plus {money(BASELINE.llmPerHour)} an hour of LLM.
                    </p>
                  </>
                ) : (
                  <button type="button" onClick={openLike} className="text-left font-space-grotesk text-xs leading-relaxed text-[var(--foreground)] transition-opacity hover:opacity-70 md:text-sm">
                    what is the work worth? <span style={{ color: colorValue }}>pick what it’s like →</span>
                  </button>
                )}
              </GoalStep>
            )}

            <GoalStep icon={Cloud} label="RUN." color={colorValue}>
              <p className="font-vt323 text-2xl leading-none" style={{ color: colorValue }}>{deltaLabel(path)}</p>
              <p className="mt-2 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">
                on top of {hasStack ? 'your stack' : 'the free plans every copy starts on'}.{' '}
                <Link href={hasStack ? buildHref : STACK_ARTICLE} style={{ color: colorValue }}>
                  {hasStack ? 'see it in your build →' : 'pick your stack →'}
                </Link>
              </p>
              {path.comesWith.length > 0 && (
                <ul className="mt-2 space-y-1 font-space-grotesk text-xs leading-relaxed text-[var(--foreground)]">
                  {path.comesWith.map((c) => (
                    <li key={c.service}>
                      {c.service} moves to {c.plan}: <span className="text-[var(--text-muted)]">{c.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GoalStep>

            {unlocks.length > 0 && (
              <GoalStep icon={Lightbulb} label="GET." color={colorValue}>
                <p className="font-space-grotesk text-xs leading-relaxed text-[var(--foreground)] md:text-sm">
                  {unlocks.map((name, i) => (
                    <span key={name}>
                      <span style={{ color: colorValue }}>{name}</span>
                      {i < unlocks.length - 1 ? ', ' : '.'}
                    </span>
                  ))}
                </p>
              </GoalStep>
            )}

            <GoalStep icon={ListChecks} label="PATH." color={colorValue}>
              <p className="font-space-grotesk text-xs leading-relaxed text-[var(--foreground)] md:text-sm">
                <span className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>{doneCount}</span> of {path.milestones.length} milestones done
                {reached ? '. you’re there.' : '.'}
              </p>
              {!isSignedIn && (
                <p className="mt-1 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
                  <Link href="/sign-in" style={{ color: colorValue }}>sign in</Link> to save your milestones in your progress.
                </p>
              )}
              {notice && <p className="mt-2 font-space-grotesk text-xs" style={{ color: colorValue }} role="status">{notice}</p>}
            </GoalStep>
          </div>
        </div>

        <div ref={tabsRef} className="min-w-0 scroll-mt-24">
          <SleekTabs
            label="goal"
            tabs={[
              { id: 'PATH', label: <>PATH. <span className="ml-1 text-[var(--text-muted)]">{doneCount}/{path.milestones.length}</span></> },
              ...(BASELINE ? [{ id: 'LIKE', label: <>LIKE. <span className="ml-1 text-[var(--text-muted)]">{likes.length}</span></> }] : []),
              { id: 'GOALS', label: <>GOALS. <span className="ml-1 text-[var(--text-muted)]">{GOALS.length}</span></> },
            ]}
            activeId={tab}
            onChange={(id) => setTab(id as Tab)}
            accent={colorValue}
          />
          <p className="pb-1 pt-3 font-space-grotesk text-xs text-[var(--text-muted)]">{intro[tab]}</p>

          {tab === 'PATH' && (
            <ol key={`path-${goal.id}`} className="stack-page lg:min-h-[30rem]" style={{ ['--turn' as string]: 1 }}>
              {path.milestones.map((m, i) => {
                const isDone = done.has(m.stepId);
                return (
                  <li key={m.stepId} className="border-b py-3 last:border-b-0" style={{ borderColor: `${colorValue}20`, ['--ink-delay' as string]: `${i * 60}ms` }}>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggle(m.stepId)}
                        disabled={!isSignedIn}
                        aria-pressed={isDone}
                        aria-label={`${isDone ? 'not done' : 'done'}: ${m.title}`}
                        title={isSignedIn ? undefined : 'sign in to save your milestones'}
                        className="group flex items-center gap-3 rounded-full text-left disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                        style={{ outlineColor: colorValue }}
                      >
                        <span className="transition-transform duration-200 group-enabled:group-hover:-rotate-6">
                          <InkRing color={colorValue} on={isDone} />
                        </span>
                        <span className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>{m.title}</span>
                      </button>
                    </div>
                    <p className="mt-1.5 pl-10 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
                      {m.service.name} <span className="font-google-sans-code text-[10px] uppercase tracking-wide">{m.service.role}</span>
                      {m.href && (
                        <Link href={m.href} className="ml-3 whitespace-nowrap font-google-sans-code text-[10px] uppercase tracking-wide transition-colors hover:text-[var(--theme-color,_#f9c22e)]">
                          the step →
                        </Link>
                      )}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}

          {tab === 'LIKE' && BASELINE && (
            <>
              <div key={`like-${likePager.page}`} className="stack-page lg:min-h-[30rem]" style={{ ['--turn' as string]: turn }}>
                {/* Your own count, which wins over any project it's like */}
                <div className="flex items-center gap-3 border-b py-3" style={{ borderColor: `${colorValue}20` }}>
                  <Hammer size={20} color={colorValue} className="shrink-0" />
                  <label className="flex items-baseline gap-3">
                    <span className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>YOURS.</span>
                    <span className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={ownHours === null ? '' : following ? Math.round(ownHours * 10) / 10 : ownHours}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          save({ hours: Number.isFinite(n) && n > 0 ? n : undefined, hoursFrom: undefined, hoursOf: undefined });
                        }}
                        placeholder="0"
                        aria-label="your own hours"
                        className="w-20 bg-transparent font-vt323 text-2xl leading-none outline-none placeholder:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        style={{ color: colorValue }}
                      />
                      <InkUnderline color={colorValue} className="pointer-events-none absolute -bottom-1.5 left-0 h-2 w-full" />
                    </span>
                    <span className="font-space-grotesk text-xs text-[var(--text-muted)]">hours</span>
                  </label>
                  {ownHours !== null && (
                    <button type="button" onClick={() => save({ hours: undefined, hoursFrom: undefined, hoursOf: undefined })} aria-label="clear your hours" className="ml-auto rounded-full p-1 transition-opacity hover:opacity-70" style={{ color: colorValue }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
                {/* Hours tracked in Expensd: follow them, or say that's what it's doing */}
                {tracked > 0 && (
                  <p className="border-b py-2 pl-8 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]" style={{ borderColor: `${colorValue}20` }}>
                    {following ? (
                      'following the hours you track, live.'
                    ) : (
                      <button type="button" onClick={() => save({ hoursFrom: 'tracked', hours: undefined, hoursOf: undefined })} className={linkClass} style={{ color: colorValue, outlineColor: colorValue }}>
                        use the {hoursOf(tracked)} hours you&apos;ve tracked →
                      </button>
                    )}
                  </p>
                )}

                <ul>
                  {shownLikes.map((p, i) => {
                    const { name, cover, color } = describe(p);
                    const chosen = ownHours === null && p.id === saved.like;
                    // Square root, so a 2-hour project still shows a line beside a 589-hour one
                    const reach = mostHours > 0 ? Math.max(0.06, Math.sqrt(p.hours / mostHours)) : 0;
                    return (
                      <li key={p.id} style={{ ['--ink-delay' as string]: `${i * 60}ms` }}>
                        <button
                          type="button"
                          onClick={() => {
                            save({ like: p.id, hours: undefined, hoursFrom: undefined, hoursOf: undefined });
                            setTab('PATH');
                            bring(buildRef.current);
                          }}
                          aria-pressed={chosen}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[var(--background-highlight)]"
                        >
                          <UnpppCircle src={cover} color={color ?? colorValue} />
                          <span className="min-w-0 flex-1">
                            <span className="relative font-vt323 text-xl leading-none" style={{ color: colorValue }}>
                              {name}
                              {chosen && <InkCircle key={p.id} color={colorValue} className="absolute -inset-x-2 -inset-y-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+1rem)]" />}
                            </span>
                            <span className="mt-1.5 block" style={{ width: `${reach * 100}%` }}>
                              <InkLine color={colorValue} />
                            </span>
                          </span>
                          <span className="whitespace-nowrap font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                            {hoursOf(p.hours)} h
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {(BASELINE.source || BASELINE.measured) && (
                  <p className="mt-4 px-2 font-google-sans-code text-[10px] uppercase leading-relaxed tracking-wide text-[var(--text-muted)]">
                    {[BASELINE.source, BASELINE.measured && `measured ${BASELINE.measured}`].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <Pager page={likePager.page} pageCount={likePager.pageCount} onPage={likePager.goTo} color={colorValue} label="project pages" />
            </>
          )}

          {tab === 'GOALS' && (
            <>
              <ul key={`goals-${goalPager.page}`} className="stack-page lg:min-h-[30rem]" style={{ ['--turn' as string]: turn }}>
                {shownGoals.map((g, i) => {
                  const chosen = g.id === goal.id;
                  const firstOfKind = i === 0 || groupOf(shownGoals[i - 1]) !== groupOf(g);
                  return (
                    <li key={g.id}>
                      {firstOfKind && (
                        <p className={`${i === 0 ? '' : 'mt-5'} font-vt323 text-lg`} style={{ color: colorValue }}>
                          {GROUP_LABEL[groupOf(g)]}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          save({ goalId: g.id });
                          setTab('PATH');
                        }}
                        aria-pressed={chosen}
                        className="flex w-full items-baseline gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--background-highlight)]"
                      >
                        <span className="relative font-vt323 text-xl leading-none" style={{ color: colorValue }}>
                          {nameOf(g)}
                          {chosen && <InkCircle key={g.id} color={colorValue} className="absolute -inset-x-2 -inset-y-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+1rem)]" />}
                        </span>
                        <span className="ml-auto whitespace-nowrap font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                          {deltaLabel(goalPath(g, choice)).split(' · ')[0]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Pager page={goalPager.page} pageCount={goalPager.pageCount} onPage={goalPager.goTo} color={colorValue} label="goal pages" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// The saved goal at the moment of a change, not the last render's
function localStorageNow(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// useSearchParams needs a Suspense boundary on a prerendered page
const GoalBudget: React.FC = () => (
  <Suspense fallback={null}>
    <GoalBudgetInner />
  </Suspense>
);

export default GoalBudget;

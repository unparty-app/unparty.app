'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import { useTheme } from '../../contexts/ThemeContext';
import { useInView } from '../../hooks/useInView';
import { OWNER_STACK } from '../../constants/organization';
import {
  DEPEND_FEATURES,
  DEPENDS_CHECKED,
  getDependItems,
  monthlyCost,
  stackSearchParams,
  summarizeStack,
  type DependFeature,
  type DependItem,
  type DependPlan,
} from '@/utils/dependCosts';
import { SETUP_START_HERE } from '../editorial/SetupCurriculum';
import { FOUNDER_CTA } from '../../constants/organization';
import HandDrawnArrow from '../HandDrawnArrow';
import SleekTabs from '../SleekTabs';
import Pager from './Pager';
import { InkCheck, InkCircle, InkRing, InkUnderline } from './ink';

/**
 * BuildYourStack - what it costs to build your own copy, and which of
 * theunpartyapp's features that stack lets you build, as a conversion point
 * right under "build yours".
 *
 * One full-bleed band, two columns. The left one is the bill and stays in view
 * (sticky from lg, below the fixed header): the ask with the live monthly total in it, the starting
 * points (TRY. visitor, BUILD. builder, SELL. buyer), what else it costs,
 * where the money goes, and "start building". The right one is the house tab
 * bar on every screen size:
 *
 * - DEPEND. the services every copy runs on (always on)
 * - ADD. the optional ones, each a toggle
 * - CAN. theunpartyapp's features, from DependConfig.json `features`: the ones
 *   the stack can build, and the ones it can't yet with what they still need.
 *   Tapping a locked feature adds what it depends on; two columns from sm. The AI
 *   features explain, in plain words, what the machine does.
 *
 * Each tab pages (PAGE_SIZE) instead of growing, with pen arrows, dots and a
 * swipe on phones. "see them" hands the stack to /build as a query string
 * (stackSearchParams), so that page can show what this stack builds.
 *
 * Nothing is hidden or guessed: free plans first, a cut per sale shown as a
 * cut, usage as usage, a service that moves another to a paid plan says why
 * (selling depends on Vercel Pro), each price links to its pricing page, the date
 * they were checked is printed, and prices only the person knows (their
 * domain, the search API they connect) are typed in by them. The site owner's
 * own bill (FoundersConfig `stack`) shows beside it.
 *
 * Motion is pen strokes (./ink): rings and ticks draw in, the chosen starting
 * point and plan get circled, the total counts to its new value and is
 * underlined again, the bar's segments grow, newly unlocked features slide in.
 * All of it waits until the band is on screen; reduced motion shows it still.
 */

const ITEMS = getDependItems();
const NAME = new Map(ITEMS.map((item) => [item.id, item.name]));
const REQUIRED = ITEMS.filter((item) => item.required);
const OPTIONAL = ITEMS.filter((item) => !item.required);

interface Lens {
  id: string;
  label: string;
  who: string;
  promise: string;
  on: string[];
  plans: Record<string, string>;
}

const LENSES: Lens[] = [
  { id: 'try', label: 'TRY.', who: 'visitor', promise: 'start somewhere. build your unparty without any subscriptions.', on: [], plans: {} },
  {
    id: 'build',
    label: 'BUILD.',
    who: 'builder',
    promise: 'build your ideas with or without using AI.',
    on: ['claude', 'blob', 'loops'],
    plans: { claude: 'pro' },
  },
  {
    id: 'sell',
    label: 'SELL.',
    who: 'buyer',
    promise: 'put a price on what you build, and see what breaks.',
    on: ['claude', 'blob', 'loops', 'polar', 'drains'],
    plans: { claude: 'pro' },
  },
];

type Tab = 'DEPEND' | 'ADD' | 'CAN';

// One page of a tab: services are tall rows, features sit two to a line from sm
const PAGE_SIZE: Record<Tab, number> = { DEPEND: 5, ADD: 5, CAN: 6 };

// Where "see them" takes the stack (it reads the query from stackSearchParams)
const BUILD_PAGE = '/build';

const TAB_PROMISE: Record<Tab, string> = {
  DEPEND: 'every copy runs on these.',
  ADD: 'add when you want it. every one is optional.',
  CAN: 'what your copy can do with this stack.',
};

const money = (n: number) => `$${Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)}`;
const cents = (n: number) => (n < 1 ? `${Math.round(n * 100)}¢` : money(n));
const per = (plan: DependPlan) => (plan.payFrequency === 'once' ? 'once' : `a ${plan.payFrequency}`);

function priceLabel(plan: DependPlan, cost: number): string {
  if (plan.custom) return cost > 0 ? `${money(cost)} ${per(plan)}` : 'yours';
  const base = `${money(cost)} ${per(plan)}`;
  if (plan.fee) {
    const cut = `${plan.fee.percent}% + ${cents(plan.fee.fixed)} a sale`;
    return cost > 0 ? `${base} + ${cut}` : cut;
  }
  if (plan.usage) return cost > 0 ? `${base} + usage` : 'usage only';
  return cost === 0 ? 'free' : base;
}

const CHECKED = new Date(`${DEPENDS_CHECKED}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// What the site owner pays a month, yearly bills spread over twelve
const OWNER_MONTHLY = Object.values(OWNER_STACK).reduce((sum, entry) => sum + monthlyCost(entry.cost, entry.payFrequency), 0);

/** Counts from the last value to the new one; reduced motion jumps. */
function useTween(value: number, ms = 650) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = value;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion is a browser setting the server can't read: the count jumps to the value once mounted
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const next = origin + (value - origin) * (1 - (1 - t) ** 3);
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, ms]);
  return shown;
}

interface BuildYourStackProps {
  lens?: string; // Starting point: try (default), build or sell
  href?: string; // Where "start building" goes (default the site's ask, founder.cta)
  placement?: string; // cta_clicked placement (default: the page's path)
}

export default function BuildYourStack({ lens: initialLens = 'try', href = FOUNDER_CTA?.href ?? SETUP_START_HERE, placement }: BuildYourStackProps) {
  const { colorValue } = useTheme();
  const pathname = usePathname();
  const [rootRef, inView] = useInView<HTMLDivElement>();
  const startLens = LENSES.find((l) => l.id === initialLens) ?? LENSES[0];
  const [lens, setLens] = useState<string | null>(startLens.id);
  const [on, setOn] = useState<Set<string>>(() => new Set(startLens.on));
  const [plans, setPlans] = useState<Record<string, string>>(startLens.plans);
  // Prices only the person knows, as typed
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>('DEPEND');
  const [pages, setPages] = useState<Record<Tab, number>>({ DEPEND: 0, ADD: 0, CAN: 0 });
  // Which way the last page turn went, for the slide (1 forward, -1 back)
  const [turn, setTurn] = useState(1);
  const swipeX = useRef<number | null>(null);

  const chooseLens = (next: Lens) => {
    setLens(next.id);
    setOn(new Set(next.on));
    setPlans(next.plans);
  };
  const toggle = (id: string) => {
    setLens(null);
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const addAll = (ids: string[], needPlans: Record<string, string> = {}) => {
    setLens(null);
    setOn((prev) => new Set([...prev, ...ids]));
    if (Object.keys(needPlans).length) setPlans((prev) => ({ ...prev, ...needPlans }));
  };
  const choosePlan = (id: string, planId: string) => {
    setLens(null);
    setPlans((prev) => ({ ...prev, [id]: planId }));
  };

  const stack = useMemo(() => {
    const summary = summarizeStack({ on, plans, typed }, ITEMS);
    const fees: string[] = [];
    const usage: string[] = [];
    const untyped: string[] = [];
    const segments: { id: string; name: string; weight: number; label: string }[] = [];
    let free = 0;
    for (const item of summary.active) {
      const plan = summary.planOf(item);
      const cost = summary.costOf(item, plan);
      if (plan.fee) fees.push(`${plan.fee.percent}% + ${cents(plan.fee.fixed)} a sale to ${item.name}`);
      if (plan.usage) usage.push(item.name);
      if (plan.custom && cost === 0) untyped.push(item.name);
      if (!plan.custom && cost === 0 && !plan.fee && !plan.usage) free += 1;
      const weight = monthlyCost(cost, plan.payFrequency);
      if (weight > 0) segments.push({ id: item.id, name: item.name, weight, label: priceLabel(plan, cost) });
    }
    return { ...summary, fees, usage, untyped, segments, free };
  }, [on, plans, typed]);

  const shownMonthly = useTween(inView ? stack.monthly : 0);
  const activeLens = LENSES.find((l) => l.id === lens);
  const totalWeight = stack.segments.reduce((sum, s) => sum + s.weight, 0);

  const onStart = () =>
    track('cta_clicked', { cta: 'start building', placement: placement || pathname || 'article', lens: lens ?? 'yours', monthly: stack.monthly });

  const startLink = (className: string) => (
    <Link
      href={href}
      onClick={onStart}
      className={`group items-center gap-3 rounded-full border-2 px-5 py-2.5 font-google-sans-code text-sm uppercase tracking-wider transition-transform duration-200 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none ${className}`}
      style={{ borderColor: colorValue, color: colorValue, outlineColor: colorValue }}
    >
      start building
      <HandDrawnArrow className="h-5 w-8" color={colorValue} />
    </Link>
  );

  const row = (item: DependItem, index: number) => {
    const isOn = item.required || on.has(item.id);
    const plan = stack.planOf(item);
    const cost = stack.costOf(item, plan);
    const forced = stack.forced.get(item.id);
    const external = /^https?:/.test(item.pricingUrl);
    const price = (
      <span className="whitespace-nowrap font-google-sans-code text-xs uppercase tracking-wide" style={{ color: isOn ? 'var(--foreground)' : 'var(--text-muted)' }}>
        {priceLabel(plan, cost)}
      </span>
    );
    const name = (
      <span className="flex items-baseline gap-2">
        <span className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>{item.name}</span>
        <span className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{item.role}</span>
      </span>
    );
    return (
      <li
        key={item.id}
        className={`border-b py-3 transition-opacity duration-300 last:border-b-0 ${isOn ? '' : 'opacity-70'}`}
        style={{ borderColor: `${colorValue}20`, ['--ink-delay' as string]: `${Math.min(index, 10) * 50}ms` }}
      >
        <div className="flex items-center gap-3">
          {item.required ? (
            <span className="flex items-center gap-3" title="every copy depends on this">
              <InkRing color={colorValue} on />
              {name}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-pressed={isOn}
              aria-label={`${isOn ? 'remove' : 'add'} ${item.name}`}
              className="group flex items-center gap-3 rounded-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ outlineColor: colorValue }}
            >
              <span className="transition-transform duration-200 group-hover:-rotate-6 group-active:scale-90">
                <InkRing color={colorValue} on={isOn} />
              </span>
              {name}
            </button>
          )}
          <span className="ml-auto">
            {external ? (
              <a href={item.pricingUrl} target="_blank" rel="noopener noreferrer" title={`${item.name} pricing, checked ${CHECKED}`} className="hover:underline">
                {price}
              </a>
            ) : (
              <Link href={item.pricingUrl} className="hover:underline">{price}</Link>
            )}
          </span>
        </div>
        <div className="mt-1.5 pl-10 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
          {item.plans.length > 1 && (
            <span className="mr-3 inline-flex gap-3 align-middle" role="group" aria-label={`${item.name} plan`}>
              {item.plans.map((option) => {
                const chosen = option.id === plan.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={Boolean(forced) || !isOn}
                    onClick={() => choosePlan(item.id, option.id)}
                    aria-pressed={chosen}
                    className="relative px-1 font-google-sans-code text-[11px] uppercase tracking-wide disabled:cursor-default"
                    style={{ color: chosen ? colorValue : 'var(--text-muted)' }}
                  >
                    {option.name}
                    {chosen && isOn && (
                      <InkCircle key={`${item.id}-${option.id}`} color={colorValue} className="absolute -inset-x-1.5 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.75rem)]" />
                    )}
                  </button>
                );
              })}
            </span>
          )}
          {plan.custom && (
            <label className="mr-3 inline-flex items-center gap-1 align-middle font-google-sans-code text-xs text-[var(--foreground)]">
              $
              <input
                type="text"
                inputMode="decimal"
                value={typed[item.id] ?? ''}
                disabled={!isOn}
                onChange={(e) => setTyped((prev) => ({ ...prev, [item.id]: e.target.value.replace(/[^0-9.]/g, '') }))}
                placeholder="0"
                aria-label={`what ${item.name} costs you ${per(plan)}`}
                className="w-16 border-b bg-transparent px-1 py-0.5 outline-none disabled:opacity-50"
                style={{ borderColor: colorValue }}
              />
              <span className="uppercase text-[var(--text-muted)]">{per(plan)}</span>
            </label>
          )}
          {plan.note && <span>{plan.note}. </span>}
          {plan.usage && !plan.custom && <span>usage: {plan.usage}. </span>}
          {forced && (
            <span className="block" style={{ color: colorValue }}>
              {plan.name}, because of {forced.by}: {forced.reason}
            </span>
          )}
          {item.href && (
            <Link href={item.href} className="font-google-sans-code text-[10px] uppercase tracking-wide whitespace-nowrap transition-colors hover:text-[var(--theme-color,_#f9c22e)]">
              step →
            </Link>
          )}
        </div>
      </li>
    );
  };

  const feature = (f: DependFeature, missing: string[] | null) => {
    const locked = missing !== null;
    const body = (
      <>
        <span className="mt-0.5 shrink-0">
          {locked ? <InkRing color={colorValue} on={false} className="size-4 opacity-60" /> : <InkCheck color={colorValue} className="size-4" />}
        </span>
        <span className="min-w-0 font-space-grotesk text-xs leading-relaxed md:text-sm">
          <span className="font-vt323 text-lg leading-none" style={{ color: locked ? 'var(--text-muted)' : colorValue }}>
            {f.name}
          </span>
          <span className={`block ${locked ? 'text-[var(--text-muted)]' : 'text-[var(--foreground)]'}`}>
            {f.what}
            {!locked && (
              <Link href={f.href} className="ml-2 whitespace-nowrap font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--theme-color,_#f9c22e)]">
                how →
              </Link>
            )}
          </span>
          {f.ai && (
            <span className="mt-1.5 block border-l-2 pl-3 text-[var(--text-muted)]" style={{ borderColor: locked ? `${colorValue}40` : colorValue }}>
              <span className="mr-2 font-vt323 text-base leading-none" style={{ color: colorValue }}>AI.</span>
              {f.ai}
            </span>
          )}
          {locked && (
            <span className="mt-1 block font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: colorValue }}>
              + add {missing.map((id) => NAME.get(id)).join(' + ')}
            </span>
          )}
        </span>
      </>
    );
    return (
      <li key={f.id}>
        {locked ? (
          <button
            type="button"
            onClick={() => addAll(missing, f.plans)}
            aria-label={`add ${missing.map((id) => NAME.get(id)).join(' and ')} to build ${f.name}`}
            className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--background-highlight)]"
          >
            {body}
          </button>
        ) : (
          <div className="flex items-start gap-3 px-2 py-2">{body}</div>
        )}
      </li>
    );
  };

  const counts: Record<Tab, string> = {
    DEPEND: `${REQUIRED.length}`,
    ADD: `${OPTIONAL.filter((item) => on.has(item.id)).length}/${OPTIONAL.length}`,
    CAN: `${stack.can.length}/${DEPEND_FEATURES.length}`,
  };

  // This tab's page: CAN. pages through what the stack builds, then NOT YET.
  const listOf: Record<Tab, unknown[]> = { DEPEND: REQUIRED, ADD: OPTIONAL, CAN: [...stack.can, ...stack.cannot] };
  const size = PAGE_SIZE[tab];
  const pageCount = Math.max(1, Math.ceil(listOf[tab].length / size));
  const page = Math.min(pages[tab], pageCount - 1);
  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(pageCount - 1, next));
    if (clamped === page) return;
    setTurn(clamped > page ? 1 : -1);
    setPages((prev) => ({ ...prev, [tab]: clamped }));
  };
  const canStart = page * size;
  const shownCan = stack.can.slice(canStart, canStart + size);
  const shownCannot = stack.cannot.slice(Math.max(0, canStart - stack.can.length), Math.max(0, canStart + size - stack.can.length));

  return (
    <div
      ref={rootRef}
      id="build-your-stack"
      className="stack my-12 w-screen mx-[calc(50%-50vw)] px-4 py-12 text-left sm:px-6 lg:px-12"
      data-paused={!inView || undefined}
      style={{ backgroundColor: `${colorValue}08` }}
    >
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        {/* The bill, in view while you change the stack */}
        <div className="lg:sticky lg:top-44 lg:self-start">
          <p className="font-vt323 text-4xl leading-none sm:text-5xl" style={{ color: colorValue }}>
            build yours for{' '}
            <span className="relative inline-block whitespace-nowrap">
              {money(Math.round(shownMonthly))}
              <InkUnderline key={stack.monthly} color={colorValue} className="absolute -bottom-1.5 left-0 h-2.5 w-full" />
            </span>{' '}
            a month.
          </p>

          {/* Starting points: a visitor, a builder, a buyer */}
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3" role="group" aria-label="starting points">
            {LENSES.map((l) => {
              const chosen = l.id === lens;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => chooseLens(l)}
                  aria-pressed={chosen}
                  className="relative px-2 py-1 text-left font-vt323 text-2xl leading-none transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                  style={{ color: colorValue, opacity: chosen ? 1 : 0.6, outlineColor: colorValue }}
                >
                  {l.label}
                  <span className="ml-2 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{l.who}</span>
                  {chosen && <InkCircle key={l.id} color={colorValue} className="absolute -inset-x-2 -inset-y-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+1rem)]" />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 min-h-[2.5rem] font-space-grotesk text-xs leading-relaxed md:text-sm" style={{ color: activeLens ? 'var(--foreground)' : colorValue }}>
            {activeLens ? activeLens.promise : 'your stack. pick a starting point to reset it.'}
          </p>

          <ul className="mt-4 space-y-1 font-google-sans-code text-xs uppercase tracking-wide text-[var(--text-muted)]" aria-live="polite">
            {stack.yearly > 0 && <li>+ {money(stack.yearly)} a year</li>}
            {stack.untyped.map((name) => (
              <li key={name}>
                + {name}:{' '}
                <button type="button" onClick={() => setTab(REQUIRED.some((item) => item.name === name) ? 'DEPEND' : 'ADD')} className="uppercase underline decoration-dotted underline-offset-4" style={{ color: colorValue }}>
                  type its price
                </button>
              </li>
            ))}
            {stack.fees.map((fee) => <li key={fee}>+ {fee}</li>)}
            {stack.usage.length > 0 && <li>+ usage on {stack.usage.join(', ')}</li>}
            <li>{stack.free} of {stack.active.length} services free</li>
          </ul>

          {/* Where the money goes: one segment per paid service */}
          {totalWeight > 0 && (
            <div className="mt-5">
              <div className="stack-bar flex h-2.5 w-full gap-1 overflow-hidden rounded-full">
                {stack.segments.map((s, i) => (
                  <span
                    key={s.id}
                    title={`${s.name}: ${s.label}`}
                    className="rounded-full"
                    style={{ flexGrow: inView ? s.weight : 0.0001, flexBasis: 0, backgroundColor: colorValue, opacity: 1 - (i % 3) * 0.25 }}
                  />
                ))}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                {stack.segments.map((s) => <li key={s.id}>{s.name} · {s.label}</li>)}
              </ul>
            </div>
          )}

          <Link
            href={`${BUILD_PAGE}?${stackSearchParams({ lens, on, plans, typed })}`}
            onClick={() => track('cta_clicked', { cta: 'see them', placement: placement || pathname || 'article', lens: lens ?? 'yours', features: stack.can.length })}
            className="group mt-5 block text-left font-space-grotesk text-xs leading-relaxed text-[var(--foreground)] md:text-sm"
          >
            this stack builds{' '}
            <span className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>{stack.can.length}</span> of{' '}
            {DEPEND_FEATURES.length} features.{' '}
            <span className="inline-flex items-center gap-1 whitespace-nowrap align-middle" style={{ color: colorValue }}>
              see them <HandDrawnArrow className="h-4 w-6" color={colorValue} />
            </span>
          </Link>
          {OWNER_MONTHLY > 0 && (
            <p className="mt-3 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
              you start where you are, and add a DEPEND. when you need to scale up.
            </p>
          )}

          {startLink('mt-8 hidden lg:inline-flex')}
          <p className="mt-4 hidden font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] lg:block">
            DEPEND prices last updated {CHECKED}.
          </p>
        </div>

        {/* The stack, one tab at a time */}
        <div className="min-w-0">
          <SleekTabs
            label="stack"
            tabs={(['DEPEND', 'ADD', 'CAN'] as Tab[]).map((id) => ({
              id,
              label: (
                <>
                  {id}. <span className="ml-1 text-[var(--text-muted)]">{counts[id]}</span>
                </>
              ),
            }))}
            activeId={tab}
            onChange={(id) => setTab(id as Tab)}
            accent={colorValue}
          />
          <p className="pb-1 pt-3 font-space-grotesk text-xs text-[var(--text-muted)]">{TAB_PROMISE[tab]}</p>

          <div
            key={`${tab}-${page}`}
            className="stack-page lg:min-h-[30rem]"
            style={{ ['--turn' as string]: turn }}
            onTouchStart={(e) => { swipeX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (swipeX.current === null) return;
              const dx = e.changedTouches[0].clientX - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) > 48) goTo(page + (dx < 0 ? 1 : -1));
            }}
          >
            {tab === 'CAN' ? (
              <>
                {shownCan.length > 0 && <ul className="stack-builds grid gap-x-4 sm:grid-cols-2">{shownCan.map((f) => feature(f, null))}</ul>}
                {shownCannot.length > 0 && (
                  <>
                    <p className={`${shownCan.length > 0 ? 'mt-6' : ''} px-2 font-vt323 text-lg`} style={{ color: colorValue }}>NOT YET.</p>
                    <ul className="stack-builds grid gap-x-4 sm:grid-cols-2">{shownCannot.map(({ feature: f, missing }) => feature(f, missing))}</ul>
                  </>
                )}
              </>
            ) : (
              <ol>{(listOf[tab] as DependItem[]).slice(page * size, page * size + size).map((item, i) => row(item, i))}</ol>
            )}
          </div>

          <Pager page={page} pageCount={pageCount} onPage={goTo} color={colorValue} label={`${tab.toLowerCase()} pages`} />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-5xl lg:hidden">
        {startLink('inline-flex')}
        <p className="mt-4 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          prices checked {CHECKED}. each one links to its pricing page.
        </p>
      </div>
    </div>
  );
}

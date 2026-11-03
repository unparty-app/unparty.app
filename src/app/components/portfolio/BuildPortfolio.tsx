'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useInView } from '../../hooks/useInView';
import { getPortfolio, type PortfolioItem } from '@/lib/component-portfolio';
import { DEPEND_FEATURES, getDependItems, readStackParams, stackSearchParams, summarizeStack } from '@/utils/dependCosts';
import SleekTabs from '../SleekTabs';
import Pager from '../depend/Pager';
import PixelPlug from './PixelPlug';
import VoteControl from './VoteControl';
import { useComponentVotes } from './useComponentVotes';

/**
 * BuildPortfolio - the top of /build: the person's stack and the components
 * they want to make theirs (#1433).
 *
 * The stack comes in on the query string from BuildYourStack's "see them"
 * link (readStackParams); without one, it points back to build one. The
 * portfolio is every embeddable component (src/lib/component-portfolio.ts),
 * voted MORE. / MEH. / NAH. in the browser. A component is MADE. once its
 * home article is published, which is also when its MAKE. step is done;
 * until then it's a draft (npm run create:component-article writes one).
 *
 * Same band as BuildYourStack: the summary on the left (sticky from lg), the
 * house tab bar on the right (YOURS. / ALL. / MADE.), paged. Like its CAN.
 * tab, each list shows what the stack runs first, then NOT YET. with the
 * services each one still needs; tapping that adds them to the stack (the
 * query string), and the component moves up.
 */

const PORTFOLIO = getPortfolio();
const ITEMS = getDependItems();
const NAME = new Map(ITEMS.map((item) => [item.id, item.name]));
// Where each service is set up: its SETUP. article
const SETUP_HREF = new Map(ITEMS.map((item) => [item.id, item.href]));
const PAGE_SIZE = 6;
// Drafts open on npm run dev only; in production they 404
const DEV = process.env.NODE_ENV === 'development';
const STACK_ARTICLE = '/build';

type Tab = 'YOURS' | 'ALL' | 'MADE';

const TAB_PROMISE: Record<Tab, string> = {
  YOURS: 'the components you voted MORE. each one is a MAKE. step.',
  ALL: 'every component your copy can embed. vote on the ones you want.',
  MADE: 'components with a published article. their MAKE. step is done.',
};

const money = (n: number) => `$${Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)}`;

export default function BuildPortfolio() {
  const { colorValue } = useTheme();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [rootRef, inView] = useInView<HTMLDivElement>();
  const { votes, vote } = useComponentVotes();

  const choice = useMemo(() => readStackParams(new URLSearchParams(params.toString())), [params]);
  const hasStack = params.has('lens') || params.has('on');
  const stack = useMemo(() => summarizeStack(choice, ITEMS), [choice]);
  const activeIds = useMemo(() => new Set(stack.active.map((item) => item.id)), [stack]);

  const yours = PORTFOLIO.filter((item) => votes[item.name] === 'more');
  const made = PORTFOLIO.filter((item) => item.done);
  const drafts = PORTFOLIO.filter((item) => item.home && !item.home.published).length;
  const lists: Record<Tab, PortfolioItem[]> = { YOURS: yours, ALL: PORTFOLIO, MADE: made };
  // What the stack can't run yet: the services each component still needs
  const missingOf = (item: PortfolioItem) => item.needs.filter((id) => !activeIds.has(id));
  // Like the stack builder's CAN.: what the stack runs first, then NOT YET.
  const split = (items: PortfolioItem[]) => ({
    runs: items.filter((item) => missingOf(item).length === 0),
    locked: items.filter((item) => missingOf(item).length > 0),
  });
  // Adds a locked component's services to the stack, right here: the query
  // string is the stack, so the summary and every list follow
  const addServices = (ids: string[]) => {
    const query = stackSearchParams({ ...choice, lens: null, on: [...new Set([...choice.on, ...ids])] });
    router.replace(`${pathname}?${query}`, { scroll: false });
  };

  // Opens on ALL. and only moves when a tab is tapped, never under a vote
  const [active, setTab] = useState<Tab>('ALL');
  const [pages, setPages] = useState<Record<Tab, number>>({ YOURS: 0, ALL: 0, MADE: 0 });
  const [turn, setTurn] = useState(1);
  // Locked rows whose pixel tip is open (what to add, where to set it up)
  const [openTips, setOpenTips] = useState<Set<string>>(new Set());
  const toggleTip = (name: string) =>
    setOpenTips((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const { runs, locked } = split(lists[active]);
  const list = [...runs, ...locked];
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(pages[active], pageCount - 1);
  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(pageCount - 1, next));
    if (clamped === page) return;
    setTurn(clamped > page ? 1 : -1);
    setPages((prev) => ({ ...prev, [active]: clamped }));
  };

  // This page of the list, split where NOT YET. starts
  const start = page * PAGE_SIZE;
  const shownRuns = runs.slice(start, start + PAGE_SIZE);
  const shownLocked = locked.slice(Math.max(0, start - runs.length), Math.max(0, start + PAGE_SIZE - runs.length));

  const row = (item: PortfolioItem, index: number) => {
    const missing = missingOf(item);
    return (
      <li
        key={item.name}
        className="border-b py-3 last:border-b-0"
        style={{ borderColor: `${colorValue}20`, ['--ink-delay' as string]: `${index * 50}ms` }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>{item.label}</span>
            {missing.length > 0 && (
              // The stack can't run it yet: a pixel plug, and a tap shows what it needs
              <button
                type="button"
                onClick={() => toggleTip(item.name)}
                aria-expanded={openTips.has(item.name)}
                aria-label={`${item.label} needs ${missing.map((id) => NAME.get(id) ?? id).join(' and ')}`}
                className="pixel-tip flex size-6 items-center justify-center rounded-sm transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
                style={{ opacity: openTips.has(item.name) ? 1 : 0.7 }}
              >
                <PixelPlug color={colorValue} />
              </button>
            )}
          </span>
          <span className="ml-auto">
            <VoteControl name={item.label} value={votes[item.name]} onVote={(c) => vote(item.name, c)} color={colorValue} />
          </span>
        </div>
        <p className="mt-1.5 font-google-sans-code text-xs leading-relaxed text-[var(--text-muted)]">
          {item.home?.published ? (
            <>
              {item.home.blurb}{' '}
              <Link href={`/article/${item.home.slug}`} className="whitespace-nowrap font-google-sans-code text-[10px] uppercase tracking-wide transition-colors hover:text-[var(--theme-color,_#f9c22e)]">
                article →
              </Link>
            </>
          ) : item.home ? (
            <>
              <span style={{ color: colorValue }}>draft.</span>{' '}
              {item.home.blurb.startsWith('TODO') ? 'its words are not written yet.' : 'written, not published yet.'}{' '}
              {DEV && (
                <Link href={`/article/${item.home.slug}`} className="whitespace-nowrap font-google-sans-code text-[10px] uppercase tracking-wide transition-colors hover:text-[var(--theme-color,_#f9c22e)]">
                  open draft →
                </Link>
              )}
            </>
          ) : (
            <>
              no article yet.{' '}
              <code className="font-google-sans-code text-[10px]">npm run create:component-article -- {item.name}</code>
            </>
          )}
          {missing.length > 0 && openTips.has(item.name) && (
            // Opened from the pixel tip: add them to the stack here, or go set
            // them up, each name leading to the SETUP. article that connects it
            <span className="pixel-reveal mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => addServices(missing)}
                aria-label={`add ${missing.map((id) => NAME.get(id) ?? id).join(' and ')} to your stack to run ${item.label}`}
                className="font-google-sans-code text-[10px] uppercase tracking-wide transition-opacity hover:opacity-70"
                style={{ color: colorValue }}
              >
                + add {missing.map((id) => NAME.get(id) ?? id).join(' + ')}
              </button>
              <span className="font-google-sans-code text-[10px] uppercase tracking-wide">
                set up{' '}
                {missing.map((id, i) => {
                  const href = SETUP_HREF.get(id);
                  return (
                    <span key={id}>
                      {i > 0 && ' · '}
                      {href ? (
                        <Link href={href} className="underline decoration-dotted underline-offset-4 transition-colors hover:text-[var(--foreground)]">
                          {NAME.get(id) ?? id}
                        </Link>
                      ) : (
                        NAME.get(id) ?? id
                      )}
                    </span>
                  );
                })}
              </span>
            </span>
          )}
        </p>
      </li>
    );
  };

  return (
    <div
      ref={rootRef}
      className="stack mb-12 w-screen mx-[calc(50%-50vw)] px-4 py-12 text-left sm:px-6 lg:px-12"
      data-paused={!inView || undefined}
      style={{ backgroundColor: `${colorValue}08` }}
    >
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="lg:sticky lg:top-44 lg:self-start">
          <h1 className="font-vt323 text-5xl leading-none" style={{ color: colorValue }}>your build.</h1>

          {hasStack ? (
            <div className="mt-6 font-space-grotesk text-xs leading-relaxed md:text-sm">
              <p className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">your stack</p>
              <p className="mt-1 text-[var(--foreground)]">{stack.active.map((item) => item.name).join(' · ')}</p>
              <p className="mt-3">
                <span className="font-vt323 text-2xl leading-none" style={{ color: colorValue }}>{money(stack.monthly)}</span>
                <span className="ml-2 text-[var(--text-muted)]">a month{stack.yearly > 0 ? ` + ${money(stack.yearly)} a year` : ''}</span>
              </p>
              <p className="mt-1 text-[var(--text-muted)]">
                builds {stack.can.length} of {DEPEND_FEATURES.length} features.{' '}
                <Link href={STACK_ARTICLE} style={{ color: colorValue }}>change it →</Link>
              </p>
            </div>
          ) : (
            <p className="mt-6 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">
              no stack yet.{' '}
              <Link href={STACK_ARTICLE} style={{ color: colorValue }}>pick what your copy runs on →</Link>
            </p>
          )}

          <p className="mt-6 font-space-grotesk text-xs leading-relaxed text-[var(--foreground)] md:text-sm">
            vote on the components you want to make yours.{' '}
            <span className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>{yours.length}</span> picked,{' '}
            <span className="font-vt323 text-xl leading-none" style={{ color: colorValue }}>{made.length}</span> of {PORTFOLIO.length} made{drafts > 0 ? `, ${drafts} in draft` : ''}.
          </p>
          <p className="mt-2 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
            a component is made once an article is published.
          </p>
        </div>

        <div className="min-w-0">
          <SleekTabs
            label="portfolio"
            tabs={(['YOURS', 'ALL', 'MADE'] as Tab[]).map((id) => ({
              id,
              label: (
                <>
                  {id}. <span className="ml-1 text-[var(--text-muted)]">{split(lists[id]).runs.length}/{lists[id].length}</span>
                </>
              ),
            }))}
            activeId={active}
            onChange={(id) => setTab(id as Tab)}
            accent={colorValue}
          />
          <p className="pb-1 pt-3 font-space-grotesk text-xs text-[var(--text-muted)]">{TAB_PROMISE[active]}</p>
          <div key={`${active}-${page}`} className="stack-page lg:min-h-[30rem]" style={{ ['--turn' as string]: turn }}>
            {list.length === 0 ? (
              <p className="py-6 font-space-grotesk text-sm text-[var(--text-muted)]">
                {active === 'YOURS' ? (
                  <>
                    nothing picked yet.{' '}
                    <button type="button" onClick={() => setTab('ALL')} style={{ color: colorValue }}>see all {PORTFOLIO.length} →</button>
                  </>
                ) : (
                  'nothing made yet.'
                )}
              </p>
            ) : (
              <>
                {shownRuns.length > 0 && <ol>{shownRuns.map(row)}</ol>}
                {shownLocked.length > 0 && (
                  <>
                    <p className={`${shownRuns.length > 0 ? 'mt-6' : ''} font-vt323 text-lg`} style={{ color: colorValue }}>NOT YET.</p>
                    <p className="pb-1 font-space-grotesk text-xs text-[var(--text-muted)]">your stack doesn&apos;t run these. add what one needs and it moves up.</p>
                    <ol>{shownLocked.map((item, i) => row(item, shownRuns.length + i))}</ol>
                  </>
                )}
              </>
            )}
          </div>
          <Pager page={page} pageCount={pageCount} onPage={goTo} color={colorValue} label={`${active.toLowerCase()} pages`} />
        </div>
      </div>
    </div>
  );
}

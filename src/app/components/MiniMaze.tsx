'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { useTheme } from '../contexts/ThemeContext';
import { FOUNDER_CTA } from '../constants/organization';
import { useHydrated } from '@/hooks/useHydrated';
import BuildYours from './build-yours/BuildYours';
import { iconByName } from './icons/byName';
import { wobble } from './ink/pen';
import NamedIcon from './icons/NamedIcon';

const SIZE = 5;
const WALL_ODDS = 0.28;
// Few enough walls and the doubts never get their say
const MIN_WALLS = 4;
const STEP_MS = 130;
const FIRST_WORDS = 'tap where you want to go.';
// As big as its column allows, and never taller than what fits on screen under
// the pinned cover and above the dock. Beside the words from md up
const BOARD = 'w-[min(100%,max(18rem,calc(100svh-19rem)))] md:w-[min(60%,max(18rem,calc(100svh-19rem)))]';

// What stands between someone and building, each with its answer. Tapping one
// (or walking into it) reads the answer, so the maze says what a page would
const WALLS = [
  { icon: 'Clock', answer: 'no time? it is one button.' },
  { icon: 'HelpCircle', answer: 'not technical? you do not need to be.' },
  { icon: 'Bot', answer: 'need an LLM? with or without.' },
  { icon: 'AlertTriangle', answer: 'what if it breaks? fix it, it is yours.' },
  { icon: 'Cloud', answer: 'too expensive? free to start.' },
];
// What a site of your own holds. Each one picked up joins the list by the board
const IDEAS = [
  { icon: 'Edit3', words: 'your words.' },
  { icon: 'Camera', words: 'your photos.' },
  { icon: 'Users', words: 'your people.' },
];

type Cell =
  | { kind: 'open' }
  | { kind: 'wall'; icon: string; answer: string }
  | { kind: 'idea'; icon: string; words: string }
  | { kind: 'goal' };
type Spot = { row: number; col: number };

const START: Spot = { row: 0, col: 0 };
const GOAL: Spot = { row: SIZE - 1, col: SIZE - 1 };
const same = (a: Spot, b: Spot) => a.row === b.row && a.col === b.col;
const STEPS = [{ row: 1, col: 0 }, { row: -1, col: 0 }, { row: 0, col: 1 }, { row: 0, col: -1 }];
const center = (n: number) => (n + 0.5) * (100 / SIZE);
const shuffled = <T,>(items: T[]) => items.map((item) => [Math.random(), item] as const).sort((a, b) => a[0] - b[0]).map(([, item]) => item);

/** The shortest way from one cell to another around the walls, or null */
function routeTo(maze: Cell[][], from: Spot, to: Spot): Spot[] | null {
  const key = (spot: Spot) => spot.row * SIZE + spot.col;
  const came = new Map<number, Spot | null>([[key(from), null]]);
  const queue = [from];
  while (queue.length) {
    const at = queue.shift()!;
    if (same(at, to)) {
      const route: Spot[] = [];
      for (let spot: Spot | null | undefined = at; spot && !same(spot, from); spot = came.get(key(spot))) route.unshift(spot);
      return route;
    }
    for (const step of STEPS) {
      const next = { row: at.row + step.row, col: at.col + step.col };
      const cell = maze[next.row]?.[next.col];
      if (cell && cell.kind !== 'wall' && !came.has(key(next))) {
        came.set(key(next), at);
        queue.push(next);
      }
    }
  }
  return null;
}

/** A new maze: walls anywhere but the two ends, with the goal and every idea reachable */
function newMaze(): Cell[][] {
  for (;;) {
    const answers = shuffled(WALLS);
    let dealt = 0;
    const maze: Cell[][] = Array.from({ length: SIZE }, (_, row) =>
      Array.from({ length: SIZE }, (_, col): Cell => {
        const spot = { row, col };
        if (same(spot, START)) return { kind: 'open' };
        if (same(spot, GOAL)) return { kind: 'goal' };
        return Math.random() < WALL_ODDS ? { kind: 'wall', ...answers[dealt++ % answers.length] } : { kind: 'open' };
      })
    );
    if (dealt < MIN_WALLS || !routeTo(maze, START, GOAL)) continue;
    const spots = maze.flatMap((cells, row) =>
      cells.flatMap((cell, col) => {
        const spot = { row, col };
        return cell.kind === 'open' && !same(spot, START) && routeTo(maze, START, spot) ? [spot] : [];
      })
    );
    if (spots.length < IDEAS.length) continue;
    shuffled(spots).slice(0, IDEAS.length).forEach((spot, index) => {
      maze[spot.row][spot.col] = { kind: 'idea', ...IDEAS[index] };
    });
    return maze;
  }
}

/** One step of the path as a pen makes it: a slight bow, never ruled */
function penStep(from: Spot, to: Spot, index: number): string {
  const [ax, ay, bx, by] = [center(from.col), center(from.row), center(to.col), center(to.row)];
  return `M${ax} ${ay}Q${(ax + bx) / 2 + wobble(index, 1.4)} ${(ay + by) / 2 + wobble(index + 11, 1.4)} ${bx} ${by}`;
}

/**
 * MiniMaze - walk your icon to the heart, past what stops people from building.
 * The player is the Poem icon (or `player`), so someone who drew their own walks
 * it in their own hand.
 *
 * Walls are the doubts: tapping one, or walking into it, reads its answer. Ideas
 * are what a site of your own holds: each one picked up joins the list by the
 * board, which fills in as you go. The heart is the site's ask (founder.cta),
 * not a score. Tapping any cell walks there the short way, and arrow keys step,
 * so the page keeps its own scrolling and the board can be as big as the screen
 * allows. It never takes focus by itself. Reduced motion shows every step
 * finished and still.
 */
export default function MiniMaze({ player = 'Poem' }: { player?: string }) {
  const { colorValue } = useTheme();
  const hydrated = useHydrated();
  // Random, so it only renders once hydrated
  const [maze, setMaze] = useState(newMaze);
  const [path, setPath] = useState<Spot[]>([START]);
  const [ahead, setAhead] = useState<Spot[]>([]);
  const [held, setHeld] = useState<{ key: string; icon: string; words: string }[]>([]);
  const [line, setLine] = useState(FIRST_WORDS);
  const [bump, setBump] = useState<Spot | null>(null);
  const bumpTimer = useRef<number | undefined>(undefined);
  const askRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => window.clearTimeout(bumpTimer.current), []);

  const at = path[path.length - 1];
  const won = same(at, GOAL);
  const Goal = iconByName('Heart')!;
  const cta = FOUNDER_CTA;

  // The ask lands above the dock, not behind it
  useEffect(() => {
    if (!won) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    askRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [won]);

  const hitWall = useCallback((row: number, col: number, answer: string) => {
    setAhead([]);
    setLine(answer);
    setBump({ row, col });
    window.clearTimeout(bumpTimer.current);
    bumpTimer.current = window.setTimeout(() => setBump(null), 520);
  }, []);

  const arrive = useCallback((spot: Spot) => {
    const cell = maze[spot.row][spot.col];
    setPath((current) => [...current, spot]);
    if (cell.kind === 'idea') {
      const key = `${spot.row}-${spot.col}`;
      setHeld((current) => (current.some((idea) => idea.key === key) ? current : [...current, { key, icon: cell.icon, words: cell.words }]));
      setLine(cell.words);
    }
    if (cell.kind === 'goal') {
      setAhead([]);
      setLine('you got there.');
      track('maze_finished', { player });
    }
  }, [maze, player]);

  // Walk the route a step at a time, so a tap reads as walking there
  useEffect(() => {
    if (!ahead.length) return;
    const timer = window.setTimeout(() => {
      arrive(ahead[0]);
      setAhead((current) => current.slice(1));
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [ahead, arrive]);

  const tap = (row: number, col: number) => {
    if (won) return;
    const cell = maze[row][col];
    if (cell.kind === 'wall') return hitWall(row, col, cell.answer);
    setAhead(routeTo(maze, at, { row, col }) ?? []);
  };

  const onKey = (event: React.KeyboardEvent) => {
    const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    if (!step) return;
    event.preventDefault();
    if (won) return;
    const row = at.row + step[0];
    const col = at.col + step[1];
    const cell = maze[row]?.[col];
    if (!cell) return;
    if (cell.kind === 'wall') return hitWall(row, col, cell.answer);
    setAhead([]);
    arrive({ row, col });
  };

  const again = () => {
    setMaze(newMaze());
    setPath([START]);
    setAhead([]);
    setHeld([]);
    setBump(null);
    setLine(FIRST_WORDS);
  };

  // Keeps its room before it hydrates, so the page doesn't jump
  if (!hydrated) return <div className={`aspect-square ${BOARD}`} aria-hidden="true" />;

  return (
    <div className="flex flex-col gap-6 text-left md:flex-row md:items-start md:gap-8">
      <div
        role="application"
        tabIndex={0}
        aria-label="A five by five maze. Use the arrow keys to reach the heart."
        onKeyDown={onKey}
        className={`relative aspect-square shrink-0 select-none overflow-hidden rounded-2xl border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${BOARD}`}
        style={{ borderColor: colorValue, outlineColor: colorValue }}
      >
        <div className="grid size-full grid-cols-5 grid-rows-5">
          {maze.map((cells, row) =>
            cells.map((cell, col) => {
              const Icon = cell.kind === 'wall' || cell.kind === 'idea' ? iconByName(cell.icon) : null;
              const bumped = bump?.row === row && bump?.col === col;
              const gone = cell.kind === 'idea' && held.some((idea) => idea.key === `${row}-${col}`);
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => tap(row, col)}
                  className="grid cursor-pointer place-items-center border transition-colors hover:bg-[var(--background-highlight)]"
                  style={{ borderColor: `${colorValue}1f`, backgroundColor: gone ? `${colorValue}1f` : undefined }}
                >
                  {cell.kind === 'wall' && Icon && (
                    <span className={`grid size-[56%] place-items-center ${bumped ? 'maze-bump' : ''}`}>
                      <Icon size="100%" style={{ color: bumped ? colorValue : 'var(--text-muted)' }} />
                    </span>
                  )}
                  {cell.kind === 'idea' && Icon && !gone && (
                    <span className="grid size-[56%] place-items-center">
                      <Icon size="100%" color={colorValue} />
                    </span>
                  )}
                  {cell.kind === 'goal' && (
                    <span className={`relative grid place-items-center ${won ? 'maze-bump size-[92%]' : 'size-[70%] animate-pulse motion-reduce:animate-none'}`}>
                      <Goal size="100%" color={colorValue} />
                      {/* There: your icon, inside the heart */}
                      {won && <span className="absolute inset-0 m-auto grid size-[36%] place-items-center"><NamedIcon name={player} fallback="Poem" size="100%" color={colorValue} /></span>}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* The way you came, in pen, one stroke a step */}
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true" fill="none" stroke={colorValue} strokeWidth={1.4} strokeLinecap="round" opacity={0.75}>
          {path.slice(1).map((spot, index) => (
            <path key={index} className="maze-step" pathLength={1} d={penStep(path[index], spot, index)} />
          ))}
        </svg>

        {!won && (
          <div
            className="pointer-events-none absolute left-0 top-0 grid size-[20%] place-items-center transition-transform ease-linear motion-reduce:transition-none"
            style={{ transform: `translate(${at.col * 100}%, ${at.row * 100}%)`, transitionDuration: `${STEP_MS}ms` }}
          >
            {/* Waddles, a side a step, like a poem's icon does */}
            <span
              className="grid size-[78%] place-items-center rounded-full bg-[var(--background)] transition-transform motion-reduce:transition-none"
              style={{ transform: `rotate(${path.length % 2 ? -8 : 8}deg)`, transitionDuration: `${STEP_MS}ms` }}
            >
              <NamedIcon name={player} fallback="Poem" size="84%" color={colorValue} />
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-5">
        <p className="min-h-[3.5rem] font-vt323 text-3xl leading-none text-[var(--foreground)] md:min-h-[5rem] md:text-4xl" aria-live="polite">{line}</p>

        <ul className="flex flex-col gap-3" aria-label="What you picked up">
          {held.map((idea) => {
            const Icon = iconByName(idea.icon);
            return (
              <li key={idea.key} className="maze-pop flex items-center gap-3 font-space-grotesk text-sm text-[var(--foreground)]">
                {Icon && <Icon size={24} color={colorValue} />}
                {idea.words}
              </li>
            );
          })}
        </ul>

        {won && (
          <div ref={askRef} className="maze-pop flex scroll-mb-28 flex-col items-start gap-3">
            {cta?.pitch && <p className="font-space-grotesk text-sm text-[var(--text-muted)]">{cta.pitch}</p>}
            {cta && (
              <Link
                href={cta.href}
                onClick={() => track('cta_clicked', { cta: cta.label, placement: 'maze' })}
                aria-label={cta.label}
                className="inline-flex min-h-12 items-center rounded-full px-5 py-2 transition-transform hover:-translate-y-px"
                style={{ backgroundColor: colorValue }}
              >
                <BuildYours color={colorValue} words="always" />
              </Link>
            )}
            <button type="button" onClick={again} className="min-h-10 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] underline underline-offset-4">
              walk it again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

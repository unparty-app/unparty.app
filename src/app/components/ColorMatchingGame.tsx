'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalStorageValue, writeLocalStorage } from '@/hooks/useLocalStorage';
import { useColorSelection } from '../contexts/ColorSelectionContext';
import { colors } from '../constants/colors';
import ActionPill from './build-yours/ActionPill';
import InkStage from './ink/InkStage';
import { InkLine, InkMark } from './ink/primitives';
import { penPath, wobble } from './ink/pen';
import { Play, RotateCcw } from '@/app/components/icons';

// Default fallback colors if user hasn't selected colors
const DEFAULT_GAME_COLORS = [
  colors.brand,
  colors.electricPurple,
  colors.electricGreen,
  colors.electricBlue,
  colors.neonPink,
  colors.starblack,
];

type GameState = 'start' | 'showing' | 'playing' | 'gameover';

// A random color's index. Only ever called from a tap (start, the next color), never while rendering
const randomIndex = (count: number) => Math.floor(Math.random() * count);

const W = 640;
const H = 30;
const STROKE = 12;

const strokeFor = (row: number) =>
  penPath(Array.from({ length: 9 }, (_, i) => [8 + (i / 8) * (W - 16), H / 2 + wobble(i + row * 31, 5)] as const));

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The memory game, played on your own colors: one pen stroke each, the same
 * lines as your palette (InkPalette). Watch them light in order, then tap them
 * back. It speeds up every three rounds. A tally mark lands in that color with
 * each right tap, the way InkTimeline tallies its months, and a wrong tap lights
 * the line it should have been. Your best run is kept on this device.
 */
const ColorMemoryGame = () => {
  const { colorValue } = useTheme();
  const { allColors } = useColorSelection();

  // Your colors once you have five, otherwise the site's
  const gameColors = useMemo(() => (allColors.length >= 5 ? allColors.slice(0, 6) : DEFAULT_GAME_COLORS), [allColors]);

  const [gameState, setGameState] = useState<GameState>('start');
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [missedColor, setMissedColor] = useState<number | null>(null);

  // Each showing belongs to a run; stopping or restarting ends it, so a stopped
  // showing can't finish later and hand the board back
  const run = useRef(0);

  const storedBest = parseInt(useLocalStorageValue('colorGameHighScore') ?? '', 10) || 0;
  const [sessionBest, setSessionBest] = useState(0);
  const best = Math.max(storedBest, sessionBest);

  const resetBoard = () => {
    setGameState('start');
    setSequence([]);
    setCurrentStep(0);
    setScore(0);
    setActiveColor(null);
    setMissedColor(null);
  };

  // A color change mid-game goes back to the start (adjusting state while
  // rendering when the colors change, rather than in an effect)
  const [colorsInPlay, setColorsInPlay] = useState(gameColors);
  if (colorsInPlay !== gameColors) {
    setColorsInPlay(gameColors);
    if (gameState !== 'start') resetBoard();
  }
  useEffect(() => {
    run.current += 1;
  }, [gameColors]);

  // Ends any showing when the game leaves the page
  useEffect(
    () => () => {
      run.current += 1;
    },
    []
  );

  const showSequence = async (next: number[], level: number, pause = 800) => {
    run.current += 1;
    const mine = run.current;
    setActiveColor(null);
    setCurrentStep(0);
    await wait(pause);
    // Faster as the level climbs
    const displayTime = Math.max(400, 800 - level * 50);
    const gapTime = Math.max(200, 400 - level * 25);
    for (let i = 0; i < next.length; i++) {
      if (run.current !== mine) return;
      setActiveColor(next[i]);
      await wait(displayTime);
      if (run.current !== mine) return;
      setActiveColor(null);
      if (i < next.length - 1) await wait(gapTime);
    }
    await wait(400);
    if (run.current !== mine) return;
    setGameState('playing');
  };

  const startGame = () => {
    const first = [randomIndex(gameColors.length)];
    setSequence(first);
    setScore(0);
    setMissedColor(null);
    setGameState('showing');
    showSequence(first, 1);
  };

  const stopGame = () => {
    run.current += 1;
    resetBoard();
  };

  const handleTap = (tapped: number) => {
    if (gameState !== 'playing') return;

    if (tapped !== sequence[currentStep]) {
      setMissedColor(sequence[currentStep]);
      setGameState('gameover');
      return;
    }

    setActiveColor(tapped);
    setTimeout(() => setActiveColor((now) => (now === tapped ? null : now)), 180);

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    if (nextStep < sequence.length) return;

    // The whole sequence, right: one longer, and every three, a little faster
    const newScore = score + 1;
    setScore(newScore);
    if (newScore > best) {
      setSessionBest(newScore);
      writeLocalStorage('colorGameHighScore', newScore.toString());
    }
    const next = [...sequence, randomIndex(gameColors.length)];
    setSequence(next);
    setGameState('showing');
    showSequence(next, Math.floor(newScore / 3) + 1, 1000);
  };

  const status =
    gameState === 'start'
      ? 'watch the lines light up, then tap them back in order.'
      : gameState === 'showing'
        ? 'watch.'
        : gameState === 'playing'
          ? 'your turn.'
          : score > 0
            ? `it was this one. you remembered ${score}.`
            : 'it was this one.';

  return (
    <InkStage className="w-full max-w-xl text-left">
      <ul className="flex flex-col" aria-label="The colors">
        {gameColors.map((color, index) => {
          const lit = activeColor === index || missedColor === index;
          const resting = gameState === 'playing' ? 0.85 : 0.45;
          return (
            <li key={`${index}-${color}`}>
              <button
                type="button"
                onClick={() => handleTap(index)}
                disabled={gameState !== 'playing'}
                data-lit={lit || undefined}
                aria-label={`Color ${index + 1}, ${color}`}
                className="block min-h-12 w-full rounded py-2 outline-none transition-transform duration-150 focus-visible:ring-2 enabled:hover:scale-[1.01] enabled:active:scale-[0.99]"
                style={{ ['--tw-ring-color' as string]: colorValue, transform: lit ? 'scaleY(1.7)' : undefined }}
              >
                <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
                  {/* Under every stroke, undimmed and brighter when lit, so a color close to the page's own still reads and still lights */}
                  <InkLine d={strokeFor(index)} beat={index * 3} length={W} width={STROKE + 5} color="var(--foreground)" opacity={lit ? 0.6 : 0.2} />
                  <g className="transition-opacity duration-150" style={{ opacity: lit ? 1 : resting }}>
                    <InkLine d={strokeFor(index)} beat={index * 3} length={W} width={STROKE} color={color} />
                  </g>
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      {/* A tally of this round: each right tap lands in its color */}
      <div className="mt-3 flex min-h-7 flex-wrap items-center gap-1" aria-hidden="true">
        {sequence.map((colorIndex, step) => (
          <svg key={`${sequence.length}-${step}-${step < currentStep}`} viewBox="0 0 10 24" className="h-6 w-2.5 overflow-visible">
            <InkMark
              d={`M${5 + wobble(step + 3, 1.6)} 3 L${5 + wobble(step + 9, 1.6)} 21`}
              width={step < currentStep ? 3 : 1.6}
              color={step < currentStep ? gameColors[colorIndex] : 'var(--text-muted)'}
              opacity={step < currentStep ? 1 : 0.35}
            />
          </svg>
        ))}
      </div>

      <p className="mt-2 font-space-grotesk text-sm leading-relaxed text-[var(--foreground)]" aria-live="polite">
        {status}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {gameState === 'start' || gameState === 'gameover' ? (
          <ActionPill verb="start" icon={Play} color={colorValue} label={gameState === 'gameover' ? 'Try again' : 'Start the game'} onClick={startGame} />
        ) : (
          <ActionPill verb="stop" icon={RotateCcw} color={colorValue} variant="line" label="Stop the game" onClick={stopGame} />
        )}
        {best > 0 && <span className="font-vt323 text-lg leading-none text-[var(--text-muted)]">your best: {best}.</span>}
      </div>
    </InkStage>
  );
};

export default ColorMemoryGame;

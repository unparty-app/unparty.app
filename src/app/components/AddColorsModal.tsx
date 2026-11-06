'use client';

import { useState } from 'react';
import { Check, Upload, X } from '@/app/components/icons';
import Modal from './Modal';
import UnpppCircle from './UnpppCircle';
import ActionPill from './build-yours/ActionPill';
import { InkCircle, InkUnderline } from './depend/ink';
import { InkStrip } from './InkPalette';
import { useTheme } from '../contexts/ThemeContext';
import { useColorSelection } from '../contexts/ColorSelectionContext';
import { colors } from '../constants/colors';
import { resolveCoverSrc } from '../utils/coverPath';
import coverColors from '../covers/cover-colors.json';

const PRESET_COLORS = [...new Set(Object.values(colors))];
// Real covers only, one of each palette: the file also holds badges and icons,
// and the ones its extractor couldn't read all share one fallback palette
const COVER_PALETTES = [
  ...new Map(
    Object.entries(coverColors as Record<string, string[]>)
      .filter(([id]) => id.startsWith('cover-'))
      .map(([id, palette]) => [palette.join('|'), [id, palette] as const])
  ).values(),
];
const PALETTES_AT_A_TIME = 12;
const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';

interface AddColorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Import is easy to miss on first visit, so it's offered here too -
  // switches over to ImportColorsCssModal instead of stacking modals.
  onImportClick: () => void;
}

/**
 * Building a palette by hand: type a color, take a cover's palette, or tap a
 * preset. The modal covers the page, so the five strokes stay pinned at the top
 * and fill as you go (InkStrip): tap one to clear it. Every color goes straight
 * onto the palette, and a cover's palette replaces all five and whatever brand
 * was imported with them.
 */
const AddColorsModal: React.FC<AddColorsModalProps> = ({ isOpen, onClose, onImportClick }) => {
  const { colorValue } = useTheme();
  const { selectedColors, setSelectedColors, customColors, setCustomColors, setBrand } = useColorSelection();
  const [typed, setTyped] = useState('');
  const [palettesShown, setPalettesShown] = useState(PALETTES_AT_A_TIME);

  const slots = selectedColors.length === 5 ? selectedColors : new Array<string>(5).fill('');
  const filled = slots.filter(Boolean).length;
  const full = filled === 5;

  const entered = typed.trim().startsWith('#') ? typed.trim() : `#${typed.trim()}`;
  const isValidColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(entered);
  const isPicked = (color: string) => slots.some((slot) => slot.toLowerCase() === color.toLowerCase());

  const addColor = (color: string) => {
    if (full || isPicked(color)) return;
    const next = [...slots];
    next[next.findIndex((slot) => !slot)] = color;
    setSelectedColors(next);
  };

  const clearColor = (index: number) => {
    const next = [...slots];
    next[index] = '';
    setSelectedColors(next);
  };

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidColor) return;
    addColor(entered.toUpperCase());
    setTyped('');
  };

  const applyPalette = (paletteColors: string[]) => {
    setSelectedColors([...paletteColors]);
    setBrand({});
  };

  const paletteInUse = slots.join('|');
  const hasMorePalettes = palettesShown < COVER_PALETTES.length;
  const dot = 'relative grid size-11 place-items-center rounded-full outline-none transition-transform duration-150 focus-visible:ring-2 enabled:hover:scale-110 enabled:active:scale-95 disabled:cursor-not-allowed';

  return (
    <Modal isOpen={isOpen} onCloseAction={onClose} variant="tall">
      <div className="space-y-8 text-left">
        <div>
          <h2 className="pr-8 font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">add your colors.</h2>
          <InkUnderline color={colorValue} className="mt-1 h-2 w-28" />
        </div>

        {/* Your five, always in sight: the modal scrolls under them */}
        <div className="sticky -top-6 z-10 -mx-6 px-6 py-3" style={{ backgroundColor: 'var(--background)' }}>
          <InkStrip colors={slots} onRemove={clearColor} />
          <div className="mt-2 flex min-h-10 flex-wrap items-center gap-3" aria-live="polite">
            <p className={LABEL}>{full ? 'all five picked. tap a line to clear it' : `${5 - filled} of 5 left to pick`}</p>
            {full && <ActionPill verb="take it" icon={Check} color={colorValue} label="Done, back to your colors" onClick={onClose} />}
          </div>
        </div>

        {/* Type one: the pen line takes the color as soon as it's a color */}
        <form onSubmit={submitTyped} className="flex items-end gap-3">
          <label className="relative block min-w-0 flex-1">
            <span className={LABEL}>type one.</span>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="#RRGGBB"
              autoComplete="off"
              spellCheck={false}
              maxLength={7}
              className="mt-1 block w-full bg-transparent pb-2 font-vt323 text-2xl uppercase leading-none text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <InkUnderline color={isValidColor ? entered : colorValue} className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-40" />
          </label>
          <button
            type="submit"
            disabled={!isValidColor || full || isPicked(entered)}
            className="inline-flex h-10 shrink-0 items-center rounded-full border px-4 font-google-sans-code text-xs transition-transform duration-200 enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ borderColor: colorValue, color: colorValue }}
          >
            add
          </button>
        </form>

        {/* Colors kept from before: each can go on the palette, or go */}
        {customColors.length > 0 && (
          <div>
            <p className={LABEL}>kept from before.</p>
            <ul className="mt-2 flex flex-wrap gap-1">
              {customColors.map((color) => (
                <li key={color} className="flex items-center">
                  <button type="button" onClick={() => addColor(color)} disabled={full || isPicked(color)} aria-label={`Add ${color}`} className={`${dot} disabled:opacity-40`} style={{ ['--tw-ring-color' as string]: colorValue }}>
                    <span className="size-6 rounded-full" style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px var(--border)' }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomColors(customColors.filter((c) => c !== color))}
                    aria-label={`Forget ${color}`}
                    className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* A cover's five, taken whole */}
        {COVER_PALETTES.length > 0 && (
          <div>
            <p className={LABEL}>take a cover&apos;s.</p>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {COVER_PALETTES.slice(0, palettesShown).map(([id, paletteColors]) => {
                const inUse = paletteInUse === paletteColors.join('|');
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => applyPalette(paletteColors)}
                      aria-pressed={inUse}
                      aria-label={`Use the colors of ${id}`}
                      className="relative flex min-h-12 w-full items-center gap-3 rounded py-1 text-left outline-none transition-opacity duration-150 hover:opacity-80 focus-visible:ring-2"
                      style={{ ['--tw-ring-color' as string]: colorValue }}
                    >
                      <span className="relative shrink-0">
                        <UnpppCircle src={resolveCoverSrc(id)} color={paletteColors[0]} size={32} />
                        {inUse && <InkCircle color={colorValue} className="absolute -left-1 -top-1 size-10" />}
                      </span>
                      <InkStrip colors={paletteColors} className="min-w-0 flex-1" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {hasMorePalettes && (
              <button
                type="button"
                onClick={() => setPalettesShown((shown) => Math.min(shown + PALETTES_AT_A_TIME, COVER_PALETTES.length))}
                className="mt-3 font-space-grotesk text-sm text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
              >
                show more covers
              </button>
            )}
          </div>
        )}

        {/* One at a time */}
        <div>
          <p className={LABEL}>or tap them one at a time.</p>
          <ul className="mt-2 flex flex-wrap">
            {PRESET_COLORS.map((color) => {
              const picked = isPicked(color);
              return (
                <li key={color}>
                  <button
                    type="button"
                    onClick={() => addColor(color)}
                    disabled={picked || full}
                    aria-pressed={picked}
                    aria-label={`Add ${color}`}
                    className={`${dot} ${full && !picked ? 'disabled:opacity-40' : ''}`}
                    style={{ ['--tw-ring-color' as string]: colorValue }}
                  >
                    <span className="size-6 rounded-full" style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px var(--border)' }} />
                    {picked && <InkCircle color={colorValue} className="absolute inset-1 size-9" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={onImportClick}
          className="inline-flex items-center gap-2 font-space-grotesk text-sm text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
        >
          <Upload size={18} color={colorValue} />
          have an UNCOLOR .css? import it
        </button>
      </div>
    </Modal>
  );
};

export default AddColorsModal;

"use client";

import { useTheme } from '../contexts/ThemeContext';
import { BUILD_TYPES } from '@/lib/word-types';

interface BuildTypePickerProps {
  disabled: boolean; // Nothing picked yet, or a save under way
  canUntag: boolean; // Something picked already carries a kind
  onPick: (type: string | null) => void; // A kind of build, or null to untag
}

/**
 * The eight kinds of build as a row to tag picked words with: the owner's tags
 * in /admin (WordTags) and a reader's own on the worksheet. Saving what's
 * picked belongs to whoever uses it, since the two go to different places.
 */
export default function BuildTypePicker({ disabled, canUntag, onPick }: BuildTypePickerProps) {
  const { colorValue } = useTheme();
  return (
    <div role="group" aria-label="Kinds of build" className="mt-3 flex flex-wrap gap-2">
      {BUILD_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(type.id)}
          title={type.definition}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-google-sans-code text-xs text-[var(--foreground)] transition-colors hover:bg-[var(--background-highlight)] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: `${colorValue}66` }}
        >
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: type.color ?? colorValue }} />
          {type.id}
        </button>
      ))}
      <button
        type="button"
        disabled={!canUntag}
        onClick={() => onPick(null)}
        className="rounded-full px-3 py-1 font-google-sans-code text-xs text-[var(--text-muted)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        untag
      </button>
    </div>
  );
}

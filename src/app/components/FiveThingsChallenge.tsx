'use client';
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useHydrated } from '@/hooks/useHydrated';
import { useLocalStorageValue, writeLocalStorage } from '@/hooks/useLocalStorage';

interface FiveThingsChallengeProps {
  prompt?: string;
  placeholders?: string[];
}

const DEFAULT_PLACEHOLDERS = [
  'X GON GIVE IT TO YA - DMX',
  'PURE IMAGINATION - KEVIN GARRETT',
  'PRETTY & PETTY - CARDI B',
  'HEART OF THE CITY - JAŸ-Z',
  'FORREST GUMP - FRANK OCEAN',
];

const STORAGE_KEY = 'five_things_challenge';

function parseSavedItems(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { items: string[]; submitted: boolean };
    return Array.isArray(data.items) && data.items.length === 5 && data.submitted ? data.items : null;
  } catch {
    return null; // ignore parse errors
  }
}

const FiveThingsChallenge: React.FC<FiveThingsChallengeProps> = ({
  prompt = 'ADD. 5 THINGS TO REMEMBER.',
  placeholders = DEFAULT_PLACEHOLDERS
}) => {
  const { colorValue } = useTheme();
  const [items, setItems] = useState<string[]>(['', '', '', '', '']);
  const mounted = useHydrated();

  // A submitted list persists in localStorage; the session copy covers
  // blocked storage. Reset clears both.
  const savedItems = parseSavedItems(useLocalStorageValue(STORAGE_KEY));
  const [submittedItems, setSubmittedItems] = useState<string[] | null>(null);
  const finalItems = submittedItems ?? savedItems;

  const allFilled = items.every(item => item.trim().length > 0);

  const handleChange = (index: number, value: string) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!allFilled) return;
    setSubmittedItems(items);
    writeLocalStorage(STORAGE_KEY, JSON.stringify({ items, submitted: true }));
  };

  const handleReset = () => {
    setSubmittedItems(null);
    setItems(['', '', '', '', '']);
    writeLocalStorage(STORAGE_KEY, null);
  };

  if (!mounted) return null;

  if (finalItems) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8">
        <div
          className="rounded-lg p-6 border-2"
          style={{ borderColor: colorValue, backgroundColor: 'var(--background)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="font-vt323 text-2xl uppercase tracking-widest" style={{ color: colorValue }}>
              MY LIST.
            </span>
            <button
              onClick={handleReset}
              className="font-vt323 text-base uppercase tracking-wider hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              EDIT
            </button>
          </div>
          <ol className="space-y-5">
            {finalItems.map((item, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span
                  className="font-vt323 text-2xl mt-0.5 shrink-0 w-6 text-right leading-none"
                  style={{ color: colorValue }}
                >
                  {i + 1}.
                </span>
                <p className="font-rounded text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  {item}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <div
        className="rounded-lg p-6 border border-gray-200/20 dark:border-gray-700/20"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <p className="font-vt323 text-xl uppercase tracking-wider mb-6 leading-snug" style={{ color: 'var(--foreground)' }}>
          ⚡ {prompt}
        </p>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <span
                className="font-vt323 text-xl shrink-0 w-6 text-right leading-none"
                style={{ color: colorValue }}
              >
                {i + 1}.
              </span>
              <input
                type="text"
                value={item}
                onChange={e => handleChange(i, e.target.value)}
                placeholder={placeholders[i] ?? DEFAULT_PLACEHOLDERS[i]}
                className="flex-1 bg-transparent border-b border-gray-300/40 dark:border-gray-600/40 outline-none py-2 font-google-sans-code text-sm placeholder:opacity-40 transition-colors focus:border-current"
                style={{ color: 'var(--foreground)' }}
                onFocus={e => { e.target.style.borderColor = colorValue; }}
                onBlur={e => { e.target.style.borderColor = ''; }}
              />
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!allFilled}
            className="font-vt323 text-2xl uppercase tracking-widest px-10 py-3 rounded transition-all duration-200"
            style={{
              backgroundColor: allFilled ? colorValue : 'transparent',
              color: allFilled ? '#000000' : 'var(--text-muted)',
              border: `2px solid ${allFilled ? colorValue : 'var(--text-muted)'}`,
              cursor: allFilled ? 'pointer' : 'not-allowed',
              opacity: allFilled ? 1 : 0.5,
            }}
          >
            UNPARTY
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiveThingsChallenge;

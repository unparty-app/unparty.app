'use client';

import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLlmKey } from './useLlmKey';

/**
 * "Use your own key": where a visitor connects their own Anthropic key, or
 * forgets it. Small and quiet, under the features that use a model. The key
 * stays in this tab (useLlmKey).
 */
export default function LlmKeyControl({ className = '' }: { className?: string }) {
  const { colorValue } = useTheme();
  const { hasKey, save, forget } = useLlmKey();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  if (hasKey) {
    return (
      <p className={`font-google-sans-code text-xs ${className}`} style={{ color: 'var(--text-muted)' }}>
        using your own key in this tab ·{' '}
        <button type="button" onClick={forget} className="underline decoration-dotted underline-offset-4" style={{ color: colorValue }}>
          forget it
        </button>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`font-google-sans-code text-xs underline decoration-dotted underline-offset-4 ${className}`}
        style={{ color: 'var(--text-muted)' }}
      >
        use your own key
      </button>
    );
  }

  const use = () => {
    if (!draft.trim()) return;
    save(draft);
    setDraft('');
    setOpen(false);
  };

  // Not a <form>: it sits next to other forms (NextStep's), and a form can't nest
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <input
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            use();
          }
        }}
        placeholder="your Anthropic API key"
        aria-label="Your Anthropic API key"
        className="min-w-0 flex-1 rounded border bg-transparent px-3 py-1.5 font-google-sans-code text-xs outline-none"
        style={{ borderColor: colorValue }}
      />
      <button type="button" onClick={use} className="font-google-sans-code text-xs uppercase tracking-wider" style={{ color: colorValue }}>
        USE.
      </button>
      <span className="w-full font-google-sans-code text-[11px]" style={{ color: 'var(--text-muted)' }}>
        stays in this tab, goes straight to Anthropic, never saved.
      </span>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

// Shared code snippet block for the visual and reader article renderers:
// a quiet header strip with the language label and a copy action that
// writes the raw snippet text to the clipboard (safe to paste in a terminal).
// A ```poem never gets here: it walks the story instead (PoemWalker).
export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / permissions) — leave the
      // button in its resting state so the user can select the text manually
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-background-highlight px-4 py-2">
        <span className="font-google-sans-code text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="font-google-sans-code text-xs uppercase tracking-wider transition-opacity hover:opacity-70"
          style={{ color: copied ? 'var(--theme-color)' : 'var(--text-muted)' }}
        >
          {copied ? 'copied ✓' : 'copy'}
        </button>
      </div>
      {/* A prompt is sentences, so it wraps; code keeps its lines and scrolls */}
      <pre className={language === 'prompt' ? 'whitespace-pre-wrap break-words p-4' : 'overflow-x-auto p-4'}>
        <code className="font-geist-mono-google text-sm leading-relaxed">{code}</code>
      </pre>
    </div>
  );
}

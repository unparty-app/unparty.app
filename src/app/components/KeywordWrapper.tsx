'use client';

import React, { useMemo, useState } from 'react';
import KeywordModal from './KeywordModal';
import { highlightKeywordsInHtml } from '../utils/keywordDetection';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface KeywordWrapperProps {
  html: string;
  className?: string;
}

/**
 * Client component that highlights keyword terms in HTML content and makes
 * them clickable. Highlighting itself runs here, at render time, on whatever
 * already-formatted HTML it's given - not just content that happened to pass
 * through a markdown-to-editorial converter at generation time - so it works
 * the same for hand-authored article content too. Gated by the site-wide
 * admin setting (see AppSettingsContext / /admin/settings).
 *
 * Clicks are handled via delegation on the wrapping span's own onClick,
 * rather than a useEffect that queries for `.keyword-term` children and
 * imperatively attaches/removes DOM listeners on them. That pattern
 * previously left some keyword spans with no working listener at all: a
 * span duplicated into StickyHeroStack's always-mounted pinned-hero portal
 * (rendered once for the in-flow copy, once for the portal, both from the
 * same section data) triggers repeated effect cleanup/re-run cycles that
 * don't reliably end in a re-attached state. Delegation sidesteps the whole
 * class of bug - there's no separate listener lifecycle to keep in sync
 * with the DOM at all, just this element's own onClick, which React already
 * guarantees is live for as long as the element is rendered.
 */
const KeywordWrapper: React.FC<KeywordWrapperProps> = ({ html, className = '' }) => {
  const { keywordHighlightingEnabled } = useAppSettings();
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const processedHtml = useMemo(
    () => (keywordHighlightingEnabled ? highlightKeywordsInHtml(html) : html),
    [html, keywordHighlightingEnabled]
  );

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!keywordHighlightingEnabled) return;
    const keywordEl = (e.target as HTMLElement).closest('.keyword-term');
    if (!keywordEl) return;
    const keyword = keywordEl.getAttribute('data-keyword');
    if (keyword) {
      e.preventDefault();
      setSelectedKeyword(keyword);
    }
  };

  return (
    <>
      <span
        className={className}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />

      <KeywordModal
        keyword={selectedKeyword || ''}
        isOpen={!!selectedKeyword}
        onClose={() => setSelectedKeyword(null)}
      />
    </>
  );
};

export default KeywordWrapper;

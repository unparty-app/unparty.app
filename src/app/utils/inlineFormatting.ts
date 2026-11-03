/**
 * Inline formatting utilities for markdown processing
 * Client-safe utilities without Node.js dependencies (no fs, path)
 */

import { escapeHtml } from './textParsing';

/**
 * Process inline markdown formatting (bold, italic, strikethrough, links, code)
 * This function is safe to use in both client and server components.
 *
 * Keyword highlighting is NOT done here - it used to be, but that meant only
 * content passing through this function (markdown/story-sourced articles) at
 * generation time ever got keyword-term spans, while hand-authored content
 * silently got none. Keyword highlighting now happens once, at render time,
 * in KeywordWrapper (see highlightKeywordsInHtml in keywordDetection.ts),
 * which runs uniformly on this function's output regardless of source.
 */
export function processInlineFormatting(content: string): string {
  if (!content) return content;

  let processed = content;

  // Handle links: [text](url) -> <a href="url">text</a> - must run before bold/italic
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="theme-link">$1</a>'
  );

  // Handle strikethrough: <strikethrough>text</strikethrough> -> <del>text</del>
  processed = processed.replace(/<strikethrough>(.*?)<\/strikethrough>/g, '<del>$1</del>');

  // Handle standard markdown strikethrough: ~~text~~ -> <del>text</del>
  processed = processed.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Handle bold: **text** -> <strong>text</strong>
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Handle italic: *text* -> <em>text</em>
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Handle code: `text` -> <code>text</code>, escaping the captured text so
  // a literal HTML-tag mention (e.g. "a plain `<a>` tag") renders as visible
  // text instead of being parsed as a real, unclosed element downstream.
  processed = processed.replace(/`([^`]+)`/g, (_match, code) => `<code>${escapeHtml(code)}</code>`);

  return processed;
}

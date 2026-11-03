/**
 * Text parsing utilities for editorial content
 */

/**
 * Escapes HTML-significant characters so literal text (e.g. a mention of an
 * `<a>` tag inside inline code) renders as visible text instead of being
 * parsed as markup when injected via dangerouslySetInnerHTML.
 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Parses Markdown-style bold syntax (**text**) to HTML
 * @param text - Text with **bold** markdown syntax
 * @returns HTML string with <strong> tags
 */
export function parseBoldText(text: string): string {
  if (!text) return '';

  // Replace **text** with <strong>text</strong>
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Parses multiple Markdown-style formatting options
 * Currently supports: `code`, **bold**, *italic*, [links](url)
 * @param text - Text with markdown syntax
 * @returns HTML string with appropriate tags
 */
export function parseMarkdownText(text: string): string {
  if (!text) return '';

  let parsed = text;

  // Inline code: `text` -> <code>text</code>, escaping the captured text
  // first. Without this, prose that literally mentions a tag (e.g. "a plain
  // `<a>` tag") gets its `<a>` parsed as a real, unclosed anchor element once
  // this string reaches dangerouslySetInnerHTML - which can silently corrupt
  // the DOM structure of everything that follows it on the page. Protecting
  // the already-escaped/wrapped output behind a placeholder here (rather
  // than escaping in place) keeps the bold/italic/link passes below from
  // reaching into code content.
  const codeSegments: string[] = [];
  parsed = parsed.replace(/`([^`]+)`/g, (_match, code) => {
    codeSegments.push(`<code>${escapeHtml(code)}</code>`);
    return `CODEPROTECT${codeSegments.length - 1}CODEPROTECT`;
  });

  // Links: [text](url) -> <a href="url">text</a>
  // External (http/https) links open in a new tab so users stay in the app
  parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    const externalAttrs = /^https?:\/\//.test(url)
      ? ' target="_blank" rel="noopener noreferrer"'
      : '';
    return `<a href="${url}"${externalAttrs} class="underline hover:opacity-70 transition-opacity">${text}</a>`;
  });

  // Bold: **text** -> <strong>text</strong>
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* -> <em>text</em> (but not if already part of **)
  parsed = parsed.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Restore the protected code spans, now that the other passes have run
  parsed = parsed.replace(/CODEPROTECT(\d+)CODEPROTECT/g, (_match, i) => codeSegments[Number(i)]);

  return parsed;
}

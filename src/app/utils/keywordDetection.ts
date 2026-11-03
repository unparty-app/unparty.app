import KeywordsConfig from '@/data/KeywordsConfig.json';
import WordFrequency from '@/data/WordFrequency.json';

/**
 * Get all keyword terms from KeywordsConfig.json
 * @returns Array of keyword terms (e.g., ["digital divide (n)", "entrepreneur (n)", ...])
 */
export function getAllKeywordTerms(): string[] {
  return Object.keys(KeywordsConfig.keywords);
}

/**
 * Get definition for a specific keyword term
 * @param term - The keyword term (e.g., "entrepreneur (n)")
 * @returns Definition string or empty string if not found
 */
export function getKeywordDefinition(term: string): string {
  return KeywordsConfig.keywords[term as keyof typeof KeywordsConfig.keywords] || '';
}

/**
 * Where a keyword's modal links to, when it has a page of its own (the
 * "links" map in KeywordsConfig.json, e.g. FoundersConfig → /founders)
 * @param term - The keyword term (e.g., "FoundersConfig (n)")
 * @returns { href, label }, or null when the keyword has no link
 */
export function getKeywordLink(term: string): { href: string; label: string } | null {
  const links = (KeywordsConfig as { links?: Record<string, { href: string; label: string }> }).links;
  return links?.[term] ?? null;
}

const wordFrequencyLookup = new Map(WordFrequency.map((entry) => [entry.word, entry.count]));

/**
 * Get how many times a keyword term appears across published Articles and
 * Stories, from the corpus snapshot in src/data/WordFrequency.json (see
 * `npm run generate-word-frequency`, which stays in sync with
 * theunpartycloud's compatibility word cloud corpus).
 * @param term - The keyword term (e.g., "entrepreneur (n)")
 * @returns Mention count, or null if the term isn't in the frequency snapshot
 */
export function getKeywordMentionCount(term: string): number | null {
  const bareTerm = term.replace(/\s*\([^)]+\)\s*$/, '').toLowerCase();
  return wordFrequencyLookup.get(bareTerm) ?? null;
}

/**
 * Get all keywords in a specific category
 * @param category - The category name (e.g., "technology", "people", "concepts")
 * @returns Array of keyword terms in that category
 */
export function getKeywordsByCategory(category: keyof typeof KeywordsConfig.categories): string[] {
  return KeywordsConfig.categories[category] || [];
}

/**
 * Check if a text matches a keyword term
 * @param text - Text to check
 * @returns True if text matches a keyword term (case-insensitive)
 */
export function isKeywordTerm(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return getAllKeywordTerms().some(term => term.toLowerCase() === normalized);
}

/**
 * Get keyword term by partial match (without grammatical markers)
 * @param partialKey - Partial keyword (e.g., "entrepreneur" without "(n)")
 * @returns Full keyword term with markers or empty string
 */
export function getKeywordByPartial(partialKey: string): string {
  const normalized = partialKey.trim().toLowerCase();
  const found = getAllKeywordTerms().find(term => {
    const base = term.replace(/\s*\([^)]+\)\s*$/g, '').toLowerCase();
    return base === normalized;
  });
  return found || '';
}

/**
 * Highlight keywords in text by wrapping them in span elements
 * @param text - Text to process
 * @returns HTML string with highlighted keywords
 */
export function highlightKeywords(text: string): string {
  if (!text) return text;

  let processed = text;
  const keywords = getAllKeywordTerms();

  // Sort keywords by length (longest first) to avoid partial matches
  const sortedKeywords = keywords.sort((a, b) => b.length - a.length);

  // Each keyword's own definition can itself mention another keyword (e.g.
  // "ClaudeCode (n)"'s definition mentions "unparty") - without protecting a
  // span the instant it's inserted, a later keyword's pass rescans the
  // ACCUMULATED string (title attributes included) and matches inside the
  // title text, injecting a raw <span> tag mid-attribute-value. That
  // corrupts the markup (the nested span's own `"` closes the outer title=
  // early), which was producing a server/client hydration mismatch whenever
  // two configured keywords happened to reference each other.
  const protectedSpans: string[] = [];
  const protectSpan = (html: string) => {
    protectedSpans.push(html);
    return `KWSPANPROTECT${protectedSpans.length - 1}KWSPANPROTECT`;
  };

  for (const keyword of sortedKeywords) {
    const definition = getKeywordDefinition(keyword);
    // Match against the bare term (grammatical marker like "(n)" stripped) —
    // prose never contains the literal "runway (n)", only "runway". The
    // marker is kept in data-keyword below so KeywordModal can still look
    // up the definition by the original config key.
    const bareKeyword = keyword.replace(/\s*\([^)]+\)\s*$/, '');
    const escapedKeyword = bareKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match whole words with case-insensitive search
    const regex = new RegExp(`\\b(${escapedKeyword})\\b`, 'gi');

    // Replace with span, preserving original case, then immediately protect
    // it so later keyword iterations can't match text inside its title
    // attribute.
    processed = processed.replace(regex, (match) => {
      const span = `<span class="keyword-term" data-keyword="${keyword}" title="${definition.replace(/"/g, '&quot;')}">${match}</span>`;
      return protectSpan(span);
    });
  }

  processed = processed.replace(/KWSPANPROTECT(\d+)KWSPANPROTECT/g, (_match, i) => protectedSpans[Number(i)]);

  return processed;
}

/**
 * Run keyword highlighting over already-formatted HTML (the output of
 * parseMarkdownText/processInlineFormatting - bold/italic/links/code already
 * applied), protecting `<a>` and `<code>` contents so a keyword substring
 * inside a URL, link label, or code sample doesn't get wrapped mid-tag.
 * This is the render-time entry point KeywordWrapper calls - it's what lets
 * keyword highlighting work on ANY content reaching KeywordWrapper, not just
 * content that happened to pass through a markdown-to-editorial converter.
 */
export function highlightKeywordsInHtml(html: string): string {
  if (!html) return html;

  const protectedSegments: string[] = [];
  const protect = (match: string) => {
    protectedSegments.push(match);
    return `KWPROTECT${protectedSegments.length - 1}KWPROTECT`;
  };

  let processed = html;
  processed = processed.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, protect);
  processed = processed.replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, protect);

  processed = highlightKeywords(processed);

  processed = processed.replace(/KWPROTECT(\d+)KWPROTECT/g, (_match, i) => protectedSegments[Number(i)]);

  return processed;
}

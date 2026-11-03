#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Grammar check — the rules half of `./spellcheck` (see docs/guides/SPELLCHECK.md).
 *
 * Deliberately not a general-purpose grammar engine. cspell already owns
 * "is this a word", and the whole point of the workflow this feeds is that it
 * must never become a bottleneck — so every rule below is one a fast typist
 * actually trips over AND one that can be decided from the raw text with
 * effectively no false-positive tax:
 *
 *   1. doubled-word            "the the plan"
 *   2. missing-apostrophe      "dont" / "youre" / "thats"
 *   3. article-agreement       "a idea" / "an founder"
 *   4. space-before-punctuation "shipped it ."
 *
 * Errors that need to know what the sentence *means* — its/it's, plural vs.
 * possessive in a title ("A Hackers Mind"), or a real-but-wrong name
 * ("Steve King" for Steve Krug, see issue #553) — are out of scope on purpose.
 * Guessing at those is how a check like this starts crying wolf and gets muted.
 *
 * Rules mark themselves fixable or not. `--fix` only rewrites the mechanical
 * ones: "cant"/"wont" are real English words, so they are reported and left
 * alone rather than silently rewritten.
 *
 * Usage:
 *   node scripts/grammar-check.js <files...>              # human-readable report
 *   node scripts/grammar-check.js --fix <files...>        # apply the safe fixes
 *   node scripts/grammar-check.js --porcelain <files...>  # TAB-separated, for ./spellcheck
 *
 * Exits 1 when issues remain, 0 when clean. Only .md/.mdx/.txt are inspected;
 * anything else is skipped (prose in JSON/TSX is cspell's half of the job).
 */

const PROSE_EXTENSIONS = new Set(['.md', '.mdx', '.txt']);

// Regions that are not prose. Masked out (same length, newlines preserved) so
// every rule below sees only sentences, while offsets still line up with the
// original text for --fix.
//
// Masked with NUL rather than spaces on purpose: blanking `npm run build` to
// spaces in "relies on `npm run build`, and ..." would invent a stray space
// before the comma. NUL is neither a word character nor whitespace, so a masked
// region simply terminates every pattern below instead of feeding them.
const MASK_CHAR = '\u0000';

const NON_PROSE_PATTERNS = [
  /^ {0,3}(`{3,}|~{3,})[\s\S]*?^ {0,3}\1[^\n]*$/gm, // fenced code blocks
  /`[^`\n]+`/g, // inline code
  /:::[\s\S]*?:::/g, // custom :::directive::: blocks
  /\]\([^)\n]*\)/g, // markdown link/image targets
  /<\/?[A-Za-z][^>\n]*>/g, // html + jsx tags
  /\b[a-z][\w.+-]*:\/\/\S+/gi, // bare urls
];

// Doubling these reads as deliberate English, not as a stutter: "he had had
// enough", "tell you you can't", "EVERYTHING THAT MAKES YOU YOU".
const DOUBLED_WORD_ALLOWED = new Set([
  'had', 'that', 'you', 'ha', 'no', 'very', 'bye', 'blah', 'yeah', 'ok', 'hey', 'sic',
]);

// Contractions typed without the apostrophe. Every key is a non-word, so
// rewriting it is always right.
const CONTRACTIONS = {
  aint: "ain't", arent: "aren't", couldnt: "couldn't", couldve: "could've",
  didnt: "didn't", doesnt: "doesn't", dont: "don't", hadnt: "hadn't",
  hasnt: "hasn't", havent: "haven't", heres: "here's", hes: "he's",
  im: "I'm", isnt: "isn't", ive: "I've", mustnt: "mustn't", neednt: "needn't",
  oclock: "o'clock", shes: "she's", shouldnt: "shouldn't", shouldve: "should've",
  thats: "that's", theres: "there's", theyd: "they'd", theyll: "they'll",
  theyre: "they're", theyve: "they've", wasnt: "wasn't", werent: "weren't",
  weve: "we've", whats: "what's", wheres: "where's", whos: "who's",
  wouldnt: "wouldn't", wouldve: "would've", youd: "you'd", youll: "you'll",
  youre: "you're", youve: "you've",
};

// Real English words ("a cant phrase", "as is his wont") that are almost always
// a missing apostrophe in practice. Reported, never auto-fixed.
const CONTRACTIONS_ADVISORY = { cant: "can't", wont: "won't" };

// "IM" is instant messaging, "IVE" is shouting; only flag the prose spellings.
const NOT_WHEN_SHOUTED = new Set(['im', 'ive']);

// Vowel-spelled but consonant-sounding, so "a" is correct: a one-off, a EULA.
const A_BEFORE_VOWEL_OK = ['one', 'euro', 'european', 'eulog', 'euphem', 'eureka', 'eula', 'ewe', 'ouija'];

// Consonant-spelled but vowel-sounding, so "an" is correct: an hour, an heir.
const AN_BEFORE_CONSONANT_OK = ['hour', 'honest', 'honor', 'honour', 'heir', 'herb', 'homage', 'hombre'];

function maskNonProse(text) {
  let masked = text;
  for (const pattern of NON_PROSE_PATTERNS) {
    masked = masked.replace(pattern, (match) => match.replace(/[^\n]/g, MASK_CHAR));
  }
  return masked;
}

function matchCase(source, replacement) {
  // Length guard so a lone capital "A" becomes "An", not "AN".
  if (source.length > 1 && source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function startsWithAny(word, prefixes) {
  const lower = word.toLowerCase();
  return prefixes.some((prefix) => lower.startsWith(prefix));
}

// Spelled out rather than pronounced, so the article follows the letter name:
// "an NDA", "an X-ray", "an x", "an svg", "an html tag".
function readsAsLetterName(word) {
  if (word.length === 1) return true;
  if (/^[A-Za-z]-/.test(word)) return true;
  if (/^[A-Z]/.test(word) && !/^[A-Z][a-z]/.test(word)) return true;
  return !/[aeiouy]/i.test(word);
}

// A capital "A" mid-sentence is nearly always a label -- "Proposal A is the
// right architecture", "Why not Proposal A immediately?" -- not an article.
function isSentenceStart(text, index) {
  let i = index - 1;
  while (i >= 0 && (text[i] === ' ' || text[i] === '\t')) i -= 1;
  return i < 0 || '.?!:;\n\u2014-*#|>("\'“‘'.includes(text[i]);
}

// Same line only. A word repeated across a line break is usually a structural
// boundary rather than a stutter -- "### 1. Creating Articles" followed by a
// paragraph that opens "Articles are defined in ..." is correct prose.
function scanDoubledWords(text) {
  const issues = [];
  for (const match of text.matchAll(/(?<![\w'’-])([A-Za-z]+)[ \t]+\1(?![\w'’-])/gi)) {
    const [full, word] = match;
    if (DOUBLED_WORD_ALLOWED.has(word.toLowerCase())) continue;
    issues.push({
      index: match.index,
      length: full.length,
      replacement: word,
      rule: 'doubled-word',
      message: `doubled word "${word} ${word}"`,
    });
  }
  return issues;
}

function scanContractions(text) {
  const issues = [];
  const all = { ...CONTRACTIONS, ...CONTRACTIONS_ADVISORY };
  const pattern = new RegExp(`(?<![\\w'’-])(${Object.keys(all).join('|')})(?![\\w'’-])`, 'gi');
  for (const match of text.matchAll(pattern)) {
    const word = match[1];
    const key = word.toLowerCase();
    if (NOT_WHEN_SHOUTED.has(key) && word === word.toUpperCase()) continue;
    const fixed = matchCase(word, all[key]);
    const advisory = key in CONTRACTIONS_ADVISORY;
    issues.push({
      index: match.index,
      length: word.length,
      replacement: advisory ? null : fixed,
      rule: 'missing-apostrophe',
      message: advisory
        ? `"${word}" is a word, but did you mean "${fixed}"?`
        : `"${word}" should be "${fixed}"`,
    });
  }
  return issues;
}

function scanArticles(text) {
  const issues = [];

  for (const match of text.matchAll(/(?<![\w'’-])([Aa])([ \t]+)([AEIOaeio][\w'’-]*)/g)) {
    const [, article, , word] = match;
    if (startsWithAny(word, A_BEFORE_VOWEL_OK) || readsAsLetterName(word)) continue;
    if (article === 'A' && !isSentenceStart(text, match.index)) continue;
    const fixed = matchCase(article, 'an');
    issues.push({
      index: match.index,
      length: article.length,
      replacement: fixed,
      rule: 'article-agreement',
      message: `"${article} ${word}" should be "${fixed} ${word}"`,
    });
  }

  for (const match of text.matchAll(/(?<![\w'’-])([Aa]n)([ \t]+)([B-DF-HJ-NP-TV-Zb-df-hj-np-tv-z][\w'’-]*)/g)) {
    const [, article, , word] = match;
    if (startsWithAny(word, AN_BEFORE_CONSONANT_OK) || readsAsLetterName(word)) continue;
    if (article === 'An' && !isSentenceStart(text, match.index)) continue;
    const fixed = matchCase(article, 'a');
    issues.push({
      index: match.index,
      length: article.length,
      replacement: fixed,
      rule: 'article-agreement',
      message: `"${article} ${word}" should be "${fixed} ${word}"`,
    });
  }

  return issues;
}

function scanSpaceBeforePunctuation(text) {
  const issues = [];
  // Space runs only (never a newline): a line that legitimately starts with
  // punctuation is a different thing entirely. ":" is left out on purpose --
  // "NUMBER-FOUR : NEVER GET HIGH ON YOUR OWN SUPPLY" and "- JAN 2026 : 225
  // commits" are a house style, not typos.
  for (const match of text.matchAll(/(\w)([ \t]+)([,;.!?])(?=[ \t]|\n|$)/g)) {
    const [full, before, , punctuation] = match;
    issues.push({
      index: match.index,
      length: full.length,
      replacement: `${before}${punctuation}`,
      rule: 'space-before-punctuation',
      message: `stray space before "${punctuation}"`,
    });
  }
  return issues;
}

const RULES = [scanDoubledWords, scanContractions, scanArticles, scanSpaceBeforePunctuation];

function lineStartsOf(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function positionAt(starts, index) {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (starts[mid] <= index) low = mid;
    else high = mid - 1;
  }
  return { line: low + 1, column: index - starts[low] + 1 };
}

function checkFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const masked = maskNonProse(text);
  const starts = lineStartsOf(text);

  const issues = RULES.flatMap((rule) => rule(masked))
    .sort((a, b) => a.index - b.index)
    .map((issue) => ({ ...issue, ...positionAt(starts, issue.index) }));

  return { text, issues };
}

// Applied back-to-front so earlier offsets stay valid. Overlapping matches (a
// doubled word that also has a stray space, say) are resolved first-wins; the
// leftover is reported again on the next run.
function applyFixes(text, issues) {
  let output = text;
  let applied = 0;
  let nextIndex = text.length;

  for (const issue of [...issues].sort((a, b) => b.index - a.index)) {
    if (issue.replacement === null) continue;
    if (issue.index + issue.length > nextIndex) continue;
    output = output.slice(0, issue.index) + issue.replacement + output.slice(issue.index + issue.length);
    nextIndex = issue.index;
    applied += 1;
  }

  return { output, applied };
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const porcelain = args.includes('--porcelain');
  const files = args.filter((arg) => !arg.startsWith('--'));

  if (files.length === 0) {
    console.error('Usage: node scripts/grammar-check.js [--fix] [--porcelain] <files...>');
    process.exit(2);
  }

  let remaining = 0;
  let fixedTotal = 0;

  for (const file of files) {
    if (!PROSE_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    if (!fs.existsSync(file)) continue;

    let { text, issues } = checkFile(file);

    if (fix && issues.some((issue) => issue.replacement !== null)) {
      const { output, applied } = applyFixes(text, issues);
      fs.writeFileSync(file, output);
      fixedTotal += applied;
      ({ issues } = checkFile(file));
    }

    for (const issue of issues) {
      remaining += 1;
      if (porcelain) {
        const fixable = issue.replacement === null ? 'no' : 'yes';
        process.stdout.write(`${file}\t${issue.line}\t${issue.column}\t${issue.rule}\t${issue.message}\t${fixable}\n`);
      } else {
        const suffix = issue.replacement === null ? '' : ' (fixable)';
        console.log(`${file}:${issue.line}:${issue.column} - ${issue.message}${suffix}`);
      }
    }
  }

  if (!porcelain) {
    if (fixedTotal > 0) console.log(`Fixed ${fixedTotal} issue(s).`);
    if (remaining === 0) console.log('No grammar issues found.');
  }

  process.exit(remaining > 0 ? 1 : 0);
}

main();

/**
 * The text side of date stamping (#1030): given a content file's new text and
 * its previous text, return the text with its dates set. No git, no file
 * system, so both callers share it:
 *
 * - scripts/stamp-dates.js (the pre-commit hook), which reads files and git
 * - the in-app save APIs (src/lib/stamp-on-save.ts), which read GitHub
 *
 * Rules: the created date is set once when missing; the updated date becomes
 * `today` only when the title or body changed against the previous text.
 * Tags, cover, published, other metadata and whitespace don't count.
 */

export const KINDS = [
  { kind: 'story', test: /^public\/covers\/stories\/story-\d+\.md$/, created: 'started-at', updated: 'updated-at' },
  { kind: 'unppp', test: /^src\/app\/theunparty[^/]*\/[^/]+\.md$/, created: 'date', updated: 'updated-at' },
  { kind: 'json', test: /^content\/articles\/[^/]+\.json$/, created: 'date', updated: 'updated' },
  { kind: 'ts', test: /^src\/app\/constants\/editorial-articles\/articles\/[^/]+\.ts$/, created: 'date', updated: 'updated' },
];

export const kindOf = (rel) => KINDS.find((k) => k.test.test(rel));

const squash = (s) => s.replace(/\s+/g, ' ').trim();

// --- markdown (stories and unppp articles) ---------------------------------

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

function mdParts(text) {
  const m = FRONTMATTER.exec(text);
  if (!m) return null;
  return { lines: m[1].split('\n'), body: text.slice(m[0].length) };
}

const mdValue = (lines, key) => {
  const line = lines.find((l) => l.startsWith(`${key}:`));
  return line === undefined ? undefined : line.slice(key.length + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
};

// Title and body: what a reader reads. A file that had no frontmatter had no
// title to change, so adding frontmatter alone isn't an edit
function mdChanged(base, text) {
  const read = (t) => {
    const parts = mdParts(t);
    return parts ? { title: mdValue(parts.lines, 'title') ?? null, body: squash(parts.body) } : { title: null, body: squash(t) };
  };
  const before = read(base);
  const after = read(text);
  return before.body !== after.body || (before.title !== null && before.title !== after.title);
}

function mdSet(lines, key, value, after) {
  // Match the file's style: its other dates if it has any (stories leave
  // dates bare but quote titles), else its other values
  const dated = lines.filter((l) => /^(date|started-at|updated|updated-at):/.test(l));
  const quoted = (dated.length ? dated : lines).some((l) => /^[\w-]+:\s*"/.test(l));
  const line = `${key}: ${quoted ? `"${value}"` : value}`;
  const at = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (at !== -1) {
    lines[at] = line;
    return;
  }
  const anchor = lines.findIndex((l) => l.startsWith(`${after}:`));
  lines.splice(anchor === -1 ? lines.length : anchor + 1, 0, line);
}

function stampMd(text, base, k, dates) {
  const parts = mdParts(text);
  if (!parts) return { text, notes: ['no frontmatter, not stamped'] };
  const { lines } = parts;
  const notes = [];
  if (!mdValue(lines, k.created)) {
    mdSet(lines, k.created, dates.created(), 'author');
    notes.push(`${k.created} ${mdValue(lines, k.created)}`);
  }
  // `updated:` is the old name of `updated-at:` in markdown (#1030); stamping
  // replaces it rather than leaving both
  const legacy = lines.findIndex((l) => l.startsWith('updated:'));
  if (base !== null && mdChanged(base, text) && mdValue(lines, k.updated) !== dates.today) {
    if (legacy !== -1) lines.splice(legacy, 1);
    mdSet(lines, k.updated, dates.today, k.created);
    notes.push(`${k.updated} ${dates.today}`);
  }
  return { text: notes.length ? `---\n${lines.join('\n')}\n---\n${parts.body}` : text, notes };
}

// --- JSON articles ---------------------------------------------------------

function jsonSignature(text) {
  try {
    const a = JSON.parse(text);
    return squash(JSON.stringify([a.title ?? '', a.sections ?? []]));
  } catch {
    return squash(text);
  }
}

// Edits the key's line in place, so the file keeps its own formatting
function jsonSet(text, key, value, after) {
  const re = new RegExp(`("${key}"\\s*:\\s*)"[^"]*"`);
  if (re.test(text)) return text.replace(re, `$1"${value}"`);
  const anchor = new RegExp(`^(\\s*)"${after}"\\s*:\\s*"[^"]*",?$`, 'm');
  const m = anchor.exec(text);
  if (!m) return null;
  const line = m[0].endsWith(',') ? m[0] : `${m[0]},`;
  return text.replace(m[0], `${line}\n${m[1]}"${key}": "${value}"${m[0].endsWith(',') ? ',' : ''}`);
}

function stampJson(text, base, k, dates) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { text, notes: ['not valid JSON, not stamped'] };
  }
  const notes = [];
  let out = text;
  if (!data[k.created]) {
    const next = jsonSet(out, k.created, dates.created(), 'slug');
    if (next) {
      out = next;
      notes.push(`${k.created} ${dates.created()}`);
    }
  }
  if (base !== null && jsonSignature(base) !== jsonSignature(text) && data[k.updated] !== dates.today) {
    const next = jsonSet(out, k.updated, dates.today, k.created);
    if (next) {
      out = next;
      notes.push(`${k.updated} ${dates.today}`);
    } else notes.push(`no "${k.created}" line to put "${k.updated}" after, not stamped`);
  }
  return { text: out, notes };
}

// --- TS articles -----------------------------------------------------------

// The article's own title (the first one) and everything from sections on
function tsSignature(text) {
  const title = /^\s*title:\s*(['"`])(.*?)\1/m.exec(text)?.[2] ?? '';
  const at = text.search(/^\s*sections:/m);
  return squash(`${title}\n${at === -1 ? text : text.slice(at)}`);
}

const TS_PROP = (key) => new RegExp(`^(\\s*)${key}:\\s*(['"])([^'"]*)\\2,?`, 'm');

function tsSet(text, key, value, after) {
  const own = TS_PROP(key).exec(text);
  if (own) return text.replace(own[0], `${own[1]}${key}: ${own[2]}${value}${own[2]},`);
  const anchor = TS_PROP(after).exec(text);
  if (!anchor) return null;
  return text.replace(anchor[0], `${anchor[0]}\n${anchor[1]}${key}: ${anchor[2]}${value}${anchor[2]},`);
}

function stampTs(text, base, k, dates) {
  const notes = [];
  let out = text;
  if (!TS_PROP(k.created).test(out)) {
    const next = tsSet(out, k.created, dates.created(), 'slug');
    if (next) {
      out = next;
      notes.push(`${k.created} ${dates.created()}`);
    }
  }
  const current = TS_PROP(k.updated).exec(out)?.[3];
  if (base !== null && tsSignature(base) !== tsSignature(text) && current !== dates.today) {
    const next = tsSet(out, k.updated, dates.today, k.created);
    if (next) {
      out = next;
      notes.push(`${k.updated} ${dates.today}`);
    } else notes.push(`no ${k.created}: line to put ${k.updated}: after, not stamped`);
  }
  return { text: out, notes };
}

const STAMP = { story: stampMd, unppp: stampMd, json: stampJson, ts: stampTs };

/**
 * Stamp one content file's text.
 * @param {string} rel repo-relative path (decides the content type)
 * @param {string} text the new text
 * @param {string | null} base the previous text, or null for a new file (or
 *   to only fill a missing created date)
 * @param {{ today: string, created: () => string }} dates `created` gives the
 *   created date to fill when one is missing
 * @returns {{ text: string, notes: string[] } | null} null when `rel` isn't content
 */
export function stampText(rel, text, base, dates) {
  const k = kindOf(rel);
  return k ? STAMP[k.kind](text, base, k, dates) : null;
}

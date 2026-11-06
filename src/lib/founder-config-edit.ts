/**
 * Setting one field inside FoundersConfig.json's `founder` object as text,
 * so the rest of the file keeps its formatting (writeFoundersConfig changes
 * one value, never re-serializes what it doesn't touch). The field's value can
 * be anything JSON, nested objects and arrays included; undefined removes it.
 * A result that doesn't parse back to the intended value throws, before it
 * reaches the file.
 */

/** Where the JSON value starting at `start` ends (exclusive), reading strings whole */
function valueEnd(text: string, start: number): number {
  const first = text[start];
  if (first === '"') {
    for (let i = start + 1; i < text.length; i++) {
      if (text[i] === '\\') i++;
      else if (text[i] === '"') return i + 1;
    }
    throw new Error('unterminated string');
  }
  if (first === '{' || first === '[') {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (c === '"') i = valueEnd(text, i) - 1;
      else if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') {
        depth--;
        if (depth === 0) return i + 1;
      }
    }
    throw new Error('unterminated object');
  }
  const match = /^[^,}\]\s]+/.exec(text.slice(start));
  if (!match) throw new Error('no value');
  return start + match[0].length;
}

/** The text with founder[key] set to `value` (undefined: the key removed) */
export function withFounderField(text: string, key: string, value: unknown): string {
  const open = /"founder"\s*:\s*\{/.exec(text);
  if (!open) throw new Error('no founder in FoundersConfig');
  const objStart = open.index + open[0].length - 1;
  const objEnd = valueEnd(text, objStart);

  // The founder's own keys (depth 1), with where each value sits
  let found: { keyStart: number; valStart: number; valEnd: number } | null = null;
  let i = objStart + 1;
  while (i < objEnd - 1) {
    const c = text[i];
    if (c === '"') {
      const keyEnd = valueEnd(text, i);
      const name = JSON.parse(text.slice(i, keyEnd)) as string;
      const colon = text.indexOf(':', keyEnd);
      let valStart = colon + 1;
      while (/\s/.test(text[valStart])) valStart++;
      const end = valueEnd(text, valStart);
      if (name === key) {
        found = { keyStart: i, valStart, valEnd: end };
        break;
      }
      i = end;
    } else i++;
  }

  let next: string;
  if (found && value === undefined) {
    // Remove the key, with the comma that joined it to its neighbour
    let from = found.keyStart;
    let to = found.valEnd;
    const after = /^\s*,/.exec(text.slice(to));
    if (after) to += after[0].length;
    else {
      const before = /,\s*$/.exec(text.slice(0, from));
      if (before) from -= before[0].length;
    }
    // And the line it was on, when it had one to itself
    const lineStart = text.lastIndexOf('\n', from - 1);
    if (/^\s*$/.test(text.slice(lineStart + 1, from)) && text[to] === '\n') from = lineStart;
    next = text.slice(0, from) + text.slice(to);
  } else if (found) {
    next = text.slice(0, found.valStart) + JSON.stringify(value) + text.slice(found.valEnd);
  } else if (value === undefined) {
    return text;
  } else {
    // A new key, last in founder, on its own line
    let close = objEnd - 1;
    while (/\s/.test(text[close - 1])) close--;
    next = `${text.slice(0, close)},\n    ${JSON.stringify(key)}: ${JSON.stringify(value)}${text.slice(close)}`;
  }

  const parsed = JSON.parse(next) as { founder?: Record<string, unknown> };
  if (JSON.stringify(parsed.founder?.[key]) !== JSON.stringify(value)) throw new Error(`founder.${key} did not change as asked`);
  return next;
}

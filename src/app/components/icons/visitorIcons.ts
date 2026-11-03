// A visitor's own icon drawings (the icon pad in a story or article, the
// "visitor" mode): kept in their browser only, never sent anywhere, and drawn
// in place of the site's icons on that device. HandDrawnIcon reads them
// through useSyncExternalStore, so the server and first paint draw the site's
// icons and the visitor's appear right after.
export type Drawings = Record<string, string[]>;

const KEY = 'my-icons';
const EVENT = 'my-icons-change';
const EMPTY: Drawings = {};

let raw: string | null = null;
let parsed: Drawings = EMPTY;

export function visitorIcons(): Drawings {
  try {
    const next = localStorage.getItem(KEY);
    if (next !== raw) {
      raw = next;
      parsed = next ? (JSON.parse(next) as Drawings) : EMPTY;
    }
  } catch {
    parsed = EMPTY;
  }
  return parsed;
}

export const noVisitorIcons = (): Drawings => EMPTY;

export function subscribeVisitorIcons(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(EVENT, onChange);
  };
}

/** Keep a drawing on this device (an empty one removes it), and redraw every icon */
export function setVisitorIcon(name: string, strokes: string[]) {
  const next = { ...visitorIcons() };
  if (strokes.length) next[name] = strokes;
  else delete next[name];
  try {
    if (Object.keys(next).length) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // Private browsing: the drawing only lasts until the page closes
  }
  window.dispatchEvent(new Event(EVENT));
}

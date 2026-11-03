// A story file (public/covers/stories/story-NNN.md) as the story writer edits
// it (#229): frontmatter, then the Markdown. Pure, so the writer in the
// browser and the save route on the server read and change it the same way.
// A field is changed in place, one line, so everything else in the file stays
// as its author wrote it (the iOS editor, StoryEditorView, works the same way)

// The blank line after the frontmatter belongs to it: the Markdown starts after
// it, and withBody writes it back, the way stories are laid out
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?\n?([\s\S]*)$/;

const unquote = (value: string) => value.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

/** The story's frontmatter fields (as written, unquoted) and its Markdown */
export function splitStory(raw: string): { fields: Record<string, string>; body: string } {
  const match = raw.replace(/\r\n/g, '\n').match(FRONTMATTER);
  if (!match) return { fields: {}, body: raw };
  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const at = line.indexOf(':');
    if (at > 0 && !line.startsWith(' ')) fields[line.slice(0, at).trim()] = unquote(line.slice(at + 1));
  }
  return { fields, body: match[2] };
}

// A value as frontmatter: true/false and numbers bare, words in quotes
const asYaml = (value: string | boolean) =>
  typeof value === 'boolean' ? String(value) : /^(true|false|-?\d+(\.\d+)?)$/.test(value) || value === '' ? value : JSON.stringify(value);

/** The file with one frontmatter field set (added at the end when it isn't there) */
export function withField(raw: string, key: string, value: string | boolean): string {
  const text = raw.replace(/\r\n/g, '\n');
  const match = text.match(FRONTMATTER);
  const line = `${key}: ${asYaml(value)}`;
  if (!match) return `---\n${line}\n---\n${text}`;
  const lines = match[1].split('\n');
  const at = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (at >= 0) lines[at] = line;
  else lines.push(line);
  return `---\n${lines.join('\n')}\n---\n\n${match[2]}`;
}

/** The file with its Markdown replaced, the frontmatter kept */
export function withBody(raw: string, body: string): string {
  const match = raw.replace(/\r\n/g, '\n').match(FRONTMATTER);
  return match ? `---\n${match[1]}\n---\n\n${body}` : body;
}

/**
 * A new story's id: the first number no story has yet, so it pairs with the
 * next cover (story-052 goes with cover-052), not one after a story numbered
 * out of the run on purpose (story-300)
 */
export function nextStoryId(ids: string[]): string {
  const used = new Set(ids.map((id) => Number(/^story-(\d+)$/.exec(id)?.[1] ?? 0)));
  let next = 1;
  while (used.has(next)) next++;
  return `story-${String(next).padStart(3, '0')}`;
}

/** A new story's file: its frontmatter, a draft until its author publishes it */
export function newStory({ title, subtitle, author, cover, body }: { title: string; subtitle?: string; author: string; cover?: string; body: string }): string {
  const lines = [`title: ${asYaml(title)}`, ...(subtitle ? [`subtitle: ${asYaml(subtitle)}`] : []), `author: ${author}`, ...(cover ? [`cover: ${cover}`] : []), 'published: false'];
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

// ── Its address (src/data/storiesManifest.json) ─────────────────
// The same rules as scripts/generate-stories-manifest.js (npm run
// get-stories), so a story saved from the writer gets the address that
// command would give it: a published story's slug comes from its title, is
// written into its frontmatter once, and takes the story's number on a clash

export interface StoriesManifest {
  published: string[];
  slugToCoverId: Record<string, string>;
  coverIdToSlug: Record<string, string>;
  generatedAt?: string;
}

/** A title as an address: "WHY." → "why" (generate-stories-manifest.js slugify) */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[.?!,;:'"/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** The slug a story keeps or gets: its own, else its title's, numbered when another story has it */
export function slugFor(manifest: StoriesManifest, storyId: string, fields: Record<string, string>): string {
  if (fields.slug) return fields.slug;
  const num = storyId.replace('story-', '');
  const coverId = storyId.replace('story-', 'cover-');
  const wanted = (fields.title && slugify(fields.title)) || storyId;
  const taken = manifest.slugToCoverId[wanted];
  return taken && taken !== coverId ? `${wanted}-${num}` : wanted;
}

/** The manifest with a story listed under its slug while published, and left out once it isn't */
export function manifestWith(manifest: StoriesManifest, storyId: string, slug: string, published: boolean): StoriesManifest {
  const coverId = storyId.replace('story-', 'cover-');
  const entries = Object.entries(manifest.coverIdToSlug).filter(([cover]) => cover !== coverId);
  if (published) entries.push([coverId, slug]);
  entries.sort(([a], [b]) => Number(a.replace('cover-', '')) - Number(b.replace('cover-', '')));
  return {
    published: entries.map(([, s]) => s),
    slugToCoverId: Object.fromEntries(entries.map(([cover, s]) => [s, cover])),
    coverIdToSlug: Object.fromEntries(entries),
    generatedAt: new Date().toISOString(),
  };
}

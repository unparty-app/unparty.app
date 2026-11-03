import type { EditorialSection } from '../constants/editorial-articles/types';

/**
 * A ```poem fence, as both markdown parsers (stories and MD articles) read it.
 * The fence line can name the hand-drawn icon that carries the poem
 * (```poem Heart); without one it's the owner's poem icon. It can also say
 * whose poem it is and where its handwriting is, so a guest's poem is tagged
 * with their name and shown in their hand:
 *
 *   ```poem author="Jane Doe" ink=/poems/jane-ink.webp
 *
 * Without an author it's the site's founder's. The title is the heading right
 * above the poem. The verse itself is kept as written: only blank lines at its
 * edges go, never a first line's indentation.
 */
export function isPoemFence(language: string): boolean {
  return /^poem(\s|$)/i.test(language);
}

// The fence line after "poem": key=value or key="value with spaces", and one
// bare word for the icon
function poemOptions(language: string): { icon?: string; author?: string; ink?: string } {
  const rest = language.replace(/^poem/i, '');
  const options: Record<string, string> = {};
  const bare = rest.replace(/(\w+)=(?:"([^"]*)"|(\S+))/g, (_, key: string, quoted?: string, plain?: string) => {
    options[key.toLowerCase()] = (quoted ?? plain ?? '').trim();
    return ' ';
  });
  const icon = bare.trim().split(/\s+/)[0] || options.icon;
  return {
    ...(icon && { icon }),
    ...(options.author && { author: options.author }),
    ...(options.ink && { ink: options.ink.startsWith('/') ? options.ink : `/${options.ink}` }),
  };
}

export function poemSection(
  id: string,
  language: string,
  verse: string,
  before: EditorialSection[],
  format: (text: string) => string = (text) => text
): EditorialSection {
  const heading = [...before].reverse().find((s) => s.type === 'heading' || s.type === 'hero');
  const title = heading?.content?.replace(/<[^>]*>/g, '').trim();
  return {
    id,
    type: 'paragraph',
    content: format(verse.replace(/^(?:[ \t]*\n)+/, '').trimEnd()),
    metadata: { preserveWhitespace: true, ...poemOptions(language), ...(title && { title }) },
  };
}

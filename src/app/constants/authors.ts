/**
 * Canonical display names for article author slugs.
 * Articles store loose author strings ('jmm', 'justin-murry', '✍🏾jmm', …);
 * look up here before displaying one.
 */
const AUTHOR_NAMES: Record<string, string> = {
  'jmm': 'Justin Murry',
  '✍🏾jmm': 'Justin Murry',
  'justin-murry': 'Justin Murry',
  'justin murry': 'Justin Murry',
  'unparty': 'unparty',
  'unparty-app': 'unparty',
};

/** Resolve an author slug to its display name; unknown values pass through unchanged. */
export function getAuthorDisplayName(author: string): string {
  return AUTHOR_NAMES[author] ?? AUTHOR_NAMES[author.toLowerCase()] ?? author;
}

/**
 * Social/profile URLs per canonical display name, used to back schema.org
 * `Person.sameAs` for author disambiguation in Article structured data.
 */
const AUTHOR_SAME_AS: Record<string, string[]> = {
  'Justin Murry': ['https://github.com/jmurrym', 'https://linkedin.com/in/jmmurry'],
};

/** Resolve an author slug to its known social/profile URLs, if any. */
export function getAuthorSameAs(author: string): string[] | undefined {
  return AUTHOR_SAME_AS[getAuthorDisplayName(author)];
}

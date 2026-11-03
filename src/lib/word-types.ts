import typesConfig from '@/data/UnpppTypesConfig.json';

/**
 * Classifying a build by its words (#389), the way theunpartybuilder's keyword
 * rules do, but with the owner's own words: the owner tags the words their
 * site keeps using (/api/words) with one of the eight kinds of build
 * (FoundersConfig `wordTypes`, tagged in /admin → Your words), and any five
 * words someone picks point to a kind. Plain data in, plain data out, so the
 * worksheet classifies in the browser and the server can check a tag.
 */

export interface BuildType {
  id: string;
  definition: string;
  color?: string;
}

const rawTypes = (Array.isArray(typesConfig) ? typesConfig : (typesConfig as { types?: unknown[] }).types ?? []) as Array<Record<string, unknown>>;

/** The eight kinds of build, in UnpppTypesConfig's order (app, agent, service…) */
export const BUILD_TYPES: BuildType[] = rawTypes
  .filter((type) => typeof type.id === 'string')
  .map((type) => ({
    id: String(type.id),
    definition: String(type.definition ?? type.description ?? ''),
    ...(typeof type.color === 'string' && { color: type.color }),
  }));

/** What can carry a tag: one word, as the cloud counts it */
export const TAGGABLE_WORD = /^[a-z0-9][a-z0-9'-]{0,39}$/;

export const isBuildType = (id: unknown): id is string => typeof id === 'string' && BUILD_TYPES.some((type) => type.id === id);

export interface WordClassification {
  /** Each kind the words point to, most first: how many tagged words, and their share of the tagged ones */
  ranked: Array<{ type: string; count: number; share: number }>;
  /** The kind most of the tagged words point to, or null with none tagged (a tie goes to the first in BUILD_TYPES) */
  top: string | null;
  /** The picked words the owner hasn't tagged: reported, never guessed */
  untagged: string[];
}

/** Which kind of build a set of words points to, by the owner's tags */
export function classifyWords(picked: string[], tags: Record<string, string>): WordClassification {
  const counts = new Map<string, number>();
  const untagged: string[] = [];
  for (const word of new Set(picked.map((w) => w.toLowerCase()))) {
    const type = tags[word];
    if (type && isBuildType(type)) counts.set(type, (counts.get(type) ?? 0) + 1);
    else untagged.push(word);
  }
  const tagged = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const order = (type: string) => BUILD_TYPES.findIndex((t) => t.id === type);
  const ranked = [...counts.entries()]
    .map(([type, count]) => ({ type, count, share: tagged ? count / tagged : 0 }))
    .sort((a, b) => b.count - a.count || order(a.type) - order(b.type));
  return { ranked, top: ranked[0]?.type ?? null, untagged };
}

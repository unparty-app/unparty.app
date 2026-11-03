/**
 * Words, counted the same way everywhere: the site's own writing on the
 * server (src/lib/word-counts.ts, /api/words) and a visitor's in their
 * browser (YourWords). Pure, so it imports in either.
 */

// Common English function words, so the list shows what the writing is about
export const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'your', 'that', 'this',
  'with', 'have', 'has', 'had', 'was', 'were', 'been', 'being', 'from',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when', 'where',
  'why', 'how', 'all', 'any', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'can',
  'will', 'just', 'should', 'now', 'about', 'into', 'over', 'after',
  'out', 'off', 'above', 'below', 'again', 'once', 'here', 'there',
  'because', 'while', 'against', 'between', 'through', 'during', 'before',
  'itself', 'himself', 'herself', 'ourselves', 'themselves', 'yourself',
  'does', 'did', 'doing', 'these', 'those', 'then', 'also', 'like',
  'get', 'got', 'one', 'two', 'its', "it's", "don't", "i'm", 'our', 'his', 'her',
]);

/** The words worth counting in a text: lowercase, no stopwords, numbers or words under three letters */
export function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .map(word => word.replace(/^'+|'+$/g, ''))
    .filter(word => word.length > 2 && !/^\d+$/.test(word) && !STOPWORDS.has(word));
}

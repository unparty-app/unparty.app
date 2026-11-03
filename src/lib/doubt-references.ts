import 'server-only';
import { ownPieces } from '@/lib/word-counts';

/**
 * Where the founder's doubts (src/lib/doubts.ts) surface in their writing:
 * each doubt looked up in their published stories and articles (ownPieces,
 * the same writing /founders' WORDS. counts), with a snippet of the first
 * place it appears, so the founder can go straight to it.
 */

export const MAX_DOUBTS = 50;
export const MAX_DOUBT_LENGTH = 80;

export interface DoubtPiece {
  title: string;
  href: string;
  count: number;
  // The first place it appears, with a little of what's around it
  snippet: string;
}

export interface DoubtReferences {
  doubt: string;
  count: number;
  pieces: DoubtPiece[];
}

/** Trimmed, lowercased, no repeats, within the limits */
export function cleanDoubts(doubts: unknown[]): string[] {
  const seen = new Set<string>();
  for (const value of doubts) {
    if (typeof value !== 'string') continue;
    const doubt = value.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, MAX_DOUBT_LENGTH);
    if (doubt) seen.add(doubt);
  }
  return [...seen].slice(0, MAX_DOUBTS);
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Where each doubt appears in the founder's writing, most found first */
export async function findDoubts(doubts: string[]): Promise<DoubtReferences[]> {
  if (doubts.length === 0) return [];
  const pieces = await ownPieces('both');
  return doubts
    .map((doubt) => {
      // Whole words, any spacing between them, any case
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${doubt.split(' ').map(escape).join('\\s+')}(?![\\p{L}\\p{N}])`, 'giu');
      const found = pieces.flatMap((piece) => {
        const matches = [...piece.text.matchAll(pattern)];
        if (matches.length === 0) return [];
        const at = matches[0].index ?? 0;
        const start = Math.max(0, at - 50);
        const end = Math.min(piece.text.length, at + matches[0][0].length + 50);
        const snippet = `${start > 0 ? '…' : ''}${piece.text.slice(start, end).trim()}${end < piece.text.length ? '…' : ''}`;
        return [{ title: piece.title, href: piece.href, count: matches.length, snippet }];
      });
      found.sort((a, b) => b.count - a.count);
      return { doubt, count: found.reduce((n, piece) => n + piece.count, 0), pieces: found };
    })
    .sort((a, b) => b.count - a.count || a.doubt.localeCompare(b.doubt));
}

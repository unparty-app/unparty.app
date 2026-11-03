import { sheetRecords } from './sheet';

/**
 * The books sheet (/article/setup-google-sheet): one book a row, under a
 * header row the owner types once. Header names are forgiving (any case,
 * "publisher link" or "publisherLink"), and a column can be left out.
 */
export interface SheetBook {
  title: string;
  author: string;
  quote: string;
  page: string;
  publisher: string;
  publisherLink: string;
  available: boolean;
  condition: string;
}

// The columns in the order a new row is written, and the header row a
// builder's sheet starts with
export const BOOK_COLUMNS = ['title', 'author', 'quote', 'page', 'publisher', 'publisher link', 'available', 'condition'] as const;

const pick = (record: Record<string, string>, ...names: string[]) =>
  names.map((name) => record[name]).find((value) => value !== undefined && value !== '') ?? '';

const yes = (value: string) => /^(yes|y|true|1|x|✓|in stock)$/i.test(value.trim());

export function booksFromRows(rows: string[][]): SheetBook[] {
  return sheetRecords(rows)
    .map((record) => ({
      title: pick(record, 'title', 'book'),
      author: pick(record, 'author', 'by'),
      quote: pick(record, 'quote'),
      page: pick(record, 'page').replace(/^0$/, ''),
      publisher: pick(record, 'publisher'),
      publisherLink: pick(record, 'publisher link', 'publisherlink', 'link', 'url'),
      available: yes(pick(record, 'available', 'in stock', 'instock')),
      condition: pick(record, 'condition'),
    }))
    .filter((book) => book.title);
}

/** Written in capitals only, like "THE DESIGN OF EVERYDAY THINGS" */
export const isAllCaps = (text: string) => /[A-Z]/.test(text) && text === text.toUpperCase() && !/[a-z]/.test(text);

// What a builder can ask of their sheet, the way a database is asked: each a
// filter over the same rows
export const BOOK_FILTERS = [
  { id: 'all', label: 'every book', test: () => true },
  { id: 'no-quote', label: 'missing a quote', test: (b: SheetBook) => !b.quote },
  { id: 'all-caps', label: 'in all caps', test: (b: SheetBook) => isAllCaps(b.title) || isAllCaps(b.author) },
  { id: 'publisher', label: 'has a publisher', test: (b: SheetBook) => Boolean(b.publisher) },
  { id: 'available', label: 'available', test: (b: SheetBook) => b.available },
] as const;

export type BookFilterId = (typeof BOOK_FILTERS)[number]['id'];

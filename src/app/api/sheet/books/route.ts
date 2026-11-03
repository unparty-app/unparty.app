import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminGuard, isAdmin } from '@/lib/admin';
import { readSheetCsv } from '@/lib/sheet';
import { appendSheetRow, SHEET_WRITE_OFF, sheetWriteConnected } from '@/lib/sheet-write';
import { BOOK_COLUMNS, booksFromRows } from '@/lib/sheet-books';

// The books sheet (/article/setup-google-sheet). GET reads the owner's
// published sheet (BOOKS_SHEET_CSV_URL), or the sample every copy ships with
// (public/setup-google-sheet/books-sample.csv) until they publish their own.
// POST adds a book as a new row, for an admin, once writing is set up.

const SAMPLE_PATH = '/setup-google-sheet/books-sample.csv';

export async function GET(req: NextRequest) {
  const own = process.env.BOOKS_SHEET_CSV_URL;
  try {
    const rows = await readSheetCsv(own || new URL(SAMPLE_PATH, req.nextUrl.origin).toString());
    return NextResponse.json({
      source: own ? 'sheet' : 'sample',
      books: booksFromRows(rows),
      canWrite: sheetWriteConnected() && (await isAdmin()),
    });
  } catch (error) {
    console.error('[sheet/books] read failed:', error);
    return NextResponse.json({ error: "couldn't read the sheet." }, { status: 502 });
  }
}

const newBook = z.object({
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(200),
  quote: z.string().trim().max(2000).optional().default(''),
  page: z.string().trim().max(10).optional().default(''),
  publisher: z.string().trim().max(200).optional().default(''),
  publisherLink: z.string().trim().url().max(500).optional().or(z.literal('')).default(''),
  available: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!sheetWriteConnected()) {
    return NextResponse.json({ error: "this site isn't writing to a sheet yet.", code: SHEET_WRITE_OFF }, { status: 503 });
  }
  const parsed = newBook.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'a book needs a title and an author.' }, { status: 400 });

  const book = parsed.data;
  const cells: Record<(typeof BOOK_COLUMNS)[number], string> = {
    title: book.title,
    author: book.author,
    quote: book.quote,
    page: book.page,
    publisher: book.publisher,
    'publisher link': book.publisherLink,
    available: book.available ? 'yes' : 'no',
    condition: '',
  };
  try {
    await appendSheetRow(BOOK_COLUMNS.map((column) => cells[column]));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('[sheet/books] write failed:', error);
    return NextResponse.json({ error: "couldn't write to the sheet. Is it shared with the service account?" }, { status: 502 });
  }
}

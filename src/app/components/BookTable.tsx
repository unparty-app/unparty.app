"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { BOOK_FILTERS, type SheetBook } from '@/lib/sheet-books';
import RowTable from './RowTable';

/**
 * BookTable - a Google Sheet, read as a database (/article/setup-google-sheet,
 * #469), as the house table (RowTable, #572): each book a row with its
 * title and author that opens to its quote, page, publisher and whether it's
 * available, and the questions a database answers as tabs above it (every
 * book, missing a quote, in all caps, has a publisher, available), each with
 * how many rows match.
 *
 * Reads /api/sheet/books: the owner's published sheet (BOOKS_SHEET_CSV_URL),
 * or the sample a copy ships with. Once writing is set up and an admin is
 * signed in, "add a book." writes a new row to the sheet.
 */

interface SheetResponse {
  source: 'sheet' | 'sample';
  books: SheetBook[];
  canWrite: boolean;
}

const label = 'font-google-sans-code text-xs uppercase tracking-wide';

export default function BookTable() {
  const { colorValue } = useTheme();
  const [data, setData] = useState<SheetResponse | null>(null);
  const [failed, setFailed] = useState(false);

  const load = () =>
    fetch('/api/sheet/books')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setFailed(true));
  useEffect(() => { load(); }, []);

  if (failed) {
    return <p className="py-8 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>the sheet didn&apos;t answer. check its link.</p>;
  }
  if (!data) {
    return <p className="py-8 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>thinking...</p>;
  }

  return (
    <div className="w-full">
      <RowTable
        rows={data.books}
        rowKey={(b) => `${b.title}-${b.author}`}
        label="book"
        name={(b) => b.title}
        nameSort={(b) => b.title.toLowerCase()}
        // The quiet line answers the table's first question: is there a quote yet
        meta={(b) => (b.quote ? <span className="italic">&ldquo;{b.quote}&rdquo;</span> : 'no quote yet.')}
        circle={(b) => ({ text: b.title, color: b.available ? colorValue : undefined })}
        columns={[
          { id: 'author', label: 'author', value: (b) => b.author, sort: (b) => b.author.toLowerCase(), dir: 'asc' },
          { id: 'publisher', label: 'publisher', value: (b) => b.publisher || '—', sort: (b) => b.publisher.toLowerCase() || undefined, dir: 'asc' },
          { id: 'page', label: 'page', value: (b) => b.page || '—', sort: (b) => (b.page ? Number(b.page) : undefined), dir: 'asc' },
        ]}
        sort={{ by: 'name', dir: 'asc' }}
        details={[
          { id: 'quote', label: 'quote', value: (b) => (b.quote ? <span className="italic">&ldquo;{b.quote}&rdquo;</span> : <span style={{ color: 'var(--text-muted)' }}>no quote yet.</span>) },
          { id: 'available', label: 'available', value: (b) => (b.available ? 'yes' : 'no') },
        ]}
        href={(b) => b.publisherLink || undefined}
        hrefLabel="the publisher"
        external
        filters={BOOK_FILTERS.map((f) => ({ id: f.id, label: f.label, test: f.test }))}
        search={(b, q) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)}
        searchLabel="search books"
        empty="no books match. that's a good answer too."
        footer={
          data.source === 'sheet' ? (
            'read from your google sheet.'
          ) : (
            <>
              read from the sample sheet.{' '}
              <a href="/setup-google-sheet/books-sample.csv" download className="underline" style={{ color: colorValue }}>download it to start yours</a>
            </>
          )
        }
      />

      {data.canWrite && <AddBook colorValue={colorValue} onAdded={load} />}
    </div>
  );
}

/** "add a book.": one new row on the owner's sheet, for an admin once writing is set up */
function AddBook({ colorValue, onAdded }: { colorValue: string; onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [quote, setQuote] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | string>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('saving');
    const r = await fetch('/api/sheet/books', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, author, quote }) });
    if (r.ok) {
      setTitle(''); setAuthor(''); setQuote(''); setState('saved');
      // The published CSV catches up in a few minutes; read again anyway
      onAdded();
    } else {
      setState((await r.json().catch(() => ({}))).error ?? 'that didn’t save.');
    }
  };

  const field = 'w-full rounded-lg border bg-transparent px-3 py-2 font-space-grotesk text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-color)]';
  return (
    <form onSubmit={submit} className="mt-8 grid gap-3 border-t pt-6" style={{ borderColor: `${colorValue}33` }}>
      <p className={label} style={{ color: 'var(--text-muted)' }}>add a book.</p>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className={field} style={{ borderColor: `${colorValue}66` }} />
      <input required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="author" className={field} style={{ borderColor: `${colorValue}66` }} />
      <input value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="a quote (optional)" className={field} style={{ borderColor: `${colorValue}66` }} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={state === 'saving'} className={`${label} rounded-full border px-4 py-2 disabled:opacity-40`} style={{ borderColor: colorValue, color: colorValue }}>
          {state === 'saving' ? 'saving...' : 'add it to the sheet'}
        </button>
        {state !== 'idle' && state !== 'saving' && (
          <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>{state === 'saved' ? 'added. it shows here once google republishes, in a few minutes.' : state}</span>
        )}
      </div>
    </form>
  );
}

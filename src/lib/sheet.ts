/**
 * A Google Sheet as a database (/article/setup-google-sheet). Reading needs no
 * keys: the owner publishes the sheet to the web as CSV (File → Share →
 * Publish to web) and the site fetches that link. Writing is optional and
 * needs a Google Cloud service account the sheet is shared with, the same
 * GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY that scripts/migrate-books.ts
 * and src/lib/ga-queries.ts use, plus GOOGLE_SHEETS_ID for which sheet
 * (src/lib/sheet-write.ts, server only: it carries the Google client).
 */

// How long a fetched sheet is reused. Google itself takes a few minutes to
// republish an edit, so checking more often wouldn't show it sooner
export const SHEET_REVALIDATE_SECONDS = 300;

/** CSV text as rows of cells: quoted cells, doubled quotes, and line breaks inside quotes */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

/** A sheet's rows as records, keyed by its first row (lowercased, trimmed) */
export function sheetRecords(rows: string[][]): Record<string, string>[] {
  const [header = [], ...body] = rows;
  const keys = header.map((h) => h.trim().toLowerCase());
  return body.map((cells) => Object.fromEntries(keys.map((key, i) => [key, (cells[i] ?? '').trim()])));
}

/** Fetch a published sheet's CSV, cached for SHEET_REVALIDATE_SECONDS */
export async function readSheetCsv(url: string): Promise<string[][]> {
  const response = await fetch(url, { next: { revalidate: SHEET_REVALIDATE_SECONDS } });
  if (!response.ok) throw new Error(`sheet answered ${response.status}`);
  return parseCsv(await response.text());
}

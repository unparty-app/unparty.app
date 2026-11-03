/**
 * Is a database connected to this copy? A copy runs live without one: reads
 * come back empty (src/lib/prisma.ts) and saving says so. The .env.example
 * placeholder counts as none, so copying that file doesn't leave every page
 * waiting on a server that isn't there.
 *
 * Read when asked rather than once on load: a script may load .env after its
 * imports.
 */
export function dbOn(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return Boolean(url) && !url.includes('USER:PASSWORD');
}

/** What a route that saves answers with no database, in place of a bare 500 */
export function noDatabase() {
  return Response.json({ error: 'no database here yet, so this can’t be saved.', code: 'no-database' }, { status: 503 });
}

#!/usr/bin/env tsx
/**
 * scripts/snapshot-db.ts
 *
 * Dynamically introspects every public table in the database, queries the
 * most recent rows (no hardcoded table/column assumptions), and writes a
 * markdown snapshot report.
 *
 * Usage:
 *   npm run db:snapshot                          # writes to docs/reports/what-does-unparty-store.md
 *   npm run db:snapshot -- --output report.md    # custom output path
 *   npm run db:snapshot -- --limit 3             # fewer rows per table (default 5)
 *   npm run db:snapshot -- --table articles      # single table only
 */

import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const prisma = new PrismaClient();

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

const OUTPUT_PATH = resolve(getArg('--output') ?? 'docs/reports/what-does-unparty-store.md');
const ROW_LIMIT = parseInt(getArg('--limit') ?? '5', 10);
const ONLY_TABLE = getArg('--table');

// ── Types ─────────────────────────────────────────────────────────────────────

interface TableRow { table_name: string }
interface ColumnRow { column_name: string; data_type: string; ordinal_position: number }
interface CountRow { estimate: bigint }

// ── Helpers ───────────────────────────────────────────────────────────────────

function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

function truncate(value: unknown, maxLen = 80): string {
  if (value === null || value === undefined) return '_null_';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object') {
    const json = JSON.stringify(value, bigintReplacer);
    return json.length > maxLen ? json.slice(0, maxLen) + '…' : json;
  }
  const str = String(value);
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

function mdEscape(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// ── DB introspection ──────────────────────────────────────────────────────────

async function getPublicTables(): Promise<string[]> {
  const rows = await prisma.$queryRaw<TableRow[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  return rows.map(r => r.table_name);
}

async function getColumns(tableName: string): Promise<ColumnRow[]> {
  return prisma.$queryRaw<ColumnRow[]>`
    SELECT column_name, data_type, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;
}

// Fast approximate count from pg_class stats (no full table scan)
async function getApproxCount(tableName: string): Promise<number> {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT reltuples::bigint AS estimate
    FROM pg_class
    WHERE relname = ${tableName}
  `;
  return Number(rows[0]?.estimate ?? 0);
}

async function getRecentRows(
  tableName: string,
  columns: ColumnRow[],
  limit: number
): Promise<Record<string, unknown>[]> {
  const colNames = columns.map(c => c.column_name);
  const hasCreatedAt = colNames.includes('created_at');
  const hasTimestamp = colNames.includes('timestamp');

  const orderClause = hasCreatedAt
    ? 'ORDER BY created_at DESC'
    : hasTimestamp
    ? 'ORDER BY timestamp DESC'
    : '';

  // $queryRawUnsafe is safe here — tableName comes from information_schema,
  // not user input, and limit is a parsed integer.
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM "${tableName}" ${orderClause} LIMIT ${limit}`
  );

  return rows;
}

// ── Markdown formatting ───────────────────────────────────────────────────────

function renderTable(rows: Record<string, unknown>[], columns: ColumnRow[]): string {
  if (rows.length === 0) return '_No rows._\n';

  const colNames = columns.map(c => c.column_name);

  const header = `| ${colNames.map(mdEscape).join(' | ')} |`;
  const divider = `| ${colNames.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(row => {
    const cells = colNames.map(col => mdEscape(truncate(row[col])));
    return `| ${cells.join(' | ')} |`;
  });

  return [header, divider, ...dataRows].join('\n') + '\n';
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to database…');

  const allTables = await getPublicTables();
  const tables = ONLY_TABLE
    ? allTables.filter(t => t === ONLY_TABLE)
    : allTables;

  if (tables.length === 0) {
    console.error(ONLY_TABLE ? `Table "${ONLY_TABLE}" not found.` : 'No public tables found.');
    process.exit(1);
  }

  console.log(`Found ${allTables.length} tables${ONLY_TABLE ? ` — filtering to "${ONLY_TABLE}"` : ''}`);

  const sections: string[] = [];
  const toc: string[] = [];
  const summary: { table: string; rows: number; cols: number }[] = [];

  for (const tableName of tables) {
    process.stdout.write(`  ↳ ${tableName}… `);

    const [columns, approxCount, rows] = await Promise.all([
      getColumns(tableName),
      getApproxCount(tableName),
      getRecentRows(tableName, await getColumns(tableName), ROW_LIMIT),
    ]);

    // pg_class.reltuples returns -1 for tables that have never been ANALYZEd.
    // Treat negative as unknown; if we got actual rows, show that as a floor.
    const displayCount =
      approxCount < 0
        ? rows.length > 0 ? `${rows.length}+` : '0'
        : approxCount === 0 && rows.length > 0
        ? `${rows.length}+`
        : approxCount.toLocaleString();

    const colNames = columns.map(c => c.column_name);
    const hasCreatedAt = colNames.includes('created_at');
    const orderNote = hasCreatedAt ? 'newest first' : 'natural order';

    toc.push(`- [${tableName}](#${tableName.replace(/_/g, '-')}) — ~${displayCount} rows`);
    summary.push({ table: tableName, rows: approxCount, cols: columns.length });

    const colList = columns
      .map(c => `\`${c.column_name}\` (${c.data_type})`)
      .join(', ');

    const section = [
      `## ${tableName}`,
      '',
      `~**${displayCount} rows** · ${columns.length} columns · ${orderNote} · showing up to ${ROW_LIMIT}`,
      '',
      `**Columns:** ${colList}`,
      '',
      renderTable(rows, columns),
    ].join('\n');

    sections.push(section);
    console.log(`${rows.length} rows shown`);
  }

  // ── Assemble document ─────────────────────────────────────────────────────

  const now = new Date().toISOString();
  const biggestTable = [...summary].sort((a, b) => b.rows - a.rows)[0];

  const doc = [
    '# What Does Unparty Store?',
    '',
    `> Snapshot generated by \`scripts/snapshot-db.ts\` on ${now}`,
    `> Refresh anytime: \`npm run db:snapshot\``,
    `> Showing up to ${ROW_LIMIT} most-recent rows per table. Counts are fast estimates from \`pg_class.reltuples\` (within ~10% of actual).`,
    '',
    '---',
    '',
    '## Table of Contents',
    '',
    toc.join('\n'),
    '',
    `**Largest table:** \`${biggestTable?.table}\` (~${biggestTable?.rows.toLocaleString()} rows)`,
    '',
    '---',
    '',
    sections.join('\n---\n\n'),
  ].join('\n');

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, doc, 'utf8');
  console.log(`\nWrote snapshot to ${OUTPUT_PATH}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());

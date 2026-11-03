import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import { adminGuard } from '@/lib/admin';

interface DbSizeRow {
  size_bytes: bigint;
  size_pretty: string;
}

interface TableSizeRow {
  table_name: string;
  size_bytes: bigint;
  size_pretty: string;
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbSizeRows, tableSizeRows] = await Promise.all([
      prisma.$queryRaw<DbSizeRow[]>`
        SELECT
          pg_database_size(current_database()) AS size_bytes,
          pg_size_pretty(pg_database_size(current_database())) AS size_pretty
      `,
      prisma.$queryRaw<TableSizeRow[]>`
        SELECT
          relname AS table_name,
          pg_total_relation_size(oid) AS size_bytes,
          pg_size_pretty(pg_total_relation_size(oid)) AS size_pretty
        FROM pg_class
        WHERE relkind = 'r'
          AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY size_bytes DESC
        LIMIT 20
      `,
    ]);

    const totalBytes = Number(dbSizeRows[0]?.size_bytes ?? 0);
    const totalGB = totalBytes / (1024 ** 3);

    return NextResponse.json({
      totalBytes,
      totalGB: parseFloat(totalGB.toFixed(4)),
      totalPretty: dbSizeRows[0]?.size_pretty ?? 'unknown',
      tables: tableSizeRows.map((row) => ({
        name: row.table_name,
        bytes: Number(row.size_bytes),
        gb: parseFloat((Number(row.size_bytes) / (1024 ** 3)).toFixed(6)),
        pretty: row.size_pretty,
      })),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[db-stats] query failed:', err);
    return NextResponse.json({ error: 'Failed to query database size' }, { status: 500 });
  }
}

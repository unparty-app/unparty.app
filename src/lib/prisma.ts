import { PrismaClient } from '@prisma/client'
import { dbOn } from './db-on'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * The same client with no database behind it, as the auth stubs are with no
 * sign-in behind them: every read finds nothing, so a page shows its empty
 * state, and a write throws rather than pretending it saved.
 */
function withoutDatabase(client: PrismaClient) {
  return client.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        if (dbOn()) return query(args);
        switch (operation) {
          case 'findMany':
          case 'groupBy':
          case '$queryRaw':
          case '$queryRawUnsafe':
            return [];
          case 'findFirst':
          case 'findUnique':
            return null;
          case 'count':
            return 0;
          default:
            throw new Error(`No database connected: ${model ?? 'prisma'}.${operation} can't run`);
        }
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? (dbOn() ? new PrismaClient() : withoutDatabase(new PrismaClient()))

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

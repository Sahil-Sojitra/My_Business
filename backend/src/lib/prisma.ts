import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Global singleton pattern for PrismaClient.
 * Prevents multiple instances and connection pool exhaustion in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

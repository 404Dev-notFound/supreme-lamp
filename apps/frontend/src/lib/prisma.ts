class PrismaClient { constructor(_?: any) {} }
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Use a loosely typed global to cache Prisma client across hot reloads
const globalAny = global as any;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma =
  globalAny.prisma ||
  new PrismaClient({
    adapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalAny.prisma = prisma;
}

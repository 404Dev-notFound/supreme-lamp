import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

class MockPrismaClient {
  user: {
    findUnique: (
      args: Record<string, unknown>,
    ) => Promise<{ id: string; password?: string; role?: string } | null>;
  };

  constructor(public options?: Record<string, unknown>) {
    this.user = {
      findUnique: async () => null,
    };
  }
}

declare global {
  var prismaGlobal: MockPrismaClient | undefined;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma =
  globalThis.prismaGlobal ??
  new MockPrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

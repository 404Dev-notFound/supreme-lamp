const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword9555@localhost:5432/flowCTRL";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma =
  globalThis.prismaBackend ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaBackend = prisma;
}

module.exports = { prisma };

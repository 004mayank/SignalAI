import { PrismaClient } from "@prisma/client";
import { requireDatabaseUrl } from "@/lib/env";

requireDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// In serverless environments each function instance has its own Node.js process.
// Limit to 1 connection per instance so concurrent invocations don't exhaust the pool.
function buildDatasourceUrl(): string {
  const base = process.env.DATABASE_URL ?? "";
  try {
    const u = new URL(base);
    if (!u.searchParams.has("connection_limit")) {
      u.searchParams.set("connection_limit", "1");
    }
    return u.toString();
  } catch {
    return base;
  }
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: { db: { url: buildDatasourceUrl() } },
  });
}

export const prisma = globalForPrisma.prisma;

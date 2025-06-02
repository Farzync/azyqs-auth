import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client for database access.
 *
 * Use this instance for all DB operations to avoid connection issues in development.
 *
 * Example usage:
 * const user = await prisma.user.findUnique({ where: { id } });
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

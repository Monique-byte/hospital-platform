import { PrismaClient } from "@prisma/client";

/**
 * Instancia unica do Prisma Client, reaproveitada por toda a aplicacao.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["warn", "error"]
    : ["error"],
});

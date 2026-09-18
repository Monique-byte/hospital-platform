import { prisma } from "@core/database/prisma";

export const PermissionsService = {
  /** Lista todas as permissoes (combinacoes modulo x acao) do catalogo. */
  list() {
    return prisma.permission.findMany({
      include: { module: true, action: true },
      orderBy: [{ module: { name: "asc" } }, { action: { name: "asc" } }],
    });
  },

  listModules() {
    return prisma.module.findMany({ orderBy: { name: "asc" } });
  },

  listActions() {
    return prisma.action.findMany({ orderBy: { name: "asc" } });
  },
};

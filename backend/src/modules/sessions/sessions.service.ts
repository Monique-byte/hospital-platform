import { prisma } from "@core/database/prisma";

/**
 * Gestao de sessoes (refresh tokens) por usuario. Usado pela tela de
 * "Seguranca / Sessoes ativas" no perfil do usuario e por rotinas
 * administrativas de revogacao (ex.: apos bloqueio de um usuario).
 */
export const SessionsService = {
  listByUser(userId: string) {
    return prisma.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, ip: true, userAgent: true, createdAt: true, expiresAt: true },
    });
  },

  async revoke(sessionId: string, userId: string) {
    await prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllByUser(userId: string) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};

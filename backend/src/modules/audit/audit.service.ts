import { prisma } from "@core/database/prisma";

export interface RecordAuditInput {
  userId?: string | null;
  action: string;
  moduleKey: string;
  entity?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Ponto unico de gravacao de auditoria.
 */
export async function recordAudit(input: RecordAuditInput) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      moduleKey: input.moduleKey,
      entity: input.entity,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata as any,
      ip: input.ip,
      userAgent: input.userAgent,
    },
  });
}

export const AuditService = {
  async list(params: {
    moduleKey?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);

    const where = {
      ...(params.moduleKey
        ? { moduleKey: params.moduleKey }
        : {}),
      ...(params.userId
        ? { userId: params.userId }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),

      prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  },
};

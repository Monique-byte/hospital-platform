import { prisma } from "@core/database/prisma";
import { PublicationTargetInput } from "./publications.types";

/**
 * Selecao "leve" para listagem - nao traz `content` (potencialmente
 * grande) nem anexos. Mesma logica de PUBLIC_SELECT x findByIdFull
 * usada em employees.repository.ts (select mais enxuto para listas,
 * select completo para detalhamento).
 */
export const LIST_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  featuredImageUrl: true,
  category: true,
  status: true,
  scheduledAt: true,
  publishedAt: true,
  expiresAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: { select: { id: true, name: true, email: true } },
  publishedBy: { select: { id: true, name: true, email: true } },
  targets: {
    select: {
      id: true, targetType: true, groupKey: true,
      unit: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      sector: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
  },
} as const;

/** Selecao completa - detalhamento (inclui conteudo e anexos). */
export const DETAIL_SELECT = {
  ...LIST_SELECT,
  content: true,
  attachments: {
    select: {
      id: true, originalName: true, storedName: true, mimeType: true, sizeBytes: true,
      storagePath: true, createdAt: true,
    },
  },
} as const;

export const PublicationsRepository = {
  findMany(where: any, page: number, pageSize: number) {
    return Promise.all([
      prisma.publication.findMany({
        where, select: LIST_SELECT,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.publication.count({ where }),
    ]);
  },

  findByIdDetail(id: string) {
    return prisma.publication.findUnique({ where: { id }, select: DETAIL_SELECT });
  },

  /** Usado internamente pelo service para checagens de estado/transicao (sem select reduzido). */
  findByIdRaw(id: string) {
    return prisma.publication.findUnique({ where: { id } });
  },

  create(data: {
    title: string; subtitle?: string; content: string; featuredImageUrl?: string;
    category: string; expiresAt?: Date; authorId: string;
    targets: PublicationTargetInput[];
  }) {
    const { targets, ...publicationData } = data;
    return prisma.publication.create({
      data: {
        ...publicationData,
        category: publicationData.category as any,
        targets: { create: targets.map((t) => ({ ...t, targetType: t.targetType as any })) },
      },
      select: DETAIL_SELECT,
    });
  },

  /**
   * Atualizacao cadastral (PATCH). Quando `targets` e informado, substitui
   * TODAS as regras de direcionamento existentes (padrao "set" identico ao
   * usado em RolesService.setPermissions / UsersRepository.setRoles).
   */
  async update(
    id: string,
    data: {
      title?: string; subtitle?: string; content?: string; featuredImageUrl?: string;
      category?: string; expiresAt?: Date | null; targets?: PublicationTargetInput[];
    }
  ) {
    const { targets, ...publicationData } = data;

    if (targets) {
      await prisma.$transaction([
        prisma.publicationTarget.deleteMany({ where: { publicationId: id } }),
        prisma.publication.update({
          where: { id },
          data: {
            ...publicationData,
            category: publicationData.category as any,
            targets: { create: targets.map((t) => ({ ...t, targetType: t.targetType as any })) },
          },
        }),
      ]);
      return prisma.publication.findUnique({ where: { id }, select: DETAIL_SELECT });
    }

    return prisma.publication.update({
      where: { id },
      data: { ...publicationData, category: publicationData.category as any },
      select: DETAIL_SELECT,
    });
  },

  publish(id: string, publishedById: string) {
    return prisma.publication.update({
      where: { id },
      data: { status: "PUBLICADA", publishedAt: new Date(), publishedById },
      select: DETAIL_SELECT,
    });
  },

  schedule(id: string, scheduledAt: Date) {
    return prisma.publication.update({
      where: { id },
      data: { status: "AGENDADA", scheduledAt, publishedAt: null },
      select: DETAIL_SELECT,
    });
  },

  archive(id: string) {
    return prisma.publication.update({
      where: { id },
      data: { status: "ARQUIVADA", archivedAt: new Date() },
      select: DETAIL_SELECT,
    });
  },

  /** Exclusao fisica - service garante que so e chamada para status = RASCUNHO. */
  delete(id: string) {
    return prisma.publication.delete({ where: { id } });
  },

  /**
   * Resolve o contexto organizacional do usuario autenticado a partir do
   * seu Employee vinculado (User -> Employee -> Sector -> Department ->
   * Unit, e Employee -> Position). Retorna `null` quando o usuario nao
   * possui Employee vinculado - nesse caso ele nao pertence
   * automaticamente a nenhuma unidade/departamento/setor/cargo.
   */
  async findRequesterOrgContext(userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: {
        id: true, positionId: true, sectorId: true,
        sector: { select: { departmentId: true, department: { select: { unitId: true } } } },
      },
    });

    if (!employee) return null;

    return {
      employeeId: employee.id,
      positionId: employee.positionId,
      sectorId: employee.sectorId,
      departmentId: employee.sector.departmentId,
      unitId: employee.sector.department.unitId,
    };
  },

  findUnitById(id: string) {
    return prisma.unit.findUnique({ where: { id } });
  },

  findDepartmentById(id: string) {
    return prisma.department.findUnique({ where: { id } });
  },

  findSectorById(id: string) {
    return prisma.sector.findUnique({ where: { id }, include: { department: true } });
  },

  findPositionById(id: string) {
    return prisma.position.findUnique({ where: { id } });
  },
};
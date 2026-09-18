import { prisma } from "@core/database/prisma";
import { DocumentTargetInput } from "./documents.types";

export const LIST_SELECT = {
  id: true, title: true, description: true, category: true, status: true,
  tags: true, authorId: true, archivedAt: true, createdAt: true, updatedAt: true,
  author: { select: { id: true, name: true, email: true } },
  currentVersion: {
    select: { id: true, versionNumber: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true },
  },
  targets: {
    select: {
      id: true, targetType: true, groupKey: true, targetUserId: true,
      unit: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      sector: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
  },
} as const;

export const DETAIL_SELECT = {
  ...LIST_SELECT,
  versions: {
    select: { id: true, versionNumber: true, originalName: true, mimeType: true, sizeBytes: true, changeNote: true, createdAt: true, authorId: true, author: { select: { id: true, name: true } } },
    orderBy: { versionNumber: "desc" },
  },
} as const;

export const DocumentsRepository = {
  findMany(where: any, page: number, pageSize: number) {
    return Promise.all([
      prisma.document.findMany({ where, select: LIST_SELECT, orderBy: [{ createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.document.count({ where }),
    ]);
  },

  findByIdDetail(id: string) {
    return prisma.document.findUnique({ where: { id }, select: DETAIL_SELECT });
  },

  findByIdRaw(id: string) {
    return prisma.document.findUnique({ where: { id } });
  },

  async create(data: {
    title: string; description?: string; category: string; tags: string[]; authorId: string;
    targets: DocumentTargetInput[];
    firstVersion: { originalName: string; storedName: string; mimeType: string; sizeBytes: number; storagePath: string };
  }) {
    const document = await prisma.document.create({
      data: {
        title: data.title, description: data.description, category: data.category as any,
        tags: data.tags, authorId: data.authorId,
        targets: { create: data.targets.map((t) => ({ ...t, targetType: t.targetType as any })) },
      },
    });

    const version = await prisma.documentVersion.create({
      data: {
        documentId: document.id, versionNumber: 1, authorId: data.authorId,
        originalName: data.firstVersion.originalName, storedName: data.firstVersion.storedName,
        mimeType: data.firstVersion.mimeType, sizeBytes: data.firstVersion.sizeBytes,
        storagePath: data.firstVersion.storagePath,
      },
    });

    return prisma.document.update({
      where: { id: document.id },
      data: { currentVersionId: version.id },
      select: DETAIL_SELECT,
    });
  },

  async addVersion(documentId: string, data: {
    authorId: string; changeNote?: string;
    file: { originalName: string; storedName: string; mimeType: string; sizeBytes: number; storagePath: string };
  }) {
    const last = await prisma.documentVersion.findFirst({ where: { documentId }, orderBy: { versionNumber: "desc" } });
    const nextVersionNumber = (last?.versionNumber ?? 0) + 1;

    const version = await prisma.documentVersion.create({
      data: {
        documentId, versionNumber: nextVersionNumber, authorId: data.authorId, changeNote: data.changeNote,
        originalName: data.file.originalName, storedName: data.file.storedName,
        mimeType: data.file.mimeType, sizeBytes: data.file.sizeBytes, storagePath: data.file.storagePath,
      },
    });

    return prisma.document.update({ where: { id: documentId }, data: { currentVersionId: version.id }, select: DETAIL_SELECT });
  },

  async update(id: string, data: { title?: string; description?: string; category?: string; tags?: string[]; targets?: DocumentTargetInput[] }) {
    const { targets, ...rest } = data;
    if (targets) {
      await prisma.$transaction([
        prisma.documentTarget.deleteMany({ where: { documentId: id } }),
        prisma.document.update({ where: { id }, data: { ...rest, category: rest.category as any, targets: { create: targets.map((t) => ({ ...t, targetType: t.targetType as any })) } } }),
      ]);
      return prisma.document.findUnique({ where: { id }, select: DETAIL_SELECT });
    }
    return prisma.document.update({ where: { id }, data: { ...rest, category: rest.category as any }, select: DETAIL_SELECT });
  },

  archive(id: string) {
    return prisma.document.update({ where: { id }, data: { status: "ARQUIVADO", archivedAt: new Date() }, select: DETAIL_SELECT });
  },

  activate(id: string) {
    return prisma.document.update({ where: { id }, data: { status: "ATIVO", archivedAt: null }, select: DETAIL_SELECT });
  },

  async delete(id: string) {
    const versions = await prisma.documentVersion.findMany({ where: { documentId: id }, select: { storagePath: true } });
    await prisma.document.delete({ where: { id } });
    return versions;
  },

  findVersionById(documentId: string, versionId: string) {
    return prisma.documentVersion.findFirst({ where: { id: versionId, documentId } });
  },

  async findRequesterOrgContext(userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true, positionId: true, sectorId: true, sector: { select: { departmentId: true, department: { select: { unitId: true } } } } },
    });
    if (!employee) return null;
    return { employeeId: employee.id, positionId: employee.positionId, sectorId: employee.sectorId, departmentId: employee.sector.departmentId, unitId: employee.sector.department.unitId };
  },
};
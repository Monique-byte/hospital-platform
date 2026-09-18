import { DocumentsRepository } from "./documents.repository";
import { storageProvider } from "@core/storage/LocalStorageProvider";
import { ConflictError, NotFoundError, ValidationError } from "@core/errors/AppError";
import { recordAudit } from "@modules/audit/audit.service";
import { JwtAccessPayload } from "@modules/auth/auth.types";
import {
  CreateDocumentInput, UpdateDocumentInput, DocumentListFilters, DocumentTargetInput, RequesterOrgContext,
} from "./documents.types";

/**
 * Documentos e um modulo EXCLUSIVAMENTE INTERNO (diferente de
 * Publicacoes) - nao existe requisito de acesso publico/anonimo para
 * documentos. Todas as rotas exigem authenticate; a diferenciacao aqui
 * e apenas entre "gestor de documentos" (ve tudo) e "funcionario comum"
 * (ve so o que e direcionado a ele), no mesmo espirito de Publicacoes.
 */
const CONTENT_MANAGEMENT_PERMISSIONS = [
  "documentos:create", "documentos:edit", "documentos:delete", "documentos:archive", "documentos:activate",
];

function isContentManager(requester: JwtAccessPayload) {
  return CONTENT_MANAGEMENT_PERMISSIONS.some((p) => requester.permissions.includes(p));
}

async function validateTargets(targets: DocumentTargetInput[]) {
  if (!targets || targets.length === 0) throw new ValidationError("Informe ao menos uma regra de publico-alvo.");
  for (const target of targets) {
    switch (target.targetType) {
      case "TODOS": break;
      case "UNIDADE":
        if (!target.unitId) throw new ValidationError("unitId e obrigatorio para UNIDADE.");
        break;
      case "DEPARTAMENTO":
        if (!target.departmentId) throw new ValidationError("departmentId e obrigatorio para DEPARTAMENTO.");
        break;
      case "SETOR":
        if (!target.sectorId) throw new ValidationError("sectorId e obrigatorio para SETOR.");
        break;
      case "CARGO":
        if (!target.positionId) throw new ValidationError("positionId e obrigatorio para CARGO.");
        break;
      case "GRUPO":
        if (!target.groupKey?.trim()) throw new ValidationError("groupKey e obrigatorio para GRUPO.");
        break;
      case "USUARIO":
        if (!target.targetUserId) throw new ValidationError("targetUserId e obrigatorio para USUARIO.");
        break;
      default:
        throw new ValidationError(`Tipo de publico-alvo desconhecido: ${target.targetType}`);
    }
  }
}

function buildAudienceWhere(orgContext: RequesterOrgContext | null, userId: string) {
  const or: any[] = [{ targetType: "TODOS" }, { targetType: "USUARIO", targetUserId: userId }];
  if (orgContext) {
    or.push({ targetType: "UNIDADE", unitId: orgContext.unitId });
    or.push({ targetType: "DEPARTAMENTO", departmentId: orgContext.departmentId });
    or.push({ targetType: "SETOR", sectorId: orgContext.sectorId });
    or.push({ targetType: "CARGO", positionId: orgContext.positionId });
  }
  return { some: { OR: or } };
}

export const DocumentsService = {
  async list(filters: DocumentListFilters, requester: JwtAccessPayload) {
    const { page, pageSize, search, category, tag } = filters;
    const where: any = {
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    };

    if (isContentManager(requester)) {
      where.status = filters.status ?? { not: "ARQUIVADO" };
      const [items, total] = await DocumentsRepository.findMany(where, page, pageSize);
      return { items, total, page, pageSize };
    }

    where.status = "ATIVO";
    const orgContext = await DocumentsRepository.findRequesterOrgContext(requester.sub);
    where.targets = buildAudienceWhere(orgContext, requester.sub);
    const [items, total] = await DocumentsRepository.findMany(where, page, pageSize);
    return { items, total, page, pageSize };
  },

  async getById(id: string, requester: JwtAccessPayload) {
    const document = await DocumentsRepository.findByIdDetail(id);
    if (!document) throw new NotFoundError("Documento nao encontrado.");
    if (isContentManager(requester)) return document;

    if (document.status !== "ATIVO") throw new NotFoundError("Documento nao encontrado.");

    const orgContext = await DocumentsRepository.findRequesterOrgContext(requester.sub);
    const visible = document.targets.some((t) => {
      if (t.targetType === "TODOS") return true;
      if (t.targetType === "USUARIO") return t.targetUserId === requester.sub;
      if (!orgContext) return false;
      if (t.targetType === "UNIDADE") return t.unit?.id === orgContext.unitId;
      if (t.targetType === "DEPARTAMENTO") return t.department?.id === orgContext.departmentId;
      if (t.targetType === "SETOR") return t.sector?.id === orgContext.sectorId;
      if (t.targetType === "CARGO") return t.position?.id === orgContext.positionId;
      return false;
    });
    if (!visible) throw new NotFoundError("Documento nao encontrado.");

    await recordAudit({ userId: requester.sub, action: "VIEW", moduleKey: "documentos", entity: "Document", entityId: id, description: `Documento "${document.title}" visualizado.` });
    return document;
  },

  async create(input: CreateDocumentInput, file: Express.Multer.File, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    await validateTargets(input.targets);
    const saved = await storageProvider.save({ buffer: file.buffer, fileName: file.originalname, mimeType: file.mimetype });

    const document = await DocumentsRepository.create({
      title: input.title, description: input.description, category: input.category,
      tags: input.tags ?? [], authorId: requester.sub, targets: input.targets,
      firstVersion: { originalName: file.originalname, storedName: saved.storagePath, mimeType: file.mimetype, sizeBytes: saved.sizeBytes, storagePath: saved.storagePath },
    });

    await recordAudit({ userId: requester.sub, action: "CREATE", moduleKey: "documentos", entity: "Document", entityId: document.id, description: `Documento "${document.title}" criado (v1).`, ip, userAgent });
    return document;
  },

  async addVersion(id: string, file: Express.Multer.File, changeNote: string | undefined, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await DocumentsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Documento nao encontrado.");
    if (existing.status === "ARQUIVADO") throw new ConflictError("Documentos arquivados nao podem receber novas versoes.");

    const saved = await storageProvider.save({ buffer: file.buffer, fileName: file.originalname, mimeType: file.mimetype });
    const updated = await DocumentsRepository.addVersion(id, {
      authorId: requester.sub, changeNote,
      file: { originalName: file.originalname, storedName: saved.storagePath, mimeType: file.mimetype, sizeBytes: saved.sizeBytes, storagePath: saved.storagePath },
    });

    await recordAudit({ userId: requester.sub, action: "UPDATE", moduleKey: "documentos", entity: "Document", entityId: id, description: `Nova versao adicionada ao documento "${existing.title}".`, ip, userAgent });
    return updated;
  },

  async update(id: string, input: UpdateDocumentInput, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await DocumentsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Documento nao encontrado.");
    if (existing.status === "ARQUIVADO") throw new ConflictError("Documentos arquivados nao podem ser editados.");
    if (input.targets) await validateTargets(input.targets);

    const updated = await DocumentsRepository.update(id, input);
    await recordAudit({ userId: requester.sub, action: "UPDATE", moduleKey: "documentos", entity: "Document", entityId: id, description: "Metadados do documento atualizados.", metadata: input as Record<string, unknown>, ip, userAgent });
    return updated;
  },

  async archive(id: string, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await DocumentsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Documento nao encontrado.");
    const updated = await DocumentsRepository.archive(id);
    await recordAudit({ userId: requester.sub, action: "ARCHIVE", moduleKey: "documentos", entity: "Document", entityId: id, description: "Documento arquivado.", ip, userAgent });
    return updated;
  },

  async activate(id: string, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await DocumentsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Documento nao encontrado.");
    const updated = await DocumentsRepository.activate(id);
    await recordAudit({ userId: requester.sub, action: "UPDATE", moduleKey: "documentos", entity: "Document", entityId: id, description: "Documento reativado.", ip, userAgent });
    return updated;
  },

  async delete(id: string, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await DocumentsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Documento nao encontrado.");

    await recordAudit({ userId: requester.sub, action: "DELETE", moduleKey: "documentos", entity: "Document", entityId: id, description: `Documento "${existing.title}" excluido.`, ip, userAgent });

    const versions = await DocumentsRepository.delete(id);
    await Promise.all(versions.map((v) => storageProvider.delete(v.storagePath)));
  },

  async download(id: string, versionId: string, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const document = await this.getById(id, requester); // reaproveita toda a checagem de visibilidade acima
    const version = await DocumentsRepository.findVersionById(id, versionId);
    if (!version) throw new NotFoundError("Versao nao encontrada.");

    await recordAudit({ userId: requester.sub, action: "DOWNLOAD", moduleKey: "documentos", entity: "Document", entityId: id, description: `Download da versao ${version.versionNumber} de "${document.title}".`, ip, userAgent });
    return version;
  },
};
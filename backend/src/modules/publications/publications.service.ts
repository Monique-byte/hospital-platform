import { PublicationsRepository } from "./publications.repository";
import { ConflictError, NotFoundError, ValidationError } from "@core/errors/AppError";
import { recordAudit } from "@modules/audit/audit.service";
import { JwtAccessPayload } from "@modules/auth/auth.types";
import {
  CreatePublicationInput, UpdatePublicationInput, PublicationListFilters,
  PublicationTargetInput, RequesterOrgContext, PublicationStatusValue,
} from "./publications.types";
import { publicationImageStorageProvider } from "@core/storage/PublicationImageStorageProvider";

// ---------------------------------------------------------------------------
// Permissoes que caracterizam um "gestor de conteudo" do modulo (alem de
// "view"). Quem possui qualquer uma delas enxerga TODAS as publicacoes na
// listagem/detalhamento (modo administrativo), independente de publico-alvo
// e de status. Quem so tem "publicacoes:view" enxerga apenas o que esta
// efetivamente ativo E direcionado a ele (modo "consulta da intranet").
// Isso implementa exatamente a distincao pedida na Fase 3.2 entre consulta
// administrativa x consulta de publicacoes disponiveis para o usuario atual.
// ---------------------------------------------------------------------------
const CONTENT_MANAGEMENT_PERMISSIONS = [
  "publicacoes:create", "publicacoes:edit", "publicacoes:publish",
  "publicacoes:schedule", "publicacoes:archive", "publicacoes:delete",
];

function isContentManager(requester: JwtAccessPayload) {
  return CONTENT_MANAGEMENT_PERMISSIONS.some((p) => requester.permissions.includes(p));
}

// ---------------------------------------------------------------------------
// Maquina de estados - unica fonte de verdade sobre transicoes permitidas.
// Mantida como um mapa simples e explicito, conforme solicitado.
// ---------------------------------------------------------------------------
const ALLOWED_TRANSITIONS: Record<PublicationStatusValue, PublicationStatusValue[]> = {
  RASCUNHO: ["PUBLICADA", "AGENDADA"],
  AGENDADA: ["PUBLICADA", "ARQUIVADA"],
  PUBLICADA: ["EXPIRADA", "ARQUIVADA"],
  EXPIRADA: [],
  ARQUIVADA: [],
};

function assertTransitionAllowed(current: PublicationStatusValue, next: PublicationStatusValue) {
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new ConflictError(`Transicao de status invalida: ${current} -> ${next}.`);
  }
}

// ---------------------------------------------------------------------------
// Regra de expiracao (Fase 3.2 - sem job automatico ainda).
// Uma publicacao com status=PUBLICADA cujo expiresAt ja passou deve ser
// tratada como inativa/expirada nas consultas, mesmo que a coluna `status`
// no banco ainda diga "PUBLICADA" (nenhuma rotina automatica altera isso
// nesta fase). Esta funcao pura e o unico ponto de decisao dessa regra,
// para que uma futura rotina agendada (job) possa reaproveita-la
// diretamente para executar PUBLICADA -> EXPIRADA em lote, sem precisar
// reestruturar o modulo.
// ---------------------------------------------------------------------------
export function isEffectivelyExpired(publication: { status: string; expiresAt: Date | null }): boolean {
  return publication.status === "PUBLICADA" && !!publication.expiresAt && publication.expiresAt <= new Date();
}

/** Status "efetivo" para exibicao - reflete a expiracao mesmo antes do job rodar. */
function computeEffectiveStatus(publication: { status: string; expiresAt: Date | null }): PublicationStatusValue {
  if (isEffectivelyExpired(publication)) return "EXPIRADA";
  return publication.status as PublicationStatusValue;
}

function withEffectiveStatus<T extends { status: string; expiresAt: Date | null }>(publication: T) {
  return { ...publication, effectiveStatus: computeEffectiveStatus(publication) };
}

// ---------------------------------------------------------------------------
// Validacao de publico-alvo: existencia das referencias e coerencia da
// hierarquia organizacional (ex.: um setor informado deve realmente
// pertencer ao departamento informado, quando ambos forem enviados).
// ---------------------------------------------------------------------------
async function validateTargets(targets: PublicationTargetInput[]) {
  if (!targets || targets.length === 0) {
    throw new ValidationError("Informe ao menos uma regra de publico-alvo.");
  }

  for (const target of targets) {
    switch (target.targetType) {
      case "TODOS":
        break;

      case "UNIDADE": {
        if (!target.unitId) throw new ValidationError("unitId e obrigatorio para publico-alvo do tipo UNIDADE.");
        const unit = await PublicationsRepository.findUnitById(target.unitId);
        if (!unit) throw new NotFoundError("Unidade informada no publico-alvo nao encontrada.");
        break;
      }

      case "DEPARTAMENTO": {
        if (!target.departmentId) throw new ValidationError("departmentId e obrigatorio para publico-alvo do tipo DEPARTAMENTO.");
        const department = await PublicationsRepository.findDepartmentById(target.departmentId);
        if (!department) throw new NotFoundError("Departamento informado no publico-alvo nao encontrado.");
        if (target.unitId && department.unitId !== target.unitId) {
          throw new ConflictError("O departamento informado nao pertence a unidade informada.");
        }
        break;
      }

      case "SETOR": {
        if (!target.sectorId) throw new ValidationError("sectorId e obrigatorio para publico-alvo do tipo SETOR.");
        const sector = await PublicationsRepository.findSectorById(target.sectorId);
        if (!sector) throw new NotFoundError("Setor informado no publico-alvo nao encontrado.");
        if (target.departmentId && sector.departmentId !== target.departmentId) {
          throw new ConflictError("O setor informado nao pertence ao departamento informado.");
        }
        if (target.unitId && sector.department.unitId !== target.unitId) {
          throw new ConflictError("O setor informado nao pertence a unidade informada.");
        }
        break;
      }

      case "CARGO": {
        if (!target.positionId) throw new ValidationError("positionId e obrigatorio para publico-alvo do tipo CARGO.");
        const position = await PublicationsRepository.findPositionById(target.positionId);
        if (!position) throw new NotFoundError("Cargo informado no publico-alvo nao encontrado.");
        break;
      }

      case "GRUPO": {
        // Nao ha entidade de Grupo no sistema ainda (Fase 3.1). Guardamos
        // apenas o rotulo livre; a resolucao de pertencimento a um grupo
        // fica para uma fase futura de integracao com Grupos - documentado
        // tambem em resolveVisibilityFilter() abaixo.
        if (!target.groupKey || !target.groupKey.trim()) {
          throw new ValidationError("groupKey e obrigatorio para publico-alvo do tipo GRUPO.");
        }
        break;
      }

      default:
        throw new ValidationError(`Tipo de publico-alvo desconhecido: ${target.targetType}`);
    }
  }
}

/**
 * Monta a clausula de visibilidade (Prisma where) para o modo "consulta da
 * intranet" (usuario sem permissao de gestao de conteudo).
 *
 * IMPORTANTE: publico-alvo GRUPO nunca e resolvido automaticamente nesta
 * fase - nao existe uma entidade de Grupo nem uma relacao de pertencimento
 * de usuario a grupo no sistema. Uma publicacao direcionada exclusivamente
 * a um GRUPO nao aparecera para usuarios comuns ate que uma fase futura
 * implemente essa resolucao (limitacao documentada, sem arquitetura
 * paralela criada para contorna-la).
 */
function buildAudienceWhere(orgContext: RequesterOrgContext | null) {
  const or: any[] = [{ targetType: "TODOS" }];

  if (orgContext) {
    or.push({ targetType: "UNIDADE", unitId: orgContext.unitId });
    or.push({ targetType: "DEPARTAMENTO", departmentId: orgContext.departmentId });
    or.push({ targetType: "SETOR", sectorId: orgContext.sectorId });
    or.push({ targetType: "CARGO", positionId: orgContext.positionId });
  }

  return { some: { OR: or } };
}

/** Formato de uma linha de PublicationTarget conforme LIST_SELECT/DETAIL_SELECT (publications.repository.ts). */
type PublicationTargetRow = {
  id: string;
  targetType: string;
  groupKey: string | null;
  unit: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  sector: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
};

export const PublicationsService = {
  /**
   * Listagem. Ramifica automaticamente entre:
   *  - modo administrativo (requester com permissao de gestao de conteudo):
   *    ve todas as publicacoes, todos os status, sem filtro de publico-alvo;
   *  - modo consulta da intranet (somente "publicacoes:view"): ve apenas
   *    publicacoes com status PUBLICADA, ainda nao expiradas, e cujo
   *    publico-alvo o inclua.
   */
   async list(filters: PublicationListFilters, requester?: JwtAccessPayload) {
    const { page, pageSize, search, category, authorId, unitId, departmentId, sectorId, dateFrom, dateTo } = filters;
    const now = new Date();

    const where: any = {
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category } : {}),
      ...(authorId ? { authorId } : {}),
      ...(unitId ? { targets: { some: { unitId } } } : {}),
      ...(departmentId ? { targets: { some: { departmentId } } } : {}),
      ...(sectorId ? { targets: { some: { sectorId } } } : {}),
      ...(dateFrom || dateTo
        ? { createdAt: { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) } }
        : {}),
    };

        if (requester && isContentManager(requester)) {
      // Modo administrativo: respeita o filtro de status explicito, com a
      // mesma semantica "efetiva" de expiracao. Sem filtro, segue o mesmo
      // padrao ja usado em EmployeesRepository (oculta ARQUIVADA por
      // padrao, equivalente a ocultar INATIVO no diretorio de funcionarios).
      if (filters.status === "PUBLICADA") {
        where.status = "PUBLICADA";
        where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
      } else if (filters.status === "EXPIRADA") {
        where.OR = [{ status: "EXPIRADA" }, { status: "PUBLICADA", expiresAt: { lte: now } }];
      } else if (filters.status) {
        where.status = filters.status;
      } else {
        where.status = { not: "ARQUIVADA" };
      }

      const [items, total] = await PublicationsRepository.findMany(where, page, pageSize);
      return { items: items.map(withEffectiveStatus), total, page, pageSize };
    }

    // Modo consulta da intranet: forca sempre "ativo e visivel", ignorando
    // qualquer filtro de status enviado pelo cliente (nao confiar no frontend).
    // Tambem SOBRESCREVE deliberadamente qualquer filtro de unitId/
    // departmentId/sectorId que o cliente tenha enviado: esses filtros sao
    // um recurso administrativo (ver bloco acima) e, para quem so tem
    // "publicacoes:view", a visibilidade e sempre determinada pelo proprio
    // publico-alvo do usuario - nunca por um id arbitrario informado na
    // query string (evita enumerar/sondar conteudo de outras unidades).
         // requester pode ser undefined aqui (visitante anonimo, Regra
    // Fundamental de Acesso) - nesse caso nao ha contexto organizacional
    // algum, exatamente como ja acontecia para usuario autenticado sem
    // Employee vinculado. Reaproveita 100% de buildAudienceWhere(): com
    // orgContext=null, so a clausula targetType="TODOS" e aplicada.
    const orgContext = requester
      ? await PublicationsRepository.findRequesterOrgContext(requester.sub)
      : null;
    where.status = "PUBLICADA";
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
    where.targets = buildAudienceWhere(orgContext);

    const [items, total] = await PublicationsRepository.findMany(where, page, pageSize);
    return { items: items.map(withEffectiveStatus), total, page, pageSize };
  },

  /**
   * Detalhamento. Fora do modo administrativo, so retorna a publicacao se
   * ela estiver ativa (PUBLICADA e nao expirada) E o publico-alvo incluir
   * o usuario. Caso contrario, comporta-se como se o registro nao
   * existisse (404) - nunca 403 - para nao vazar a existencia/direcionamento
   * de conteudo restrito por tentativa de acesso direto ao :id (IDOR).
   */
   async getById(id: string, requester?: JwtAccessPayload) {
    const publication = await PublicationsRepository.findByIdDetail(id);
    if (!publication) throw new NotFoundError("Publicacao nao encontrada.");

    if (requester && isContentManager(requester)) {
      return withEffectiveStatus(publication);
    }

    const isActive = publication.status === "PUBLICADA" && !isEffectivelyExpired(publication);
    if (!isActive) throw new NotFoundError("Publicacao nao encontrada.");

    // requester pode ser undefined (visitante anonimo). Sem requester,
    // orgContext e sempre null e visibleTargetTypes permanece apenas com
    // "TODOS" - mesmo comportamento ja usado para usuario sem Employee.
    const orgContext = requester
      ? await PublicationsRepository.findRequesterOrgContext(requester.sub)
      : null;
      
    const visibleTargetTypes = new Set(["TODOS"]);
    if (orgContext) {
      if (publication.targets.some((t: PublicationTargetRow) => t.targetType === "UNIDADE" && t.unit?.id === orgContext.unitId)) visibleTargetTypes.add("UNIDADE");
      if (publication.targets.some((t: PublicationTargetRow) => t.targetType === "DEPARTAMENTO" && t.department?.id === orgContext.departmentId)) visibleTargetTypes.add("DEPARTAMENTO");
      if (publication.targets.some((t: PublicationTargetRow) => t.targetType === "SETOR" && t.sector?.id === orgContext.sectorId)) visibleTargetTypes.add("SETOR");
      if (publication.targets.some((t: PublicationTargetRow) => t.targetType === "CARGO" && t.position?.id === orgContext.positionId)) visibleTargetTypes.add("CARGO");
    }

    const isVisible = publication.targets.some((t: PublicationTargetRow) => visibleTargetTypes.has(t.targetType));
    if (!isVisible) throw new NotFoundError("Publicacao nao encontrada.");

    return withEffectiveStatus(publication);
  },

  /** Criacao. authorId sempre vem do usuario autenticado; status inicial e sempre RASCUNHO. */
  async create(input: CreatePublicationInput, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    await validateTargets(input.targets);

    if (input.expiresAt && new Date(input.expiresAt) <= new Date()) {
      throw new ValidationError("A data de expiracao deve ser futura.");
    }

    const publication = await PublicationsRepository.create({
      title: input.title,
      subtitle: input.subtitle,
      content: input.content,
      featuredImageUrl: input.featuredImageUrl,
      category: input.category,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      authorId: requester.sub,
      targets: input.targets,
    });

    await recordAudit({
      userId: requester.sub, action: "CREATE", moduleKey: "publicacoes",
      entity: "Publication", entityId: publication.id,
      description: `Publicacao "${publication.title}" criada como RASCUNHO.`,
      ip, userAgent,
    });

    return withEffectiveStatus(publication);
  },

  /**
   * Edicao (PATCH). Bloqueada para publicacoes ARQUIVADA - preserva o
   * historico/imutabilidade de conteudo arquivado. Nunca altera status,
   * authorId, publishedById, publishedAt ou archivedAt (o DTO
   * UpdatePublicationInput nem permite esses campos).
   */
  async update(id: string, input: UpdatePublicationInput, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await PublicationsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Publicacao nao encontrada.");

    if (existing.status === "ARQUIVADA") {
      throw new ConflictError("Publicacoes arquivadas nao podem ser editadas.");
    }

    if (input.targets) await validateTargets(input.targets);

    const nextExpiresAt = input.expiresAt === null ? null : input.expiresAt ? new Date(input.expiresAt) : undefined;
    if (nextExpiresAt && nextExpiresAt <= new Date()) {
      throw new ValidationError("A data de expiracao deve ser futura.");
    }

    const updated = await PublicationsRepository.update(id, {
      title: input.title,
      subtitle: input.subtitle,
      content: input.content,
      featuredImageUrl: input.featuredImageUrl,
      category: input.category,
      expiresAt: nextExpiresAt,
      targets: input.targets,
    });

    await recordAudit({
      userId: requester.sub, action: "UPDATE", moduleKey: "publicacoes",
      entity: "Publication", entityId: id, description: "Dados da publicacao atualizados.",
      metadata: input as Record<string, unknown>, ip, userAgent,
    });

    return withEffectiveStatus(updated!);
  },

  /** Publicacao imediata. Permitido a partir de RASCUNHO ou AGENDADA. */
  async publish(id: string, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await PublicationsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Publicacao nao encontrada.");

    assertTransitionAllowed(existing.status as PublicationStatusValue, "PUBLICADA");

    if (existing.expiresAt && existing.expiresAt <= new Date()) {
      throw new ConflictError("Nao e possivel publicar: a data de expiracao ja foi ultrapassada.");
    }

    const updated = await PublicationsRepository.publish(id, requester.sub);

    await recordAudit({
      userId: requester.sub, action: "PUBLISH", moduleKey: "publicacoes",
      entity: "Publication", entityId: id, description: "Publicacao publicada.",
      metadata: { previousStatus: existing.status }, ip, userAgent,
    });

    return withEffectiveStatus(updated);
  },

  /** Agendamento. Permitido somente a partir de RASCUNHO. */
  async schedule(id: string, scheduledAtInput: string, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await PublicationsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Publicacao nao encontrada.");

    assertTransitionAllowed(existing.status as PublicationStatusValue, "AGENDADA");

    const scheduledAt = new Date(scheduledAtInput);
    if (scheduledAt <= new Date()) {
      throw new ValidationError("A data de agendamento deve ser futura.");
    }
    if (existing.expiresAt && existing.expiresAt <= scheduledAt) {
      throw new ValidationError("A data de expiracao, quando informada, deve ser posterior a data de agendamento.");
    }

    const updated = await PublicationsRepository.schedule(id, scheduledAt);

    await recordAudit({
      userId: requester.sub, action: "SCHEDULE", moduleKey: "publicacoes",
      entity: "Publication", entityId: id, description: `Publicacao agendada para ${scheduledAt.toISOString()}.`,
      metadata: { scheduledAt: scheduledAt.toISOString() }, ip, userAgent,
    });

    return withEffectiveStatus(updated);
  },

  /** Arquivamento. Permitido a partir de AGENDADA ou PUBLICADA. Preserva historico (nunca exclui). */
  async archive(id: string, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await PublicationsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Publicacao nao encontrada.");

    assertTransitionAllowed(existing.status as PublicationStatusValue, "ARQUIVADA");

    const updated = await PublicationsRepository.archive(id);

    await recordAudit({
      userId: requester.sub, action: "ARCHIVE", moduleKey: "publicacoes",
      entity: "Publication", entityId: id, description: "Publicacao arquivada.",
      metadata: { previousStatus: existing.status }, ip, userAgent,
    });

    return withEffectiveStatus(updated);
  },

  /**
   * Exclusao. Segue o padrao ja usado no projeto (Funcionarios: preservar
   * historico, nunca excluir fisicamente algo que ja teve vida "real").
   * Para Publicacoes, isso significa: exclusao fisica so e permitida para
   * RASCUNHO (nunca foi publicado, sem historico/auditoria relevante para
   * terceiros). Qualquer outro status deve ser arquivado, nao excluido -
   * ver POST /:id/arquivar.
   */
  async delete(id: string, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await PublicationsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Publicacao nao encontrada.");

    if (existing.status !== "RASCUNHO") {
      throw new ConflictError(
        "Somente publicacoes em RASCUNHO podem ser excluidas fisicamente. Utilize o arquivamento para os demais status."
      );
    }

    // Registra a auditoria ANTES de excluir - o AuditLog nao possui FK para
    // Publication (entityId e apenas uma referencia textual), entao o
    // registro de auditoria permanece valido mesmo apos a exclusao.
    await recordAudit({
      userId: requester.sub, action: "DELETE", moduleKey: "publicacoes",
      entity: "Publication", entityId: id,
      description: `Publicacao "${existing.title}" (RASCUNHO) excluida fisicamente.`,
      metadata: { snapshot: { title: existing.title, category: existing.category } },
      ip, userAgent,
    });

    await PublicationsRepository.delete(id);
  },
    /**
   * Upload da imagem de destaque. Rota separada (nao passa pelo
   * updatePublicationSchema/PATCH generico) porque envolve multipart,
   * nao JSON. Reaproveita PublicationsRepository.update() ja existente,
   * enviando somente featuredImageUrl.
   */
  async uploadFeaturedImage(id: string, file: Express.Multer.File, requester: JwtAccessPayload, ip?: string, userAgent?: string) {
    const existing = await PublicationsRepository.findByIdRaw(id);
    if (!existing) throw new NotFoundError("Publicacao nao encontrada.");
    if (!file.mimetype.startsWith("image/")) throw new ValidationError("O arquivo enviado precisa ser uma imagem.");

       const saved = await publicationImageStorageProvider.save({ buffer: file.buffer, fileName: file.originalname, mimeType: file.mimetype });
    const publicUrl = `/api/uploads/publicacoes/${saved.storagePath}`;
    
    const updated = await PublicationsRepository.update(id, { featuredImageUrl: publicUrl });

    await recordAudit({
      userId: requester.sub, action: "UPDATE", moduleKey: "publicacoes",
      entity: "Publication", entityId: id, description: "Imagem de destaque atualizada.",
      ip, userAgent,
    });

    return withEffectiveStatus(updated!);
  },
};

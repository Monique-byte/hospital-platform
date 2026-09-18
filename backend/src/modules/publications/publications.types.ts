export type PublicationCategoryValue =
  | "NOTICIA" | "COMUNICADO" | "AVISO" | "EVENTO" | "CAMPANHA" | "INFORMATIVO";

export type PublicationStatusValue =
  | "RASCUNHO" | "AGENDADA" | "PUBLICADA" | "EXPIRADA" | "ARQUIVADA";

export type PublicationTargetTypeValue =
  | "TODOS" | "UNIDADE" | "DEPARTAMENTO" | "SETOR" | "CARGO" | "GRUPO";

export interface PublicationTargetInput {
  targetType: PublicationTargetTypeValue;
  unitId?: string;
  departmentId?: string;
  sectorId?: string;
  positionId?: string;
  // GRUPO ainda nao possui entidade propria no sistema (Fase 3.1) - rotulo
  // livre ate uma fase futura de Grupos. Ver publications.service.ts.
  groupKey?: string;
}

/**
 * Criacao. NUNCA inclui authorId/publishedById/status - esses campos sao
 * sempre determinados pelo backend a partir do usuario autenticado
 * (ver publications.controller.ts / publications.service.ts).
 */
export interface CreatePublicationInput {
  title: string;
  subtitle?: string;
  content: string;
  featuredImageUrl?: string;
  category: PublicationCategoryValue;
  expiresAt?: string;
  targets: PublicationTargetInput[];
}

/**
 * Edicao. Propositalmente NAO inclui authorId, publishedById, publishedAt,
 * archivedAt nem status - essas mudancas so ocorrem atraves das acoes
 * dedicadas (publicar/agendar/arquivar), nunca via PATCH generico.
 */
export interface UpdatePublicationInput {
  title?: string;
  subtitle?: string;
  content?: string;
  featuredImageUrl?: string;
  category?: PublicationCategoryValue;
  expiresAt?: string | null; // null = remove a expiracao existente
  targets?: PublicationTargetInput[];
}

export interface SchedulePublicationInput {
  scheduledAt: string;
}

export interface PublicationListFilters {
  page: number;
  pageSize: number;
  search?: string; // busca por titulo
  category?: PublicationCategoryValue;
  status?: PublicationStatusValue;
  dateFrom?: string; // filtro de data (createdAt) - ver nota em publications.service.ts
  dateTo?: string;
  unitId?: string;
  departmentId?: string;
  sectorId?: string;
  authorId?: string;
}

/**
 * Contexto organizacional do usuario autenticado, resolvido via
 * User -> Employee -> Sector -> Department -> Unit e Employee -> Position.
 * Usado para calcular visibilidade de publico-alvo. `null` quando o
 * usuario nao possui Employee vinculado (ver regra explicita da Fase 3.2:
 * um usuario sem Employee nao pertence automaticamente a nenhuma
 * unidade/departamento/setor/cargo).
 */
export interface RequesterOrgContext {
  employeeId: string;
  positionId: string;
  sectorId: string;
  departmentId: string;
  unitId: string;
}
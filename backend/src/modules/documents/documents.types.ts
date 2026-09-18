export type DocumentCategoryValue =
  | "POLITICA" | "PROCEDIMENTO" | "MANUAL" | "REGULAMENTO"
  | "FORMULARIO" | "COMUNICADO" | "NORMA" | "ADMINISTRATIVO";

export type DocumentStatusValue = "ATIVO" | "ARQUIVADO";

export type DocumentTargetTypeValue =
  | "TODOS" | "UNIDADE" | "DEPARTAMENTO" | "SETOR" | "CARGO" | "GRUPO" | "USUARIO";

export interface DocumentTargetInput {
  targetType: DocumentTargetTypeValue;
  unitId?: string;
  departmentId?: string;
  sectorId?: string;
  positionId?: string;
  groupKey?: string;
  targetUserId?: string;
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  category: DocumentCategoryValue;
  tags?: string[];
  targets: DocumentTargetInput[];
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  category?: DocumentCategoryValue;
  tags?: string[];
  targets?: DocumentTargetInput[];
}

export interface DocumentListFilters {
  page: number;
  pageSize: number;
  search?: string;
  category?: DocumentCategoryValue;
  status?: DocumentStatusValue;
  tag?: string;
}

export interface RequesterOrgContext {
  employeeId: string;
  positionId: string;
  sectorId: string;
  departmentId: string;
  unitId: string;
}
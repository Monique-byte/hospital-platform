// Tipos espelhando os contratos do backend (Fase 1 + Fase 2 - Funcionarios
// + Fase 3.2/3.3 - Publicacoes). Mantidos manualmente em sincronia com os
// DTOs do backend; qualquer mudanca de contrato deve ser refletida aqui.

export interface AuthenticatedUser {
  sub: string;
  login: string;
  roles: string[];
  permissions: string[];
  name: string;
  email: string;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; roles: string[] };
}

// ---- Estrutura organizacional ----
export interface Unit {
  id: string;
  key: string;
  name: string;
  address?: string | null;
  isActive: boolean;
}
export interface Department {
  id: string;
  unitId: string;
  name: string;
  isActive: boolean;
  unit?: Unit;
}
export interface Sector {
  id: string;
  departmentId: string;
  name: string;
  isActive: boolean;
  department?: Department & { unit: Unit };
}
export interface Position {
  id: string;
  name: string;
  isActive: boolean;
}
export interface OrgTreeSector {
  id: string;
  name: string;
}
export interface OrgTreeDepartment {
  id: string;
  name: string;
  sectors: OrgTreeSector[];
}
export interface OrgTreeUnit {
  id: string;
  name: string;
  departments: OrgTreeDepartment[];
}

// ---- Funcionarios ----
export type EmployeeStatus = "ATIVO" | "INATIVO" | "AFASTADO";
export type EmploymentType =
  | "CLT"
  | "PJ"
  | "ESTAGIO"
  | "TERCEIRIZADO"
  | "COOPERADO";
export interface EmployeePublic {
  id: string;
  fullName: string;
  socialName: string | null;
  registrationNumber: string;
  photoUrl: string | null;
  admissionDate: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  extension: string | null;
  corporateEmail: string;
  corporatePhone: string | null;
  userId: string | null;
  position: { id: string; name: string };
  sector: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
      unit: { id: string; name: string };
    };
  };
  manager: {
    id: string;
    fullName: string;
    registrationNumber: string;
  } | null;
}
export interface EmployeeRestricted {
  cpf: string;
  birthDate: string;
  personalPhone: string | null;
  personalEmail: string | null;
}
export interface EmployeeProfileResponse {
  employee: EmployeePublic;
  restricted: EmployeeRestricted | null;
  canViewRestricted: boolean;
}
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface CreateEmployeePayload {
  fullName: string;
  socialName?: string;
  registrationNumber: string;
  photoUrl?: string;
  admissionDate: string;
  employmentType: EmploymentType;
  positionId: string;
  sectorId: string;
  managerId?: string;
  extension?: string;
  corporateEmail: string;
  corporatePhone?: string;
  userId?: string;
  restricted: {
    cpf: string;
    birthDate: string;
    personalPhone?: string;
    personalEmail?: string;
  };
}
export interface UpdateEmployeePayload {
  fullName?: string;
  socialName?: string;
  photoUrl?: string;
  extension?: string;
  corporateEmail?: string;
  corporatePhone?: string;
}
export interface UpdateOrganizationPayload {
  positionId?: string;
  sectorId?: string;
  managerId?: string | null;
}

// ---- Publicacoes / Intranet ----
export type PublicationCategory =
  | "NOTICIA" | "COMUNICADO" | "AVISO" | "EVENTO" | "CAMPANHA" | "INFORMATIVO";

export type PublicationStatus =
  | "RASCUNHO" | "AGENDADA" | "PUBLICADA" | "EXPIRADA" | "ARQUIVADA";

export type PublicationTargetType =
  | "TODOS" | "UNIDADE" | "DEPARTAMENTO" | "SETOR" | "CARGO" | "GRUPO";

export interface PublicationTarget {
  id: string;
  targetType: PublicationTargetType;
  groupKey: string | null;
  unit: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  sector: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
}

export interface PublicationTargetInput {
  targetType: PublicationTargetType;
  unitId?: string;
  departmentId?: string;
  sectorId?: string;
  positionId?: string;
  groupKey?: string;
}

export interface PublicationAttachment {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
}

/** Item de listagem - sem content nem attachments (espelha LIST_SELECT do backend). */
export interface PublicationListItem {
  id: string;
  title: string;
  subtitle: string | null;
  featuredImageUrl: string | null;
  category: PublicationCategory;
  status: PublicationStatus;
  effectiveStatus: PublicationStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: { id: string; name: string; email: string };
  publishedBy: { id: string; name: string; email: string } | null;
  targets: PublicationTarget[];
}

/** Detalhamento - inclui content e attachments (espelha DETAIL_SELECT do backend). */
export interface PublicationDetail extends PublicationListItem {
  content: string;
  attachments: PublicationAttachment[];
}

export interface CreatePublicationPayload {
  title: string;
  subtitle?: string;
  content: string;
  featuredImageUrl?: string;
  category: PublicationCategory;
  expiresAt?: string;
  targets: PublicationTargetInput[];
}

export interface UpdatePublicationPayload {
  title?: string;
  subtitle?: string;
  content?: string;
  featuredImageUrl?: string;
  category?: PublicationCategory;
  expiresAt?: string | null;
  targets?: PublicationTargetInput[];
}

export interface PublicationListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: PublicationCategory;
  status?: PublicationStatus;
  dateFrom?: string;
  dateTo?: string;
  unitId?: string;
  departmentId?: string;
  sectorId?: string;
  authorId?: string;
}
// ---- Documentos / GED ----
export type DocumentCategory =
  | "POLITICA" | "PROCEDIMENTO" | "MANUAL" | "REGULAMENTO"
  | "FORMULARIO" | "COMUNICADO" | "NORMA" | "ADMINISTRATIVO";

export type DocumentStatus = "ATIVO" | "ARQUIVADO";

export type DocumentTargetType =
  | "TODOS" | "UNIDADE" | "DEPARTAMENTO" | "SETOR" | "CARGO" | "GRUPO" | "USUARIO";

export interface DocumentTargetInput {
  targetType: DocumentTargetType;
  unitId?: string; departmentId?: string; sectorId?: string;
  positionId?: string; groupKey?: string; targetUserId?: string;
}

export interface DocumentVersionSummary {
  id: string; versionNumber: number; originalName: string;
  mimeType: string; sizeBytes: number; createdAt: string;
}

export interface DocumentListItem {
  id: string; title: string; description: string | null;
  category: DocumentCategory; status: DocumentStatus; tags: string[];
  authorId: string; author: { id: string; name: string; email: string };
  currentVersion: DocumentVersionSummary | null;
  targets: DocumentTargetSummary[];
  archivedAt: string | null; createdAt: string; updatedAt: string;
}

export interface DocumentVersionDetail extends DocumentVersionSummary {
  changeNote: string | null; authorId: string; author: { id: string; name: string };
}

export interface DocumentDetail extends DocumentListItem {
  versions: DocumentVersionDetail[];
}

export interface DocumentListFilters {
  page?: number; pageSize?: number; search?: string;
  category?: DocumentCategory; status?: DocumentStatus; tag?: string;
}
export interface DocumentTargetSummary {
  id: string;
  targetType: DocumentTargetType;
  groupKey: string | null;
  targetUserId: string | null;
  unit: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  sector: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
}

export interface UpdateDocumentPayload {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
  targets?: DocumentTargetInput[];
}
import { api } from "./api";
import {
  PaginatedResult, DocumentListItem, DocumentDetail,
  DocumentCategory, DocumentTargetInput, DocumentListFilters,
  UpdateDocumentPayload,
} from "@/types";

export interface CreateDocumentPayload {
  title: string; description?: string; category: DocumentCategory;
  tags?: string[]; targets: DocumentTargetInput[]; file: File;
}

function extractFilename(disposition: unknown, fallback: string): string {
  if (typeof disposition !== "string") return fallback;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match ? decodeURIComponent(match[1]) : fallback;
}

/**
 * Documentos e um modulo interno - todas as chamadas exigem sessao ativa.
 *
 * IMPORTANTE (bug corrigido): create/addVersion NAO devem definir
 * Content-Type manualmente ao enviar FormData - o Axios/navegador
 * precisa gerar o boundary do multipart automaticamente. Definir o
 * header como string fixa "multipart/form-data" (sem boundary) quebra
 * o parsing no multer, especialmente para arquivos binarios (imagens).
 *
 * IMPORTANTE (bug corrigido): download() busca o arquivo via Axios
 * (que injeta o Bearer token automaticamente) e retorna um Blob, em vez
 * de expor uma URL para uso direto em <a href>/<img src> - a rota de
 * download exige autenticacao, e uma navegacao/tag nativa do navegador
 * nao envia o token salvo no localStorage.
 */
export const DocumentsService = {
  async list(filters: DocumentListFilters) {
    const { data } = await api.get<PaginatedResult<DocumentListItem>>("/documentos", { params: filters });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<{ document: DocumentDetail }>(`/documentos/${id}`);
    return data.document;
  },

  async create(payload: CreateDocumentPayload) {
    const form = new FormData();
    form.append("title", payload.title);
    if (payload.description) form.append("description", payload.description);
    form.append("category", payload.category);
    if (payload.tags) form.append("tags", JSON.stringify(payload.tags));
    form.append("targets", JSON.stringify(payload.targets));
    form.append("file", payload.file);
    const { data } = await api.post<{ document: DocumentDetail }>("/documentos", form);
    return data.document;
  },

  async addVersion(id: string, file: File, changeNote?: string) {
    const form = new FormData();
    form.append("file", file);
    if (changeNote) form.append("changeNote", changeNote);
    const { data } = await api.post<{ document: DocumentDetail }>(`/documentos/${id}/versoes`, form);
    return data.document;
  },

  async update(id: string, payload: UpdateDocumentPayload) {
    const { data } = await api.patch<{ document: DocumentDetail }>(`/documentos/${id}`, payload);
    return data.document;
  },

  async archive(id: string) {
    const { data } = await api.post<{ document: DocumentDetail }>(`/documentos/${id}/arquivar`);
    return data.document;
  },

  async activate(id: string) {
    const { data } = await api.post<{ document: DocumentDetail }>(`/documentos/${id}/ativar`);
    return data.document;
  },

  async remove(id: string) {
    await api.delete(`/documentos/${id}`);
  },

  async download(documentId: string, versionId: string, fallbackName = "arquivo") {
    const response = await api.get(`/documentos/${documentId}/versoes/${versionId}/download`, { responseType: "blob" });
    const filename = extractFilename(response.headers["content-disposition"], fallbackName);
    return { blob: response.data as Blob, filename };
  },
};
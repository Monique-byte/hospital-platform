import { api } from "./api";
import {
  PaginatedResult,
  PublicationListItem,
  PublicationDetail,
  CreatePublicationPayload,
  UpdatePublicationPayload,
  PublicationListFilters,
} from "@/types";

/**
 * Service de Publicacoes/Intranet.
 *
 * IMPORTANTE: GET /publicacoes e GET /publicacoes/:id sao rotas PUBLICAS
 * no backend (authenticateOptional) - funcionam com ou sem usuario
 * logado. O interceptor de `api.ts` ja injeta o header Authorization
 * automaticamente quando ha um token salvo; quando nao ha (visitante
 * anonimo), a chamada sai sem o header e o backend trata isso sozinho,
 * retornando apenas publicacoes PUBLICADA + targetType TODOS. Este
 * service e o MESMO usado tanto pela area publica quanto pela area
 * administrativa - nao duplicar por contexto.
 *
 * As demais operacoes (create/update/delete/publicar/agendar/arquivar)
 * continuam exigindo autenticacao + permissao no backend; o frontend
 * so deve exibir os botoes correspondentes conforme PermissionGate,
 * nunca como mecanismo real de seguranca.
 */
export const PublicationsService = {
  async list(filters: PublicationListFilters) {
    const { data } = await api.get<PaginatedResult<PublicationListItem>>(
      "/publicacoes",
      { params: filters }
    );
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<{ publication: PublicationDetail }>(
      `/publicacoes/${id}`
    );
    return data.publication;
  },

  async create(payload: CreatePublicationPayload) {
    const { data } = await api.post<{ publication: PublicationDetail }>(
      "/publicacoes",
      payload
    );
    return data.publication;
  },

  async update(id: string, payload: UpdatePublicationPayload) {
    const { data } = await api.patch<{ publication: PublicationDetail }>(
      `/publicacoes/${id}`,
      payload
    );
    return data.publication;
  },

  async remove(id: string) {
    await api.delete(`/publicacoes/${id}`);
  },

  async publish(id: string) {
    const { data } = await api.post<{ publication: PublicationDetail }>(
      `/publicacoes/${id}/publicar`
    );
    return data.publication;
  },

  async schedule(id: string, scheduledAt: string) {
    const { data } = await api.post<{ publication: PublicationDetail }>(
      `/publicacoes/${id}/agendar`,
      { scheduledAt }
    );
    return data.publication;
  },

  async archive(id: string) {
    const { data } = await api.post<{ publication: PublicationDetail }>(
      `/publicacoes/${id}/arquivar`
    );
    return data.publication;
  },

    async uploadFeaturedImage(id: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{ publication: PublicationDetail }>(`/publicacoes/${id}/imagem`, form);
    return data.publication;
  },
};
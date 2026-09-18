import { Request, Response } from "express";
import { z } from "zod";
import { PublicationsService } from "./publications.service";
import { UnauthorizedError, ValidationError } from "@core/errors/AppError";

const categoryEnum = z.enum(["NOTICIA", "COMUNICADO", "AVISO", "EVENTO", "CAMPANHA", "INFORMATIVO"]);
const statusEnum = z.enum(["RASCUNHO", "AGENDADA", "PUBLICADA", "EXPIRADA", "ARQUIVADA"]);
const targetTypeEnum = z.enum(["TODOS", "UNIDADE", "DEPARTAMENTO", "SETOR", "CARGO", "GRUPO"]);

const isoDateString = z.string().min(1).refine((v: string) => !isNaN(Date.parse(v)), "Data invalida.");

const targetSchema = z.object({
  targetType: targetTypeEnum,
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  groupKey: z.string().optional(),
});

const createPublicationSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().optional(),
  content: z.string().min(1),
  featuredImageUrl: z.string().url().optional(),
  category: categoryEnum,
  expiresAt: isoDateString.optional(),
  targets: z.array(targetSchema).min(1),
});

const updatePublicationSchema = z.object({
  title: z.string().min(3).optional(),
  subtitle: z.string().optional(),
  content: z.string().min(1).optional(),
  featuredImageUrl: z.string().url().optional(),
  category: categoryEnum.optional(),
  expiresAt: isoDateString.nullable().optional(),
  targets: z.array(targetSchema).min(1).optional(),
});

const scheduleSchema = z.object({
  scheduledAt: isoDateString,
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: categoryEnum.optional(),
  status: statusEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
});

function requireUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export const PublicationsController = {
  /** GET /publicacoes - diferencia automaticamente consulta administrativa x consulta da intranet (ver service). */
  /**
   * GET /publicacoes - rota publica (Regra Fundamental de Acesso).
   * req.user pode ser undefined (visitante anonimo) ou definido (usuario
   * autenticado) - authenticateOptional preenche req.user quando ha um
   * token valido, mas nunca bloqueia a requisicao. A diferenciacao entre
   * modo administrativo, usuario comum e visitante anonimo acontece
   * inteiramente dentro do service - o controller so repassa req.user
   * como esta, sem exigir presenca dele.
   */
  async list(req: Request, res: Response) {
    const query = listQuerySchema.parse(req.query);
    const result = await PublicationsService.list(query, req.user);
    return res.status(200).json(result);
  },

  /** GET /publicacoes/:id - rota publica, mesma logica de list() acima. */
  async getById(req: Request, res: Response) {
    const publication = await PublicationsService.getById(req.params.id, req.user);
    return res.status(200).json({ publication });
  },

  /** POST /publicacoes - authorId sempre vem de req.user, nunca do body. */
  async create(req: Request, res: Response) {
    const requester = requireUser(req);
    const data = createPublicationSchema.parse(req.body);
    const publication = await PublicationsService.create(data, requester, req.ip, req.headers["user-agent"]);
    return res.status(201).json({ publication });
  },

  /** PATCH /publicacoes/:id */
  async update(req: Request, res: Response) {
    const requester = requireUser(req);
    const data = updatePublicationSchema.parse(req.body);
    const publication = await PublicationsService.update(req.params.id, data, requester, req.ip, req.headers["user-agent"]);
    return res.status(200).json({ publication });
  },

  /** DELETE /publicacoes/:id - somente RASCUNHO (ver service); demais status devem ser arquivados. */
  async remove(req: Request, res: Response) {
    const requester = requireUser(req);
    await PublicationsService.delete(req.params.id, requester, req.ip, req.headers["user-agent"]);
    return res.status(204).send();
  },

  /** POST /publicacoes/:id/publicar */
  async publish(req: Request, res: Response) {
    const requester = requireUser(req);
    const publication = await PublicationsService.publish(req.params.id, requester, req.ip, req.headers["user-agent"]);
    return res.status(200).json({ publication });
  },

  /** POST /publicacoes/:id/agendar */
  async schedule(req: Request, res: Response) {
    const requester = requireUser(req);
    const { scheduledAt } = scheduleSchema.parse(req.body);
    const publication = await PublicationsService.schedule(req.params.id, scheduledAt, requester, req.ip, req.headers["user-agent"]);
    return res.status(200).json({ publication });
  },

  /** POST /publicacoes/:id/arquivar */
  async archive(req: Request, res: Response) {
    const requester = requireUser(req);
    const publication = await PublicationsService.archive(req.params.id, requester, req.ip, req.headers["user-agent"]);
    return res.status(200).json({ publication });
  },
  
  /** POST /publicacoes/:id/imagem */
  async uploadFeaturedImage(req: Request, res: Response) {
    const requester = requireUser(req);
    if (!req.file) throw new ValidationError("Arquivo de imagem e obrigatorio.");
    const publication = await PublicationsService.uploadFeaturedImage(req.params.id, req.file, requester, req.ip, req.headers["user-agent"]);
    return res.status(200).json({ publication });
  },
};
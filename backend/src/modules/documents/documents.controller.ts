import { Request, Response } from "express";
import { z } from "zod";
import { DocumentsService } from "./documents.service";
import { DocumentsRepository } from "./documents.repository";
import { storageProvider } from "@core/storage/LocalStorageProvider";
import { UnauthorizedError, ValidationError } from "@core/errors/AppError";

const categoryEnum = z.enum(["POLITICA", "PROCEDIMENTO", "MANUAL", "REGULAMENTO", "FORMULARIO", "COMUNICADO", "NORMA", "ADMINISTRATIVO"]);
const statusEnum = z.enum(["ATIVO", "ARQUIVADO"]);
const targetTypeEnum = z.enum(["TODOS", "UNIDADE", "DEPARTAMENTO", "SETOR", "CARGO", "GRUPO", "USUARIO"]);

const targetSchema = z.object({
  targetType: targetTypeEnum,
  unitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  groupKey: z.string().optional(),
  targetUserId: z.string().uuid().optional(),
});

const jsonArrayPreprocess = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: categoryEnum,
  tags: z.preprocess(jsonArrayPreprocess, z.array(z.string()).optional()),
  targets: z.preprocess(jsonArrayPreprocess, z.array(targetSchema).min(1)),
});

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  category: categoryEnum.optional(),
  tags: z.array(z.string()).optional(),
  targets: z.array(targetSchema).min(1).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: categoryEnum.optional(),
  status: statusEnum.optional(),
  tag: z.string().optional(),
});

function requireUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export const DocumentsController = {
  async list(req: Request, res: Response) {
    const requester = requireUser(req);
    const query = listQuerySchema.parse(req.query);
    const result = await DocumentsService.list(query, requester);
    return res.status(200).json(result);
  },

  async getById(req: Request, res: Response) {
    const requester = requireUser(req);
    const document = await DocumentsService.getById(req.params.id, requester);
    return res.status(200).json({ document });
  },

  async create(req: Request, res: Response) {
    const requester = requireUser(req);
    if (!req.file) throw new ValidationError("Arquivo e obrigatorio.");
    const data = createSchema.parse(req.body);
    const document = await DocumentsService.create(data, req.file, requester, req.ip, req.headers["user-agent"]);
    return res.status(201).json({ document });
  },

  async addVersion(req: Request, res: Response) {
    const requester = requireUser(req);
    if (!req.file) throw new ValidationError("Arquivo e obrigatorio.");
    const changeNote = typeof req.body.changeNote === "string" ? req.body.changeNote : undefined;
    const document = await DocumentsService.addVersion(req.params.id, req.file, changeNote, requester, req.ip, req.headers["user-agent"]);
    return res.status(201).json({ document });
  },

  async update(req: Request, res: Response) {
    const requester = requireUser(req);
    const data = updateSchema.parse(req.body);
    const document = await DocumentsService.update(req.params.id, data, requester, req.ip, req.headers["user-agent"]);
    return res.status(200).json({ document });
  },

  async archive(req: Request, res: Response) {
    const requester = requireUser(req);
    const document = await DocumentsService.archive(req.params.id, requester, req.ip, req.headers["user-agent"]);
    return res.status(200).json({ document });
  },

  async activate(req: Request, res: Response) {
    const requester = requireUser(req);
    const document = await DocumentsService.activate(req.params.id, requester, req.ip, req.headers["user-agent"]);
    return res.status(200).json({ document });
  },

  async remove(req: Request, res: Response) {
    const requester = requireUser(req);
    await DocumentsService.delete(req.params.id, requester, req.ip, req.headers["user-agent"]);
    return res.status(204).send();
  },

  async download(req: Request, res: Response) {
    const requester = requireUser(req);
    const version = await DocumentsService.download(req.params.id, req.params.versionId, requester, req.ip, req.headers["user-agent"]);
    res.setHeader("Content-Type", version.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(version.originalName)}"`);
    storageProvider.getReadStream(version.storagePath).pipe(res);
  },
};
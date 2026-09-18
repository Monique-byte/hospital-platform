import { Request, Response } from "express";
import { z } from "zod";
import { EmployeesService } from "./employees.service";
import { UnauthorizedError } from "@core/errors/AppError";

const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

const employmentTypeEnum = z.enum(["CLT", "PJ", "ESTAGIO", "TERCEIRIZADO", "COOPERADO"]);
const statusEnum = z.enum(["ATIVO", "INATIVO", "AFASTADO"]);

const createEmployeeSchema = z.object({
  fullName: z.string().min(3),
  socialName: z.string().optional(),
  registrationNumber: z.string().min(1),
  photoUrl: z.string().url().optional(),
  admissionDate: z.string().min(1),
  employmentType: employmentTypeEnum,
  positionId: z.string().uuid(),
  sectorId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  extension: z.string().optional(),
  corporateEmail: z.string().email(),
  corporatePhone: z.string().optional(),
  userId: z.string().uuid().optional(),
  restricted: z.object({
    cpf: z.string().regex(cpfRegex, "CPF invalido."),
    birthDate: z.string().min(1),
    personalPhone: z.string().optional(),
    personalEmail: z.string().email().optional(),
  }),
});

const updateEmployeeSchema = z.object({
  fullName: z.string().min(3).optional(),
  socialName: z.string().optional(),
  photoUrl: z.string().url().optional(),
  extension: z.string().optional(),
  corporateEmail: z.string().email().optional(),
  corporatePhone: z.string().optional(),
});

const updateStatusSchema = z.object({ status: statusEnum });

const updateOrgSchema = z.object({
  positionId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  managerId: z.string().uuid().nullable().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sectorId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
});

export const EmployeesController = {
  /** GET /funcionarios - diretorio interno (busca por nome, matricula, cargo, setor, unidade, ramal) */
  async list(req: Request, res: Response) {
    const query = listQuerySchema.parse(req.query);
    const result = await EmployeesService.listDirectory(query);
    return res.status(200).json(result);
  },

  /** GET /funcionarios/:id - perfil individual (dados restritos conforme permissao/titularidade) */
  async getProfile(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError();
    const result = await EmployeesService.getProfile(req.params.id, req.user);
    return res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const data = createEmployeeSchema.parse(req.body);
    const employee = await EmployeesService.create(data, req.user?.sub, req.ip);
    return res.status(201).json({ employee });
  },

  async update(req: Request, res: Response) {
    const data = updateEmployeeSchema.parse(req.body);
    const employee = await EmployeesService.update(req.params.id, data, req.user?.sub, req.ip);
    return res.status(200).json({ employee });
  },

  async updateStatus(req: Request, res: Response) {
    const { status } = updateStatusSchema.parse(req.body);
    const employee = await EmployeesService.updateStatus(req.params.id, status, req.user?.sub, req.ip);
    return res.status(200).json({ employee });
  },

  async updateOrganization(req: Request, res: Response) {
    const data = updateOrgSchema.parse(req.body);
    const employee = await EmployeesService.updateOrganization(req.params.id, data, req.user?.sub, req.ip);
    return res.status(200).json({ employee });
  },
};
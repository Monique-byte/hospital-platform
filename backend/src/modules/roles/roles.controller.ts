import { Request, Response } from "express";
import { z } from "zod";
import { RolesService } from "./roles.service";

const createRoleSchema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
});

const setPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export const RolesController = {
  async list(_req: Request, res: Response) {
    const roles = await RolesService.list();
    return res.status(200).json({ roles });
  },

  async getById(req: Request, res: Response) {
    const role = await RolesService.getById(req.params.id);
    return res.status(200).json({ role });
  },

  async create(req: Request, res: Response) {
    const data = createRoleSchema.parse(req.body);
    const role = await RolesService.create(data, req.user?.sub, req.ip);
    return res.status(201).json({ role });
  },

  async setPermissions(req: Request, res: Response) {
    const { permissionIds } = setPermissionsSchema.parse(req.body);
    const role = await RolesService.setPermissions(req.params.id, permissionIds, req.user?.sub, req.ip);
    return res.status(200).json({ role });
  },
};

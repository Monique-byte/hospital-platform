import { Request, Response } from "express";
import { PermissionsService } from "./permissions.service";

export const PermissionsController = {
  async list(_req: Request, res: Response) {
    const permissions = await PermissionsService.list();
    return res.status(200).json({ permissions });
  },

  async listModules(_req: Request, res: Response) {
    const modules = await PermissionsService.listModules();
    return res.status(200).json({ modules });
  },

  async listActions(_req: Request, res: Response) {
    const actions = await PermissionsService.listActions();
    return res.status(200).json({ actions });
  },
};

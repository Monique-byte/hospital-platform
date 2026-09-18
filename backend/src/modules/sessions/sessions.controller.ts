import { Request, Response } from "express";
import { SessionsService } from "./sessions.service";
import { UnauthorizedError } from "@core/errors/AppError";

export const SessionsController = {
  async listMine(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError();
    const sessions = await SessionsService.listByUser(req.user.sub);
    return res.status(200).json({ sessions });
  },

  async revokeMine(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError();
    await SessionsService.revoke(req.params.id, req.user.sub);
    return res.status(204).send();
  },
};

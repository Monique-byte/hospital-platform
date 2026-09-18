import { Request, Response } from "express";
import { AuditService } from "./audit.service";

export const AuditController = {
  async list(req: Request, res: Response) {
    const {
      moduleKey,
      userId,
      page,
      pageSize,
    } = req.query;

    const result = await AuditService.list({
      moduleKey: moduleKey as string | undefined,
      userId: userId as string | undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return res.status(200).json(result);
  },
};

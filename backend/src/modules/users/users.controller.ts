import { Request, Response } from "express";
import { z } from "zod";
import { UsersService } from "./users.service";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  login: z.string().min(3),
  password: z.string().min(8),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "ATIVO",
    "INATIVO",
    "BLOQUEADO",
  ]),
});

const setRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

export const UsersController = {
  async list(req: Request, res: Response) {
    const page = req.query.page
      ? Number(req.query.page)
      : 1;

    const pageSize = req.query.pageSize
      ? Number(req.query.pageSize)
      : 20;

    const search =
      req.query.search as string | undefined;

    const result =
      await UsersService.list(
        page,
        pageSize,
        search
      );

    return res.status(200).json(result);
  },

  async getById(
    req: Request,
    res: Response
  ) {
    const user =
      await UsersService.getById(
        req.params.id
      );

    return res.status(200).json({ user });
  },

  async create(
    req: Request,
    res: Response
  ) {
    const data =
      createUserSchema.parse(req.body);

    const user =
      await UsersService.create(
        data,
        req.user?.sub,
        req.ip
      );

    return res
      .status(201)
      .json({ user });
  },

  async updateStatus(
    req: Request,
    res: Response
  ) {
    const { status } =
      updateStatusSchema.parse(
        req.body
      );

    const user =
      await UsersService.updateStatus(
        req.params.id,
        status,
        req.user?.sub,
        req.ip
      );

    return res.status(200).json({
      user,
    });
  },

  async setRoles(
    req: Request,
    res: Response
  ) {
    const { roleIds } =
      setRolesSchema.parse(req.body);

    const user =
      await UsersService.setRoles(
        req.params.id,
        roleIds,
        req.user?.sub,
        req.ip
      );

    return res.status(200).json({
      user,
    });
  },
};

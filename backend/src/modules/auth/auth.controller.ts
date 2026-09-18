import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";

const loginSchema = z.object({
  login: z.string().min(1, "Informe o login ou e-mail."),
  password: z.string().min(1, "Informe a senha."),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const AuthController = {
  async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);

    const result = await AuthService.login(
      data,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(200).json(result);
  },

  async refresh(req: Request, res: Response) {
    const { refreshToken } = refreshSchema.parse(req.body);

    const result = await AuthService.refresh(
      refreshToken,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(200).json(result);
  },

  async logout(req: Request, res: Response) {
    const { refreshToken } = refreshSchema.parse(req.body);

    await AuthService.logout(
      refreshToken,
      req.user?.sub,
      req.ip,
      req.headers["user-agent"]
    );

    return res.status(204).send();
  },

  async me(req: Request, res: Response) {
    return res.status(200).json({
      user: req.user,
    });
  },
};

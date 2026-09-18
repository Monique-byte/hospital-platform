import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "@config/index";
import { UnauthorizedError } from "@core/errors/AppError";
import { JwtAccessPayload } from "@modules/auth/auth.types";

/**
 * Middleware que valida o JWT enviado no header:
 *
 * Authorization: Bearer <token>
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token de acesso ausente.");
  }

  const token = header.substring("Bearer ".length);

  try {
    const payload = jwt.verify(
      token,
      appConfig.auth.accessTokenSecret
    ) as JwtAccessPayload;

    req.user = payload;

    next();
  } catch {
    throw new UnauthorizedError(
      "Token de acesso invalido ou expirado."
    );
  }
}

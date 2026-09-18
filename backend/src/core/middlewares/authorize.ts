import { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "@core/errors/AppError";

/**
 * Middleware de autorizacao RBAC.
 *
 * Exemplo:
 *
 * authorize("usuarios:criar")
 *
 * O usuario precisa possuir todas as permissoes informadas.
 */
export function authorize(...requiredPermissions: string[]) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    const userPermissions =
      req.user?.permissions ?? [];

    const hasAllPermissions =
      requiredPermissions.every(
        (permission) =>
          userPermissions.includes(permission)
      );

    if (!hasAllPermissions) {
      throw new ForbiddenError();
    }

    next();
  };
}

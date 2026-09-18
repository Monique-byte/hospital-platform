import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "@core/errors/AppError";
import { logger } from "@core/logger/logger";

/**
 * Middleware global de tratamento de erros.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados invalidos.",
        details: err.flatten(),
      },
    });
  }

  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
    },
    "Erro nao tratado"
  );

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor.",
    },
  });
}

import { NextFunction, Request, Response } from "express";

/**
 * Encaminha erros de handlers async para o errorHandler global.
 */
export function asyncHandler(
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<unknown>
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

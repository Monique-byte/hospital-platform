import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "@config/index";
import { JwtAccessPayload } from "@modules/auth/auth.types";

/**
 * Middleware de autenticacao opcional.
 *
 * Diferente de `authenticate`, este middleware NUNCA bloqueia a
 * requisicao por ausencia ou invalidez de token:
 *
 *  - se nao houver header Authorization (ou nao estiver no formato
 *    "Bearer <token>"), segue adiante com req.user undefined;
 *  - se houver um token, mas ele for invalido/expirado, tambem segue
 *    adiante com req.user undefined (NAO lanca UnauthorizedError) -
 *    um token quebrado nao deve impedir acesso a um recurso publico;
 *  - se o token for valido, popula req.user normalmente, exatamente
 *    como o `authenticate` padrao.
 *
 * Uso: apenas em rotas que precisam se comportar tanto para visitante
 * anonimo quanto para usuario autenticado (ex.: GET /publicacoes e
 * GET /publicacoes/:id). Rotas que exigem identificacao do usuario
 * (create/update/delete/publicar/agendar/arquivar) continuam usando
 * o middleware `authenticate` original, sem nenhuma alteracao.
 */
export function authenticateOptional(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.substring("Bearer ".length);

  try {
    const payload = jwt.verify(
      token,
      appConfig.auth.accessTokenSecret
    ) as JwtAccessPayload;
    req.user = payload;
  } catch {
    // Token presente porem invalido/expirado: tratamos como visitante
    // anonimo, nao como erro - o recurso continua acessivel.
  }

  next();
}
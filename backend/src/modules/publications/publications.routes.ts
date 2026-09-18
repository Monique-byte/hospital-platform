import { Router } from "express";
import multer from "multer";
import { PublicationsController } from "./publications.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { authenticateOptional } from "@core/middlewares/authenticateOptional";
import { authorize } from "@core/middlewares/authorize";
import { asyncHandler } from "@core/middlewares/asyncHandler";

const router = Router();
const uploadImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }); // 8MB

// GET /publicacoes e GET /publicacoes/:id sao rotas PUBLICAS (Regra
// Fundamental de Acesso): pacientes, acompanhantes, visitantes e qualquer
// pessoa externa acessam sem login e sem cadastro. authenticateOptional
// identifica o usuario quando ha um token Bearer valido (para que o
// service aplique as regras administrativas/organizacionais ja
// existentes), mas nunca bloqueia a requisicao por ausencia ou invalidez
// de token. Note que estas duas rotas NAO usam authorize("publicacoes:view")
// - a permissao "view" continua existindo e vinculada a role admin, mas
// deixou de ser o mecanismo de controle de acesso de leitura, ja que a
// leitura agora e publica por definicao. A visibilidade real (o que cada
// visitante/usuario efetivamente ve) e decidida dentro do service.
router.get("/", authenticateOptional, asyncHandler(PublicationsController.list));
router.get("/:id", authenticateOptional, asyncHandler(PublicationsController.getById));

// Demais rotas continuam privadas, com autenticacao obrigatoria + RBAC,
// exatamente como antes - nenhuma alteracao de comportamento.
router.post("/", authenticate, authorize("publicacoes:create"), asyncHandler(PublicationsController.create));
router.patch("/:id", authenticate, authorize("publicacoes:edit"), asyncHandler(PublicationsController.update));
router.delete("/:id", authenticate, authorize("publicacoes:delete"), asyncHandler(PublicationsController.remove));
router.post("/:id/publicar", authenticate, authorize("publicacoes:publish"), asyncHandler(PublicationsController.publish));
router.post("/:id/agendar", authenticate, authorize("publicacoes:schedule"), asyncHandler(PublicationsController.schedule));
router.post("/:id/arquivar", authenticate, authorize("publicacoes:archive"), asyncHandler(PublicationsController.archive));

export default router;
import { Router } from "express";
import multer from "multer";
import { DocumentsController } from "./documents.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { authorize } from "@core/middlewares/authorize";
import { asyncHandler } from "@core/middlewares/asyncHandler";

// Documentos e modulo EXCLUSIVAMENTE INTERNO - authenticate obrigatorio
// em TODAS as rotas (diferente de Publicacoes, que tem leitura publica).
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

router.use(authenticate);

router.get("/", authorize("documentos:view"), asyncHandler(DocumentsController.list));
router.get("/:id", authorize("documentos:view"), asyncHandler(DocumentsController.getById));
router.get("/:id/versoes/:versionId/download", authorize("documentos:view"), asyncHandler(DocumentsController.download));
router.post("/", authorize("documentos:create"), upload.single("file"), asyncHandler(DocumentsController.create));
router.post("/:id/versoes", authorize("documentos:edit"), upload.single("file"), asyncHandler(DocumentsController.addVersion));
router.patch("/:id", authorize("documentos:edit"), asyncHandler(DocumentsController.update));
router.post("/:id/arquivar", authorize("documentos:archive"), asyncHandler(DocumentsController.archive));
router.post("/:id/ativar", authorize("documentos:activate"), asyncHandler(DocumentsController.activate));
router.delete("/:id", authorize("documentos:delete"), asyncHandler(DocumentsController.remove));

export default router;
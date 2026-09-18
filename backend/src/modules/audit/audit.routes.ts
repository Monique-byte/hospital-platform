import { Router } from "express";
import { AuditController } from "./audit.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { authorize } from "@core/middlewares/authorize";
import { asyncHandler } from "@core/middlewares/asyncHandler";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("core:manage"),
  asyncHandler(AuditController.list)
);

export default router;

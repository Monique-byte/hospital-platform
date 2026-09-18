import { Router } from "express";
import { PermissionsController } from "./permissions.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { authorize } from "@core/middlewares/authorize";
import { asyncHandler } from "@core/middlewares/asyncHandler";

const router = Router();

router.use(authenticate, authorize("core:view"));

router.get("/", asyncHandler(PermissionsController.list));
router.get("/modules", asyncHandler(PermissionsController.listModules));
router.get("/actions", asyncHandler(PermissionsController.listActions));

export default router;

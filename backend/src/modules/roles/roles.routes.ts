import { Router } from "express";
import { RolesController } from "./roles.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { authorize } from "@core/middlewares/authorize";
import { asyncHandler } from "@core/middlewares/asyncHandler";

const router = Router();

router.use(authenticate);

router.get("/", authorize("core:view"), asyncHandler(RolesController.list));
router.get("/:id", authorize("core:view"), asyncHandler(RolesController.getById));
router.post("/", authorize("core:manage"), asyncHandler(RolesController.create));
router.put("/:id/permissions", authorize("core:manage"), asyncHandler(RolesController.setPermissions));

export default router;

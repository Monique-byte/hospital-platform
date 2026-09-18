import { Router } from "express";
import { UsersController } from "./users.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { authorize } from "@core/middlewares/authorize";
import { asyncHandler } from "@core/middlewares/asyncHandler";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("core:view"),
  asyncHandler(UsersController.list)
);

router.get(
  "/:id",
  authorize("core:view"),
  asyncHandler(UsersController.getById)
);

router.post(
  "/",
  authorize("core:create"),
  asyncHandler(UsersController.create)
);

router.patch(
  "/:id/status",
  authorize("core:edit"),
  asyncHandler(UsersController.updateStatus)
);

router.put(
  "/:id/roles",
  authorize("core:manage"),
  asyncHandler(UsersController.setRoles)
);

export default router;



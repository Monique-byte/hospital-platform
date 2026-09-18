import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { asyncHandler } from "@core/middlewares/asyncHandler";

const router = Router();

router.post(
  "/login",
  asyncHandler(AuthController.login)
);

router.post(
  "/refresh",
  asyncHandler(AuthController.refresh)
);

router.post(
  "/logout",
  asyncHandler(AuthController.logout)
);

router.get(
  "/me",
  authenticate,
  asyncHandler(AuthController.me)
);

export default router;

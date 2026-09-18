import { Router } from "express";
import { SessionsController } from "./sessions.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { asyncHandler } from "@core/middlewares/asyncHandler";

const router = Router();

router.use(authenticate);

router.get("/me", asyncHandler(SessionsController.listMine));
router.delete("/me/:id", asyncHandler(SessionsController.revokeMine));

export default router;

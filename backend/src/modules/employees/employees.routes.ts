import { Router } from "express";

import { EmployeesController } from "./Employees.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { authorize } from "@core/middlewares/authorize";

const router = Router();

router.use(authenticate);

// GET /funcionarios
router.get(
  "/",
  authorize("funcionarios:view"),
  EmployeesController.list
);

// GET /funcionarios/:id
router.get(
  "/:id",
  authorize("funcionarios:view"),
  EmployeesController.getProfile
);

// POST /funcionarios
router.post(
  "/",
  authorize("funcionarios:create"),
  EmployeesController.create
);

// PATCH /funcionarios/:id
router.patch(
  "/:id",
  authorize("funcionarios:edit"),
  EmployeesController.update
);

// PATCH /funcionarios/:id/status
router.patch(
  "/:id/status",
  authorize("funcionarios:edit"),
  EmployeesController.updateStatus
);

// PATCH /funcionarios/:id/organizacao
router.patch(
  "/:id/organizacao",
  authorize("funcionarios:edit"),
  EmployeesController.updateOrganization
);

export default router;
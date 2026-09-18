import { Router } from "express";
import { OrgStructureController } from "./org-structure.controller";
import { authenticate } from "@core/middlewares/authenticate";
import { authorize } from "@core/middlewares/authorize";
import { asyncHandler } from "@core/middlewares/asyncHandler";

const router = Router();

router.use(authenticate);

router.get(
  "/arvore",
  authorize("funcionarios:view"),
  asyncHandler(OrgStructureController.tree)
);

router.get(
  "/unidades",
  authorize("funcionarios:view"),
  asyncHandler(OrgStructureController.listUnits)
);

router.post(
  "/unidades",
  authorize("funcionarios:manage"),
  asyncHandler(OrgStructureController.createUnit)
);

router.get(
  "/departamentos",
  authorize("funcionarios:view"),
  asyncHandler(OrgStructureController.listDepartments)
);

router.post(
  "/departamentos",
  authorize("funcionarios:manage"),
  asyncHandler(OrgStructureController.createDepartment)
);

router.get(
  "/setores",
  authorize("funcionarios:view"),
  asyncHandler(OrgStructureController.listSectors)
);

router.post(
  "/setores",
  authorize("funcionarios:manage"),
  asyncHandler(OrgStructureController.createSector)
);

router.get(
  "/cargos",
  authorize("funcionarios:view"),
  asyncHandler(OrgStructureController.listPositions)
);

router.post(
  "/cargos",
  authorize("funcionarios:manage"),
  asyncHandler(OrgStructureController.createPosition)
);

export default router;

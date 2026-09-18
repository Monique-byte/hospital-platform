import { Request, Response } from "express";
import { z } from "zod";
import { OrgStructureService } from "./org-structure.service";

const createUnitSchema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  address: z.string().optional()
});

const createDepartmentSchema = z.object({
  unitId: z.string().uuid(),
  name: z.string().min(2)
});

const createSectorSchema = z.object({
  departmentId: z.string().uuid(),
  name: z.string().min(2)
});

const createPositionSchema = z.object({
  name: z.string().min(2)
});

export const OrgStructureController = {
  async tree(_req: Request, res: Response) {
    const tree = await OrgStructureService.getOrgTree();
    return res.status(200).json({ tree });
  },

  async listUnits(_req: Request, res: Response) {
    const units = await OrgStructureService.listUnits();
    return res.status(200).json({ units });
  },

  async createUnit(req: Request, res: Response) {
    const data = createUnitSchema.parse(req.body);
    const unit = await OrgStructureService.createUnit(data, req.user?.sub, req.ip);
    return res.status(201).json({ unit });
  },

  async listDepartments(req: Request, res: Response) {
    const departments = await OrgStructureService.listDepartments(
      req.query.unitId as string | undefined
    );
    return res.status(200).json({ departments });
  },

  async createDepartment(req: Request, res: Response) {
    const data = createDepartmentSchema.parse(req.body);
    const department = await OrgStructureService.createDepartment(
      data,
      req.user?.sub,
      req.ip
    );
    return res.status(201).json({ department });
  },

  async listSectors(req: Request, res: Response) {
    const sectors = await OrgStructureService.listSectors(
      req.query.departmentId as string | undefined
    );
    return res.status(200).json({ sectors });
  },

  async createSector(req: Request, res: Response) {
    const data = createSectorSchema.parse(req.body);
    const sector = await OrgStructureService.createSector(
      data,
      req.user?.sub,
      req.ip
    );
    return res.status(201).json({ sector });
  },

  async listPositions(_req: Request, res: Response) {
    const positions = await OrgStructureService.listPositions();
    return res.status(200).json({ positions });
  },

  async createPosition(req: Request, res: Response) {
    const data = createPositionSchema.parse(req.body);
    const position = await OrgStructureService.createPosition(
      data,
      req.user?.sub,
      req.ip
    );
    return res.status(201).json({ position });
  },
};

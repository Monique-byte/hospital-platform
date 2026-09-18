import { api } from "./api";
import {
  OrgTreeUnit,
  Position,
  Sector,
  Unit,
  Department,
} from "@/types";

export const OrgStructureService = {
  async getTree() {
    const { data } = await api.get<{ tree: OrgTreeUnit[] }>(
      "/estrutura-organizacional/arvore"
    );
    return data.tree;
  },

  async listUnits() {
    const { data } = await api.get<{ units: Unit[] }>(
      "/estrutura-organizacional/unidades"
    );
    return data.units;
  },

  async listDepartments(unitId?: string) {
    const { data } = await api.get<{ departments: Department[] }>(
      "/estrutura-organizacional/departamentos",
      { params: unitId ? { unitId } : {} }
    );
    return data.departments;
  },

  async listSectors(departmentId?: string) {
    const { data } = await api.get<{ sectors: Sector[] }>(
      "/estrutura-organizacional/setores",
      { params: departmentId ? { departmentId } : {} }
    );
    return data.sectors;
  },

  async listPositions() {
    const { data } = await api.get<{ positions: Position[] }>(
      "/estrutura-organizacional/cargos"
    );
    return data.positions;
  },
};

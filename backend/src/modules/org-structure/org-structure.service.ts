import { prisma } from "@core/database/prisma";
import { ConflictError, NotFoundError } from "@core/errors/AppError";
import { recordAudit } from "@modules/audit/audit.service";

/**
 * Catalogos de apoio ao modulo Funcionarios: Unidades, Departamentos,
 * Setores (hierarquia Unit -> Department -> Sector) e Cargos.
 *
 * Reaproveita o mesmo padrao de permissao do modulo "funcionarios"
 * (funcionarios:view / create / edit / delete / manage), pois estes
 * catalogos sao parte do dominio de Funcionarios, nao um modulo novo.
 */
export const OrgStructureService = {
  // ---- Unidades ----
  listUnits() {
    return prisma.unit.findMany({ orderBy: { name: "asc" }, include: { departments: false } });
  },

  async createUnit(input: { key: string; name: string; address?: string }, actorUserId?: string, ip?: string) {
    const existing = await prisma.unit.findUnique({ where: { key: input.key } });
    if (existing) throw new ConflictError("Ja existe uma unidade com esta chave.");
    const unit = await prisma.unit.create({ data: input });
    await recordAudit({ userId: actorUserId, action: "CREATE", moduleKey: "funcionarios", entity: "Unit", entityId: unit.id, description: `Unidade ${unit.name} criada.`, ip });
    return unit;
  },

  // ---- Departamentos ----
  listDepartments(unitId?: string) {
    return prisma.department.findMany({
      where: unitId ? { unitId } : undefined,
      orderBy: { name: "asc" },
      include: { unit: true },
    });
  },

  async createDepartment(input: { unitId: string; name: string }, actorUserId?: string, ip?: string) {
    const unit = await prisma.unit.findUnique({ where: { id: input.unitId } });
    if (!unit) throw new NotFoundError("Unidade nao encontrada.");
    const department = await prisma.department.create({ data: input });
    await recordAudit({ userId: actorUserId, action: "CREATE", moduleKey: "funcionarios", entity: "Department", entityId: department.id, description: `Departamento ${department.name} criado em ${unit.name}.`, ip });
    return department;
  },

  // ---- Setores ----
  listSectors(departmentId?: string) {
    return prisma.sector.findMany({
      where: departmentId ? { departmentId } : undefined,
      orderBy: { name: "asc" },
      include: { department: { include: { unit: true } } },
    });
  },

  async createSector(input: { departmentId: string; name: string }, actorUserId?: string, ip?: string) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department) throw new NotFoundError("Departamento nao encontrado.");
    const sector = await prisma.sector.create({ data: input });
    await recordAudit({ userId: actorUserId, action: "CREATE", moduleKey: "funcionarios", entity: "Sector", entityId: sector.id, description: `Setor ${sector.name} criado.`, ip });
    return sector;
  },

  // ---- Cargos ----
  listPositions() {
    return prisma.position.findMany({ orderBy: { name: "asc" } });
  },

  async createPosition(input: { name: string }, actorUserId?: string, ip?: string) {
    const existing = await prisma.position.findUnique({ where: { name: input.name } });
    if (existing) throw new ConflictError("Ja existe um cargo com este nome.");
    const position = await prisma.position.create({ data: input });
    await recordAudit({ userId: actorUserId, action: "CREATE", moduleKey: "funcionarios", entity: "Position", entityId: position.id, description: `Cargo ${position.name} criado.`, ip });
    return position;
  },

  /** Arvore completa (Unidade > Departamento > Setor) usada nos formularios de cadastro/edicao. */
  async getOrgTree() {
    return prisma.unit.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        departments: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: { sectors: { where: { isActive: true }, orderBy: { name: "asc" } } },
        },
      },
    });
  },
};

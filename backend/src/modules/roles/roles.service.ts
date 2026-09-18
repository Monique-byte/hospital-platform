import { prisma } from "@core/database/prisma";
import { ConflictError, NotFoundError, AppError } from "@core/errors/AppError";
import { recordAudit } from "@modules/audit/audit.service";

export const RolesService = {
  list() {
    return prisma.role.findMany({
      orderBy: { name: "asc" },
      include: { permissions: { include: { permission: { include: { module: true, action: true } } } } },
    });
  },

  async getById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: { include: { module: true, action: true } } } } },
    });
    if (!role) throw new NotFoundError("Perfil (role) nao encontrado.");
    return role;
  },

  async create(input: { key: string; name: string; description?: string }, actorUserId?: string, ip?: string) {
    const existing = await prisma.role.findUnique({ where: { key: input.key } });
    if (existing) throw new ConflictError("Ja existe um perfil com esta chave.");

    const role = await prisma.role.create({ data: input });

    await recordAudit({
      userId: actorUserId, action: "CREATE", moduleKey: "core",
      entity: "Role", entityId: role.id, description: `Perfil ${role.name} criado.`, ip,
    });

    return role;
  },

  async setPermissions(roleId: string, permissionIds: string[], actorUserId?: string, ip?: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundError("Perfil (role) nao encontrado.");
    if (role.isSystem) {
      throw new AppError("Perfis de sistema tem suas permissoes geridas pela plataforma.", 400, "SYSTEM_ROLE_LOCKED");
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId, permissionId })) }),
    ]);

    await recordAudit({
      userId: actorUserId, action: "UPDATE", moduleKey: "core",
      entity: "Role", entityId: roleId, description: "Permissoes do perfil atualizadas.",
      metadata: { permissionIds }, ip,
    });

    return RolesService.getById(roleId);
  },
};

import bcrypt from "bcryptjs";
import { UsersRepository } from "./users.repository";
import {
  ConflictError,
  NotFoundError,
} from "@core/errors/AppError";
import { recordAudit } from "@modules/audit/audit.service";

export const UsersService = {
  async list(
    page = 1,
    pageSize = 20,
    search?: string
  ) {
    const [items, total] =
      await UsersRepository.findMany({
        page,
        pageSize,
        search,
      });

    return {
      items,
      total,
      page,
      pageSize,
    };
  },

  async getById(id: string) {
    const user =
      await UsersRepository.findById(id);

    if (!user) {
      throw new NotFoundError(
        "Usuario nao encontrado."
      );
    }

    return user;
  },

  async create(
    input: {
      name: string;
      email: string;
      login: string;
      password: string;
    },
    actorUserId?: string,
    ip?: string
  ) {
    const existing =
      await UsersRepository.findByEmailOrLogin(
        input.email
      );

    if (existing) {
      throw new ConflictError(
        "Ja existe um usuario com este e-mail ou login."
      );
    }

    const passwordHash =
      await bcrypt.hash(input.password, 10);

    const user =
      await UsersRepository.create({
        name: input.name,
        email: input.email,
        login: input.login,
        passwordHash,
      });

    await recordAudit({
      userId: actorUserId,
      action: "CREATE",
      moduleKey: "core",
      entity: "User",
      entityId: user.id,
      description:
        `Usuario ${user.email} criado.`,
      ip,
    });

    return user;
  },

  async updateStatus(
    id: string,
    status:
      | "ATIVO"
      | "INATIVO"
      | "BLOQUEADO",
    actorUserId?: string,
    ip?: string
  ) {
    const user =
      await UsersRepository.findById(id);

    if (!user) {
      throw new NotFoundError(
        "Usuario nao encontrado."
      );
    }

    const updated =
      await UsersRepository.update(id, {
        status,
      });

    await recordAudit({
      userId: actorUserId,
      action: "UPDATE",
      moduleKey: "core",
      entity: "User",
      entityId: id,
      description:
        `Status do usuario alterado para ${status}.`,
      ip,
    });

    return updated;
  },

  async setRoles(
    id: string,
    roleIds: string[],
    actorUserId?: string,
    ip?: string
  ) {
    const user =
      await UsersRepository.findById(id);

    if (!user) {
      throw new NotFoundError(
        "Usuario nao encontrado."
      );
    }

    await UsersRepository.setRoles(
      id,
      roleIds
    );

    await recordAudit({
      userId: actorUserId,
      action: "UPDATE",
      moduleKey: "core",
      entity: "User",
      entityId: id,
      description:
        "Roles do usuario atualizadas.",
      metadata: { roleIds },
      ip,
    });

    return UsersRepository.findById(id);
  },
};



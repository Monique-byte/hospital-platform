import bcrypt from "bcryptjs";
import { prisma } from "@core/database/prisma";
import { UnauthorizedError } from "@core/errors/AppError";
import {
  AuthCredentials,
  AuthenticatedIdentity,
  IAuthStrategy,
} from "./IAuthStrategy";

export class LocalAuthStrategy implements IAuthStrategy {
  readonly providerKey = "local" as const;

  async authenticate({
    login,
    password,
  }: AuthCredentials): Promise<AuthenticatedIdentity> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ login }, { email: login }],
        authProvider: "LOCAL",
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Usuario ou senha invalidos.");
    }

    if (user.status !== "ATIVO") {
      throw new UnauthorizedError(
        "Usuario inativo ou bloqueado. Contate o administrador."
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new UnauthorizedError("Usuario ou senha invalidos.");
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  }
}

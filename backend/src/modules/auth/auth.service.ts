import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@core/database/prisma";
import { appConfig } from "@config/index";
import { UnauthorizedError } from "@core/errors/AppError";
import { LocalAuthStrategy } from "./strategies/local.strategy";
import { IAuthStrategy } from "./strategies/IAuthStrategy";
import { LoginInput, LoginResult, JwtAccessPayload } from "./auth.types";
import { recordAudit } from "@modules/audit/audit.service";

/**
 * Factory de estrategia de autenticacao.
 *
 * A troca do provedor de login (local -> LDAP -> SSO) acontece em UM
 * unico ponto do sistema. Para habilitar uma nova fase de autenticacao,
 * basta implementar a estrategia (ver strategies/IAuthStrategy.ts) e
 * adicionar aqui - nenhum outro modulo precisa ser alterado.
 */
function resolveAuthStrategy(): IAuthStrategy {
  switch (appConfig.auth.provider) {
    case "local":
      return new LocalAuthStrategy();
    case "ldap":
      // Fase futura: substituir por `new LdapAuthStrategy()`
      throw new Error("Provedor LDAP configurado, porem ainda nao implementado nesta fase.");
    case "oidc":
      // Fase futura: substituir por `new OidcSsoStrategy()`
      throw new Error("Provedor SSO/OIDC configurado, porem ainda nao implementado nesta fase.");
    default:
      throw new Error(`Provedor de autenticacao desconhecido: ${appConfig.auth.provider}`);
  }
}

async function loadRolesAndPermissions(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: { include: { module: true, action: true } } },
          },
        },
      },
    },
  });

  const roles = userRoles.map((ur: { role: { key: string } }) => ur.role.key);

  const permissions = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissions.add(`${rp.permission.module.key}:${rp.permission.action.key}`);
    }
  }

  return { roles, permissions: Array.from(permissions) };
}

function signAccessToken(payload: JwtAccessPayload) {
  return jwt.sign(
    payload,
    appConfig.auth.accessTokenSecret as jwt.Secret,
    {
      expiresIn: appConfig.auth.accessTokenExpiresIn as jwt.SignOptions["expiresIn"],
    }
  );
}

async function issueRefreshToken(userId: string, ip?: string, userAgent?: string) {
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // alinhar com JWT_REFRESH_EXPIRES_IN

  await prisma.session.create({
    data: { userId, refreshToken, ip, userAgent, expiresAt },
  });

  return refreshToken;
}

export const AuthService = {
  /**
   * Login. Independente do AUTH_PROVIDER configurado, o fluxo e o mesmo:
   * 1) validar credenciais via estrategia ativa
   * 2) (reservado) checar MFA se habilitado para o usuario
   * 3) carregar roles/permissoes (RBAC)
   * 4) emitir access token (JWT) e refresh token (sessao em banco)
   * 5) registrar auditoria de login
   */
  async login(input: LoginInput, ip?: string, userAgent?: string): Promise<LoginResult> {
    const strategy = resolveAuthStrategy();
    const identity = await strategy.authenticate(input);

    // Ponto de extensao para MFA (Fase futura): se appConfig.auth.mfaEnabled
    // e o usuario tiver mfaEnabled=true, aqui deve ser exigido um segundo
    // fator antes de emitir os tokens (ex.: TOTP), retornando um estado
    // intermediario "mfa_required" em vez do LoginResult final.

    const { roles, permissions } = await loadRolesAndPermissions(identity.userId);

    const accessToken = signAccessToken({
      sub: identity.userId,
      login: input.login,
      roles,
      permissions,
    });

    const refreshToken = await issueRefreshToken(identity.userId, ip, userAgent);

    await prisma.user.update({
      where: { id: identity.userId },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await recordAudit({
      userId: identity.userId,
      action: "LOGIN",
      moduleKey: "core",
      entity: "User",
      entityId: identity.userId,
      description: "Login realizado com sucesso.",
      ip,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: identity.userId, name: identity.name, email: identity.email, roles },
    };
  },

  /** Gera um novo access token a partir de um refresh token valido. */
  async refresh(refreshToken: string, ip?: string, userAgent?: string) {
    const session = await prisma.session.findUnique({ where: { refreshToken } });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedError("Sessao invalida ou expirada. Faca login novamente.");
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status !== "ATIVO") {
      throw new UnauthorizedError("Usuario invalido ou inativo.");
    }

    const { roles, permissions } = await loadRolesAndPermissions(user.id);

    const accessToken = signAccessToken({ sub: user.id, login: user.login, roles, permissions });

    return { accessToken };
  },

  /** Logout: revoga a sessao (refresh token) atual. */
  async logout(refreshToken: string, userId?: string, ip?: string, userAgent?: string) {
    await prisma.session.updateMany({
      where: { refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (userId) {
      await recordAudit({
        userId,
        action: "LOGOUT",
        moduleKey: "core",
        entity: "User",
        entityId: userId,
        description: "Logout realizado.",
        ip,
        userAgent,
      });
    }
  },
};
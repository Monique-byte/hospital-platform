import { prisma } from "@core/database/prisma";

export const UsersRepository = {
  findMany(params: {
    page: number;
    pageSize: number;
    search?: string;
  }) {
    const { page, pageSize, search } = params;

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              login: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    return Promise.all([
      prisma.user.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          login: true,
          status: true,
          authProvider: true,
          lastLoginAt: true,
          createdAt: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),

      prisma.user.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        login: true,
        status: true,
        authProvider: true,
        mfaEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  },

  findByEmailOrLogin(emailOrLogin: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrLogin },
          { login: emailOrLogin },
        ],
      },
    });
  },

  create(data: {
    name: string;
    email: string;
    login: string;
    passwordHash: string;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        status: "ATIVO",
        authProvider: "LOCAL",
      },
    });
  },

  update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      status:
        | "ATIVO"
        | "INATIVO"
        | "BLOQUEADO"
        | "PENDENTE";
    }>
  ) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  setRoles(userId: string, roleIds: string[]) {
    return prisma.$transaction([
      prisma.userRole.deleteMany({
        where: { userId },
      }),

      prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      }),
    ]);
  },
};

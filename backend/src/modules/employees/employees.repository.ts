import { prisma } from "@core/database/prisma";

/**
 * Selecao padrao de campos PUBLICOS (diretorio interno). Nunca inclui
 * `restrictedData` aqui - dados restritos so sao buscados explicitamente
 * pelo service, apos a checagem de permissao/titularidade.
 */
export const PUBLIC_SELECT = {
  id: true,
  fullName: true,
  socialName: true,
  registrationNumber: true,
  photoUrl: true,
  admissionDate: true,
  status: true,
  employmentType: true,
  extension: true,
  corporateEmail: true,
  corporatePhone: true,
  userId: true,
  position: { select: { id: true, name: true } },
  sector: {
    select: {
      id: true, name: true,
      department: { select: { id: true, name: true, unit: { select: { id: true, name: true } } } },
    },
  },
  manager: { select: { id: true, fullName: true, registrationNumber: true } },
} as const;

export const EmployeesRepository = {
  findMany(params: {
    page: number; pageSize: number; search?: string;
    sectorId?: string; unitId?: string; positionId?: string; status?: string;
  }) {
    const { page, pageSize, search, sectorId, unitId, positionId, status } = params;

    const where: any = {
      ...(status ? { status } : { status: { not: "INATIVO" } }), // por padrao, diretorio nao mostra inativos
      ...(sectorId ? { sectorId } : {}),
      ...(positionId ? { positionId } : {}),
      ...(unitId ? { sector: { department: { unitId } } } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { socialName: { contains: search, mode: "insensitive" } },
              { registrationNumber: { contains: search, mode: "insensitive" } },
              { extension: { contains: search, mode: "insensitive" } },
              { corporateEmail: { contains: search, mode: "insensitive" } },
              { position: { name: { contains: search, mode: "insensitive" } } },
              { sector: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    return Promise.all([
      prisma.employee.findMany({
        where, select: PUBLIC_SELECT, orderBy: { fullName: "asc" },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.employee.count({ where }),
    ]);
  },

  findByIdPublic(id: string) {
    return prisma.employee.findUnique({ where: { id }, select: PUBLIC_SELECT });
  },

  findByIdFull(id: string) {
    return prisma.employee.findUnique({ where: { id }, include: { restrictedData: true } });
  },

  findByUserId(userId: string) {
    return prisma.employee.findUnique({ where: { userId } });
  },

  findByRegistrationOrEmailOrCpf(registrationNumber: string, corporateEmail: string, cpf: string) {
    return prisma.$transaction([
      prisma.employee.findFirst({ where: { OR: [{ registrationNumber }, { corporateEmail }] } }),
      prisma.employeeRestrictedData.findUnique({ where: { cpf } }),
    ]);
  },

  create(data: {
    fullName: string; socialName?: string; registrationNumber: string; photoUrl?: string;
    admissionDate: Date; employmentType: any; positionId: string; sectorId: string;
    managerId?: string; extension?: string; corporateEmail: string; corporatePhone?: string; userId?: string;
    restricted: { cpf: string; birthDate: Date; personalPhone?: string; personalEmail?: string };
  }) {
    const { restricted, ...employeeData } = data;
    return prisma.employee.create({
      data: { ...employeeData, restrictedData: { create: restricted } },
      select: PUBLIC_SELECT,
    });
  },

  update(id: string, data: Partial<{ fullName: string; socialName: string; photoUrl: string; extension: string; corporateEmail: string; corporatePhone: string }>) {
    return prisma.employee.update({ where: { id }, data, select: PUBLIC_SELECT });
  },

  updateStatus(id: string, status: "ATIVO" | "INATIVO" | "AFASTADO") {
    return prisma.employee.update({ where: { id }, data: { status }, select: PUBLIC_SELECT });
  },

  updateOrganization(id: string, data: { positionId?: string; sectorId?: string; managerId?: string | null }) {
    return prisma.employee.update({ where: { id }, data, select: PUBLIC_SELECT });
  },
};
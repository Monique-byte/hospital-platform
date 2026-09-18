import { prisma } from "@core/database/prisma";
import { EmployeesRepository } from "./employees.repository";
import { ConflictError, NotFoundError } from "@core/errors/AppError";
import { recordAudit } from "@modules/audit/audit.service";
import { CreateEmployeeInput, UpdateEmployeeInput, UpdateOrganizationInput } from "./employees.types";
import { JwtAccessPayload } from "@modules/auth/auth.types";

function canSeeRestricted(requester: JwtAccessPayload, employee: { userId: string | null }) {
  const isSelf = !!employee.userId && employee.userId === requester.sub;
  const isManager = requester.permissions.includes("funcionarios:manage");
  return isSelf || isManager;
}

export const EmployeesService = {
  /** Diretorio interno - somente campos publicos, nunca dados restritos. */
  async listDirectory(params: {
    page: number; pageSize: number; search?: string;
    sectorId?: string; unitId?: string; positionId?: string;
  }) {
    const [items, total] = await EmployeesRepository.findMany(params);
    return { items, total, page: params.page, pageSize: params.pageSize };
  },

  /**
   * Perfil individual. Retorna sempre os dados publicos; os dados
   * restritos (CPF, nascimento, contatos pessoais) so sao incluidos
   * quando o solicitante e o proprio funcionario (via User vinculado)
   * ou possui a permissao "funcionarios:manage".
   */
  async getProfile(id: string, requester: JwtAccessPayload) {
    const employee = await EmployeesRepository.findByIdPublic(id);
    if (!employee) throw new NotFoundError("Funcionario nao encontrado.");

    const canViewRestricted = canSeeRestricted(requester, employee);
    let restricted = null;

    if (canViewRestricted) {
      const full = await EmployeesRepository.findByIdFull(id);
      restricted = full?.restrictedData
        ? {
            cpf: full.restrictedData.cpf,
            birthDate: full.restrictedData.birthDate,
            personalPhone: full.restrictedData.personalPhone,
            personalEmail: full.restrictedData.personalEmail,
          }
        : null;
    }

    return { employee, restricted, canViewRestricted };
  },

  async create(input: CreateEmployeeInput, actorUserId?: string, ip?: string) {
    const [existingEmployee, existingCpf] = await EmployeesRepository.findByRegistrationOrEmailOrCpf(
      input.registrationNumber, input.corporateEmail, input.restricted.cpf
    );
    if (existingEmployee) throw new ConflictError("Ja existe um funcionario com esta matricula ou e-mail corporativo.");
    if (existingCpf) throw new ConflictError("Ja existe um funcionario cadastrado com este CPF.");

    if (input.userId) {
      const linked = await EmployeesRepository.findByUserId(input.userId);
      if (linked) throw new ConflictError("Este usuario ja possui um cadastro de funcionario vinculado.");
    }

    const employee = await EmployeesRepository.create({
      fullName: input.fullName,
      socialName: input.socialName,
      registrationNumber: input.registrationNumber,
      photoUrl: input.photoUrl,
      admissionDate: new Date(input.admissionDate),
      employmentType: input.employmentType,
      positionId: input.positionId,
      sectorId: input.sectorId,
      managerId: input.managerId,
      extension: input.extension,
      corporateEmail: input.corporateEmail,
      corporatePhone: input.corporatePhone,
      userId: input.userId,
      restricted: {
        cpf: input.restricted.cpf,
        birthDate: new Date(input.restricted.birthDate),
        personalPhone: input.restricted.personalPhone,
        personalEmail: input.restricted.personalEmail,
      },
    });

    await recordAudit({
      userId: actorUserId, action: "CREATE", moduleKey: "funcionarios",
      entity: "Employee", entityId: employee.id,
      description: `Funcionario ${employee.fullName} (matricula ${employee.registrationNumber}) cadastrado.`,
      ip,
    });

    return employee;
  },

  async update(id: string, input: UpdateEmployeeInput, actorUserId?: string, ip?: string) {
    const existing = await EmployeesRepository.findByIdPublic(id);
    if (!existing) throw new NotFoundError("Funcionario nao encontrado.");

    const updated = await EmployeesRepository.update(id, input);

    await recordAudit({
      userId: actorUserId, action: "UPDATE", moduleKey: "funcionarios",
      entity: "Employee", entityId: id, description: "Dados cadastrais do funcionario atualizados.",
      metadata: input as Record<string, unknown>, ip,
    });

    return updated;
  },

  /** Inativacao / reativacao. NUNCA exclui fisicamente o registro (preserva historico). */
  async updateStatus(id: string, status: "ATIVO" | "INATIVO" | "AFASTADO", actorUserId?: string, ip?: string) {
    const existing = await EmployeesRepository.findByIdPublic(id);
    if (!existing) throw new NotFoundError("Funcionario nao encontrado.");

    const updated = await EmployeesRepository.updateStatus(id, status);

    await recordAudit({
      userId: actorUserId, action: "UPDATE", moduleKey: "funcionarios",
      entity: "Employee", entityId: id, description: `Status do funcionario alterado para ${status}.`,
      metadata: { previousStatus: existing.status, newStatus: status }, ip,
    });

    return updated;
  },

  /** Altera cargo, setor (e, por consequencia, departamento/unidade) e/ou gestor. */
  async updateOrganization(id: string, input: UpdateOrganizationInput, actorUserId?: string, ip?: string) {
    const existing = await EmployeesRepository.findByIdPublic(id);
    if (!existing) throw new NotFoundError("Funcionario nao encontrado.");

    if (input.managerId === id) {
      throw new ConflictError("Um funcionario nao pode ser gestor de si mesmo.");
    }

    if (input.sectorId) {
      const sector = await prisma.sector.findUnique({ where: { id: input.sectorId } });
      if (!sector) throw new NotFoundError("Setor nao encontrado.");
    }
    if (input.positionId) {
      const position = await prisma.position.findUnique({ where: { id: input.positionId } });
      if (!position) throw new NotFoundError("Cargo nao encontrado.");
    }

    const updated = await EmployeesRepository.updateOrganization(id, input);

    await recordAudit({
      userId: actorUserId, action: "UPDATE", moduleKey: "funcionarios",
      entity: "Employee", entityId: id, description: "Cargo, setor e/ou gestor do funcionario alterados.",
      metadata: {
        antes: { positionId: existing.position.id, sectorId: existing.sector.id, managerId: existing.manager?.id ?? null },
        depois: input,
      },
      ip,
    });

    return updated;
  },
};
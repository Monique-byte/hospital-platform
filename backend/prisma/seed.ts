/**
 * Seed inicial da Fase 1.
 * Cria:
 *  - Modulo "core" (fundacao) e demais modulos apenas como REGISTRO
 *    (sem funcionalidade ainda) para validar a extensibilidade do catalogo.
 *  - Acoes padrao do RBAC.
 *  - Permissoes do modulo core.
 *  - Role "admin" (system role) com todas as permissoes do core.
 *  - Usuario administrador inicial (autenticacao local).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ACTIONS = [
  { key: "view", name: "Visualizar" },
  { key: "create", name: "Criar" },
  { key: "edit", name: "Editar" },
  { key: "delete", name: "Excluir" },
  { key: "approve", name: "Aprovar" },
  { key: "manage", name: "Administrar" },
  // Acoes especificas do modulo Publicacoes/Intranet (Fase 3.2). O catalogo
  // de Actions e uma tabela de dados (nao um enum), entao registrar novas
  // acoes aqui NAO exige migration - e exatamente a extensibilidade descrita
  // no comentario do model Action em schema.prisma.
  { key: "publish", name: "Publicar" },
  { key: "schedule", name: "Agendar" },
  { key: "archive", name: "Arquivar" },
  { key: "activate", name: "Ativar" },
];

// Catalogo de modulos: "core" ja funcional na Fase 1, os demais entram
// apenas como registro (isActive=false) para as fases seguintes.
const MODULES = [
  { key: "core", name: "Fundacao / Administracao do Sistema", isActive: true },
  { key: "funcionarios", name: "Funcionarios", isActive: true },
  { key: "folha", name: "Folha de Pagamento", isActive: false },
  { key: "publicacoes", name: "Publicacoes", isActive: true },
  { key: "documentos", name: "Documentos", isActive: true },
  { key: "notificacoes", name: "Notificacoes", isActive: false },
  { key: "administracao", name: "Administracao", isActive: false },
  { key: "rh", name: "Recursos Humanos", isActive: false },
  { key: "ti", name: "Tecnologia da Informacao", isActive: false },
];

async function main() {
  console.log("Seed Fase 1 - iniciando...");

  for (const action of ACTIONS) {
    await prisma.action.upsert({
      where: { key: action.key },
      update: {},
      create: action,
    });
  }

  for (const mod of MODULES) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: {},
      create: mod,
    });
  }

  const coreModule = await prisma.module.findUniqueOrThrow({ where: { key: "core" } });
  const actions = await prisma.action.findMany();

  const corePermissions = [];
  for (const action of actions) {
    const permission = await prisma.permission.upsert({
      where: { moduleId_actionId: { moduleId: coreModule.id, actionId: action.id } },
      update: {},
      create: { moduleId: coreModule.id, actionId: action.id },
    });
    corePermissions.push(permission);
  }

  // permissoes do modulo "funcionarios" (mesmas 6 acoes padrao)
  const employeesModule = await prisma.module.findUniqueOrThrow({ where: { key: "funcionarios" } });
  const employeesPermissions = [];
  for (const action of actions) {
    const permission = await prisma.permission.upsert({
      where: { moduleId_actionId: { moduleId: employeesModule.id, actionId: action.id } },
      update: {},
      create: { moduleId: employeesModule.id, actionId: action.id },
    });
    employeesPermissions.push(permission);
  }

  // permissoes do modulo "publicacoes" (Fase 3.2 - em desenvolvimento).
  // Diferente de core/funcionarios, aqui NAO usamos todas as acoes do
  // catalogo: somente view/create/edit/delete/publish/schedule/archive.
  // "approve" e "manage" ficam de fora por enquanto (nao ha uso definido
  // para elas neste modulo ainda).
  const publicationsModule = await prisma.module.findUniqueOrThrow({ where: { key: "publicacoes" } });
  const publicationsActionKeys = ["view", "create", "edit", "delete", "publish", "schedule", "archive"];
  const publicationsPermissions = [];
  for (const action of actions) {
    if (!publicationsActionKeys.includes(action.key)) continue;
    const permission = await prisma.permission.upsert({
      where: { moduleId_actionId: { moduleId: publicationsModule.id, actionId: action.id } },
      update: {},
      create: { moduleId: publicationsModule.id, actionId: action.id },
    });
    publicationsPermissions.push(permission);
  }

    // permissoes do modulo "documentos" (GED). Segue o mesmo padrao de
  // Publicacoes: apenas um subconjunto de acoes do catalogo, agora
  // incluindo "activate" (par de "archive").
  const documentsModule = await prisma.module.findUniqueOrThrow({ where: { key: "documentos" } });
  const documentsActionKeys = ["view", "create", "edit", "delete", "archive", "activate"];
  const documentsPermissions = [];
  for (const action of actions) {
    if (!documentsActionKeys.includes(action.key)) continue;
    const permission = await prisma.permission.upsert({
      where: { moduleId_actionId: { moduleId: documentsModule.id, actionId: action.id } },
      update: {},
      create: { moduleId: documentsModule.id, actionId: action.id },
    });
    documentsPermissions.push(permission);
  }

  const adminRole = await prisma.role.upsert({
    
    where: { key: "admin" },
    update: {},
    create: {
      key: "admin",
      name: "Administrador do Sistema",
      description: "Acesso total a fundacao do sistema (usuarios, roles, permissoes, auditoria, configuracoes).",
      isSystem: true,
    },
    
  });

  for (const permission of [...corePermissions, ...employeesPermissions, ...publicationsPermissions, ...documentsPermissions]) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  // role basica para funcionarios sem privilegios administrativos: pode
  // consultar o diretorio corporativo (funcionarios:view), mas nao pode
  // criar/editar/gerenciar cadastros de terceiros nem ver dados restritos
  // de outros funcionarios (isso e checado no service, ver employees.service.ts).
  const colaboradorRole = await prisma.role.upsert({
    where: { key: "colaborador" },
    update: {},
    create: {
      key: "colaborador",
      name: "Colaborador",
      description: "Acesso basico, sem privilegios administrativos.",
      isSystem: true,
    },
  });

  const viewAction = actions.find((a) => a.key === "view")!;
  const employeesViewPermission = employeesPermissions.find((p) => p.actionId === viewAction.id)!;
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: colaboradorRole.id, permissionId: employeesViewPermission.id } },
    update: {},
    create: { roleId: colaboradorRole.id, permissionId: employeesViewPermission.id },
  });

  // role de exemplo para a area de RH: visualiza, cria, edita e administra
  // (inclui dados restritos) o modulo Funcionarios.
  const rhRole = await prisma.role.upsert({
    where: { key: "gestor_rh" },
    update: {},
    create: {
      key: "gestor_rh",
      name: "Gestor de RH",
      description: "Administra o cadastro corporativo de funcionarios.",
      isSystem: false,
    },
  });

  const rhActionKeys = ["view", "create", "edit", "manage"];
  for (const permission of employeesPermissions) {
    const action = actions.find((a) => a.id === permission.actionId)!;
    if (!rhActionKeys.includes(action.key)) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: rhRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: rhRole.id, permissionId: permission.id },
    });
  }

  // --------------------------------------------------------------------
  // Estrutura organizacional inicial minima (para permitir cadastro de
  // funcionarios de teste). Fases futuras poderao gerenciar isso via UI.
  // --------------------------------------------------------------------
  const unit = await prisma.unit.upsert({
    where: { key: "matriz" },
    update: {},
    create: { key: "matriz", name: "Unidade Matriz", isActive: true },
  });

  const department = await prisma.department.upsert({
    where: { unitId_name: { unitId: unit.id, name: "Diretoria Geral" } },
    update: {},
    create: { unitId: unit.id, name: "Diretoria Geral", isActive: true },
  });

  const sector = await prisma.sector.upsert({
    where: { departmentId_name: { departmentId: department.id, name: "TI" } },
    update: {},
    create: { departmentId: department.id, name: "TI", isActive: true },
  });

  await prisma.position.upsert({
    where: { name: "Administrador de Sistemas" },
    update: {},
    create: { name: "Administrador de Sistemas", isActive: true },
  });

  console.log(`Estrutura organizacional inicial criada: ${unit.name} > ${department.name} > ${sector.name}`);

  const passwordHash = await bcrypt.hash("Admin@123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@hospital.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@hospital.local",
      login: "admin",
      passwordHash,
      status: "ATIVO",
      authProvider: "LOCAL",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.systemSetting.upsert({
    where: { key: "auth.provider" },
    update: {},
    create: { key: "auth.provider", value: "local", scope: "global" },
  });

  console.log("Seed concluido. Usuario admin: admin@hospital.local / senha: Admin@123 (trocar no primeiro acesso)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
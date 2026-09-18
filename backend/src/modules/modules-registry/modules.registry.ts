import { prisma } from "@core/database/prisma";

/**
 * ====================================================================
 * REGISTRO DE MODULOS - ponto central de extensibilidade da Fase 1
 * ====================================================================
 *
 * Cada modulo futuro (Funcionarios, Folha, Publicacoes, Documentos,
 * Notificacoes, Administracao, RH, TI, ...) e representado por uma
 * linha na tabela `modules` (ver prisma/schema.prisma) e passa a
 * existir para o RBAC assim que suas Permissions (modulo x acao) forem
 * criadas - sem qualquer alteracao no schema do banco.
 *
 * Para adicionar um novo modulo de negocio nas proximas fases, o
 * padrao e:
 *
 *   1. Registrar o modulo (uma vez, via seed ou script de migracao):
 *        prisma.module.create({ data: { key: "documentos", name: "Documentos" } })
 *
 *   2. Gerar as Permissions do modulo (combinacao com as Actions
 *      existentes - view/create/edit/delete/approve/manage):
 *        for (const action of actions) {
 *          prisma.permission.create({ data: { moduleId, actionId } })
 *        }
 *
 *   3. Criar a pasta backend/src/modules/<novo-modulo>/ seguindo o
 *      mesmo padrao usado em users/roles/permissions/audit:
 *        <modulo>.routes.ts | .controller.ts | .service.ts | .repository.ts
 *      Nas rotas, proteger cada endpoint com:
 *        authenticate, authorize("<modulo>:<acao>")
 *
 *   4. Registrar o router do modulo em src/routes/index.ts.
 *
 *   5. No frontend, registrar a entrada do modulo em
 *      src/modules/registry.ts (ver frontend) para que ele apareca
 *      automaticamente no menu lateral, respeitando as permissoes do
 *      usuario logado.
 *
 * Nenhum destes passos exige alterar o core de autenticacao, RBAC,
 * auditoria ou o layout principal - eles ja foram construidos para
 * serem agnosticos ao numero de modulos existentes.
 */
export const ModulesRegistryService = {
  listActive() {
    return prisma.module.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  },

  listAll() {
    return prisma.module.findMany({ orderBy: { name: "asc" } });
  },
};

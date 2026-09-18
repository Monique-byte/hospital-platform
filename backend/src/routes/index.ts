import { Router } from "express";
import authRoutes from "@modules/auth/auth.routes";
import usersRoutes from "@modules/users/users.routes";
import rolesRoutes from "@modules/roles/roles.routes";
import permissionsRoutes from "@modules/permissions/permissions.routes";
import auditRoutes from "@modules/audit/audit.routes";
import sessionsRoutes from "@modules/sessions/sessions.routes";
import employeesRoutes from "@modules/employees/employees.routes";
import orgStructureRoutes from "@modules/org-structure/org-structure.routes";
import publicationsRoutes from "@modules/publications/publications.routes";
import documentsRoutes from "@modules/documents/documents.routes";

/**
 * Composicao central das rotas.
 *
 * Fase 1 (fundacao): auth, usuarios, roles, permissoes, auditoria, sessoes.
 * Fase 2 (Funcionarios): funcionarios, estrutura-organizacional.
 * Fase 3.2 (Publicacoes/Intranet): publicacoes.
 *
 * Proximos modulos (Folha, RH, TI, Documentos, Notificacoes,
 * Administracao) deverao ser registrados aqui seguindo o mesmo padrao:
 *   router.use("/<modulo>", <modulo>Routes);
 */
const router = Router();

router.use("/auth", authRoutes);
router.use("/usuarios", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/permissoes", permissionsRoutes);
router.use("/auditoria", auditRoutes);
router.use("/sessoes", sessionsRoutes);
router.use("/funcionarios", employeesRoutes);
router.use("/estrutura-organizacional", orgStructureRoutes);
router.use("/publicacoes", publicationsRoutes);
router.use("/documentos", documentsRoutes);

router.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

export default router;
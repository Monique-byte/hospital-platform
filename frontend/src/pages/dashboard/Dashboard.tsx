import { Users, ArrowRight, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PermissionGate } from "@/components/PermissionGate";

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Olá, {user?.name || user?.login} 👋</h1>
        <p className="text-sm text-brand-700/60">Bem-vindo à plataforma corporativa do hospital.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PermissionGate permission="funcionarios:view">
          <Link to="/funcionarios" className="group rounded-xl border border-black/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Users size={20} />
            </div>
            <p className="font-medium text-brand-900">Diretório de Funcionários</p>
            <p className="mt-1 text-sm text-brand-700/60">Consulte o cadastro corporativo, cargos e setores.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 group-hover:gap-2 transition-all">
              Acessar <ArrowRight size={14} />
            </span>
          </Link>
        </PermissionGate>

        <PermissionGate anyOf={["core:view", "core:manage"]}>
          <div className="rounded-xl border border-dashed border-black/10 bg-white/50 p-5 opacity-70">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Settings size={20} />
            </div>
            <p className="font-medium text-brand-900">Administração (Usuários, Perfis, Auditoria)</p>
            <p className="mt-1 text-sm text-brand-700/60">Disponível via API na Fase 1. Telas dedicadas chegam em uma próxima fase.</p>
          </div>
        </PermissionGate>
      </div>

      <div className="rounded-xl border border-dashed border-black/10 bg-white/50 p-5 text-sm text-brand-700/60">
        Os módulos de Folha, Publicações, Documentos e Notificações serão adicionados nas próximas fases.
      </div>
    </div>
  );
}
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: string | number }>;
  /** Se definido, o item so aparece quando o usuario possuir esta permissao. */
  requiredPermission?: string;
}

// Registro de itens de menu. Modulos futuros (Folha, RH, TI, Documentos...)
// e as telas de administracao da Fase 1 (Usuarios/Roles/Auditoria - ainda
// somente via API nesta fase) devem adicionar sua entrada aqui, com a
// permissao correspondente - nenhuma outra parte do layout precisa mudar.
const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/funcionarios", label: "Funcionários", icon: Users, requiredPermission: "funcionarios:view" },
  { to: "/documentos", label: "Documentos", icon: FileText, requiredPermission: "documentos:view" },
  { to: "/admin/publicacoes", label: "Publicações", icon: Users, requiredPermission: "publicacoes:create" },
];

export function Sidebar() {
  const { hasPermission } = useAuth();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-surface-sidebar text-brand-50">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-bold text-white">H</div>
        <div>
          <p className="text-sm font-semibold leading-none">Plataforma Hospitalar</p>
          <p className="text-xs text-brand-200/80">Painel Corporativo</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-brand-700 text-white" : "text-brand-100/80 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100/40 cursor-not-allowed">
          <Settings size={18} />
          Administração (em breve)
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-xs text-brand-200/60">
        Fase 2 · Módulo Funcionários
      </div>
    </aside>
  );
}
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Painel",
  funcionarios: "Funcionários",
  novo: "Novo",
  editar: "Editar",
  administracao: "Administração",
  usuarios: "Usuários",
  auditoria: "Auditoria",
};

export function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-brand-700/70">
      <Link to="/dashboard" className="hover:text-brand-900">
        Início
      </Link>

      {segments.map((segment, idx) => {
        const path = "/" + segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        const isIdLike = /^[0-9a-f-]{20,}$/i.test(segment);
        const label = isIdLike ? "Detalhe" : LABELS[segment] ?? segment;

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight size={14} />

            {isLast ? (
              <span className="font-medium text-brand-900">{label}</span>
            ) : (
              <Link to={path} className="hover:text-brand-900">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

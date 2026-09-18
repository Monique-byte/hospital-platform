import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Guarda de rota: redireciona para o diretorio se o usuario nao tiver
 * a permissao exigida. Camada extra de UX - a autorizacao real e
 * sempre imposta pelo backend (middleware `authorize`), entao mesmo
 * que este guard fosse contornado, a API rejeitaria a operacao.
 */
export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <Navigate to="/funcionarios" replace />;
  return <>{children}</>;
}
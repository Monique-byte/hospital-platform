import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface PermissionGateProps {
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  anyOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission } = useAuth();

  const allowed = permission
    ? hasPermission(permission)
    : anyOf
      ? hasAnyPermission(...anyOf)
      : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
}

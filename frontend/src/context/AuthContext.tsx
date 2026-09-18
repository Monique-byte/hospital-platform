import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { AuthenticatedUser } from "@/types";
import { AuthService } from "@/services/auth.service";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restored = AuthService.restoreFromToken();
    setUser(restored);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    const authenticatedUser = await AuthService.login(loginValue, password);
    setUser(authenticatedUser);
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => !!user?.permissions.includes(permission),
    [user]
  );

  const hasAnyPermission = useCallback(
    (...permissions: string[]) =>
      permissions.some((permission) =>
        user?.permissions.includes(permission)
      ),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }

  return context;
}

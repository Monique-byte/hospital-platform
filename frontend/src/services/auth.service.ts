import { api, tokenStorage } from "./api";
import { LoginResponse, AuthenticatedUser } from "@/types";

function decodeJwtPayload<T>(token: string): T {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );

  return JSON.parse(json);
}

export const AuthService = {
  async login(login: string, password: string): Promise<AuthenticatedUser> {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      login,
      password,
    });

    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    tokenStorage.setUserInfo(data.user.name, data.user.email);

    const payload = decodeJwtPayload<{
      sub: string;
      login: string;
      roles: string[];
      permissions: string[];
    }>(data.accessToken);

    return {
      sub: payload.sub,
      login: payload.login,
      roles: payload.roles,
      permissions: payload.permissions,
      name: data.user.name,
      email: data.user.email,
    };
  },

  restoreFromToken(): AuthenticatedUser | null {
    const token = tokenStorage.getAccessToken();

    if (!token) return null;

    try {
      const payload = decodeJwtPayload<{
        sub: string;
        login: string;
        roles: string[];
        permissions: string[];
        exp: number;
      }>(token);

      if (payload.exp * 1000 < Date.now()) {
        tokenStorage.clear();
        return null;
      }

      const userInfo = tokenStorage.getUserInfo();

      return {
        sub: payload.sub,
        login: payload.login,
        roles: payload.roles,
        permissions: payload.permissions,
        name: userInfo?.name ?? "",
        email: userInfo?.email ?? "",
      };
    } catch {
      tokenStorage.clear();
      return null;
    }
  },

  async me() {
    const { data } = await api.get<{
      user: {
        sub: string;
        login: string;
        roles: string[];
        permissions: string[];
      };
    }>("/auth/me");

    const userInfo = tokenStorage.getUserInfo();

    return {
      ...data.user,
      name: userInfo?.name ?? "",
      email: userInfo?.email ?? "",
    };
  },

  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();

    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {
        // Ignora falha de rede no logout.
      }
    }

    tokenStorage.clear();
  },
};

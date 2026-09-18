import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Cliente HTTP central da aplicacao.
 * Todo modulo deve usar esta instancia.
 */
export const api = axios.create({ baseURL: "/api" });

const ACCESS_TOKEN_KEY = "hp_access_token";
const REFRESH_TOKEN_KEY = "hp_refresh_token";
const USER_INFO_KEY = "hp_user_info";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  getUserInfo: (): { name: string; email: string } | null => {
    const raw = localStorage.getItem(USER_INFO_KEY);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUserInfo: (name: string, email: string) => {
    localStorage.setItem(
      USER_INFO_KEY,
      JSON.stringify({ name, email })
    );
  },

  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
  },
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  }
);

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) return null;

  try {
    const { data } = await axios.post("/api/auth/refresh", {
      refreshToken,
    });

    tokenStorage.setTokens(
      data.accessToken,
      refreshToken
    );

    return data.accessToken as string;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newToken}`
        );

        return api(originalRequest);
      }

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

/**
 * Extrai uma mensagem legivel da API.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado."
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string } }
      | undefined;

    return data?.error?.message ?? fallback;
  }

  return fallback;
}
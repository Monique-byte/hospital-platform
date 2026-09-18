import "dotenv/config";
import { z } from "zod";

/**
 * Validacao centralizada de variaveis de ambiente.
 * Se algo obrigatorio faltar, a aplicacao falha ja na inicializacao
 * (fail-fast), evitando erros silenciosos em producao.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),

  DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatorio"),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  PASSWORD_MIN_LENGTH: z.coerce.number().default(8),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Estrategia de autenticacao ativa. Fase 1 suporta somente "local",
  // mas "ldap" e "oidc" ja sao valores validos para nao quebrar o
  // schema quando as fases futuras forem habilitadas.
  AUTH_PROVIDER: z.enum(["local", "ldap", "oidc"]).default("local"),

  LDAP_URL: z.string().optional(),
  LDAP_BIND_DN: z.string().optional(),
  LDAP_BIND_PASSWORD: z.string().optional(),
  LDAP_SEARCH_BASE: z.string().optional(),

  OIDC_ISSUER_URL: z.string().optional(),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),

  MFA_ENABLED: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variaveis de ambiente invalidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Configuracao de ambiente invalida. Verifique o arquivo .env");
}

export const env = parsed.data;
import { env } from "./env";

export const appConfig = {
  env: env.NODE_ENV,
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,

  auth: {
    provider: env.AUTH_PROVIDER,
    passwordMinLength: env.PASSWORD_MIN_LENGTH,

    accessTokenSecret: env.JWT_ACCESS_SECRET,
    refreshTokenSecret: env.JWT_REFRESH_SECRET,

    accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,

    mfaEnabled: env.MFA_ENABLED,

    ldap: {
      url: env.LDAP_URL,
      bindDn: env.LDAP_BIND_DN,
      bindPassword: env.LDAP_BIND_PASSWORD,
      searchBase: env.LDAP_SEARCH_BASE,
    },

    oidc: {
      issuerUrl: env.OIDC_ISSUER_URL,
      clientId: env.OIDC_CLIENT_ID,
      clientSecret: env.OIDC_CLIENT_SECRET,
    },
  },
} as const;

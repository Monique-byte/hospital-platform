/**
 * Contrato que toda estrategia de autenticacao deve implementar.
 *
 * Permite utilizar autenticacao local, LDAP/AD ou SSO
 * sem alterar o restante da aplicacao.
 */

export interface AuthCredentials {
  login: string;
  password: string;
}

export interface AuthenticatedIdentity {
  userId: string;
  externalId?: string;
  email: string;
  name: string;
}

export interface IAuthStrategy {
  readonly providerKey: "local" | "ldap" | "oidc";

  authenticate(
    credentials: AuthCredentials
  ): Promise<AuthenticatedIdentity>;
}

import {
  AuthCredentials,
  AuthenticatedIdentity,
  IAuthStrategy,
} from "./IAuthStrategy";

/**
 * Stub reservado para futura integracao com Active Directory / LDAP.
 *
 * Esta estrategia nao esta habilitada na Fase 1.
 */
export class LdapAuthStrategy implements IAuthStrategy {
  readonly providerKey = "ldap" as const;

  async authenticate(
    _credentials: AuthCredentials
  ): Promise<AuthenticatedIdentity> {
    throw new Error(
      "Integracao com AD/LDAP ainda nao implementada. Reservado para fase futura."
    );
  }
}

/**
 * Acoes padrao do RBAC. Mantidas aqui como referencia de codigo, mas a
 * fonte da verdade em runtime e sempre a tabela `actions` no banco
 * (ver prisma/seed.ts), para permitir extensao sem deploy de codigo.
 */
export const DEFAULT_ACTIONS = ["view", "create", "edit", "delete", "approve", "manage"] as const;

export type DefaultAction = (typeof DEFAULT_ACTIONS)[number];

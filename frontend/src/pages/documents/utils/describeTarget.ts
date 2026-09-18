import { DocumentTargetSummary } from "@/types";

/** Traduz um DocumentTarget em texto legivel - usado como indicador visual de permissao/publico-alvo. */
export function describeDocumentTarget(target: DocumentTargetSummary): string {
  switch (target.targetType) {
    case "TODOS": return "Todos os funcionários";
    case "UNIDADE": return target.unit ? `Unidade: ${target.unit.name}` : "Unidade específica";
    case "DEPARTAMENTO": return target.department ? `Departamento: ${target.department.name}` : "Departamento específico";
    case "SETOR": return target.sector ? `Setor: ${target.sector.name}` : "Setor específico";
    case "CARGO": return target.position ? `Cargo: ${target.position.name}` : "Cargo específico";
    case "GRUPO": return target.groupKey ? `Grupo: ${target.groupKey}` : "Grupo específico";
    case "USUARIO": return "Usuário específico";
    default: return "Público-alvo desconhecido";
  }
}
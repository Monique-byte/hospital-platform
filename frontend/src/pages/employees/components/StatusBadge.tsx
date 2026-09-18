import { EmployeeStatus } from "@/types";

const STYLES: Record<EmployeeStatus, string> = {
  ATIVO: "bg-accent-500/10 text-accent-600",
  INATIVO: "bg-black/5 text-brand-700/60",
  AFASTADO: "bg-warn-500/10 text-warn-500",
};

const LABELS: Record<EmployeeStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  AFASTADO: "Afastado",
};

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}

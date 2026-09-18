import { DocumentStatus } from "@/types";

const STYLES: Record<DocumentStatus, string> = {
  ATIVO: "bg-accent-500/10 text-accent-600",
  ARQUIVADO: "bg-brand-100 text-brand-700/60",
};

const LABELS: Record<DocumentStatus, string> = {
  ATIVO: "Ativo",
  ARQUIVADO: "Arquivado",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
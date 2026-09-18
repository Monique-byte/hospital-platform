import { DocumentCategory } from "@/types";

const LABELS: Record<DocumentCategory, string> = {
  POLITICA: "Política",
  PROCEDIMENTO: "Procedimento",
  MANUAL: "Manual",
  REGULAMENTO: "Regulamento",
  FORMULARIO: "Formulário",
  COMUNICADO: "Comunicado",
  NORMA: "Norma",
  ADMINISTRATIVO: "Administrativo",
};

export function DocumentCategoryBadge({ category }: { category: DocumentCategory }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
      {LABELS[category]}
    </span>
  );
}
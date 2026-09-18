import { PublicationCategory } from "@/types";

const CATEGORY_LABELS: Record<PublicationCategory, string> = {
  NOTICIA: "Notícia", COMUNICADO: "Comunicado", AVISO: "Aviso",
  EVENTO: "Evento", CAMPANHA: "Campanha", INFORMATIVO: "Informativo",
};
const CATEGORY_STYLES: Record<PublicationCategory, string> = {
  NOTICIA: "bg-brand-50 text-brand-700", COMUNICADO: "bg-accent-500 text-white",
  AVISO: "bg-warn-500 text-white", EVENTO: "bg-brand-700 text-white",
  CAMPANHA: "bg-danger-500 text-white", INFORMATIVO: "bg-brand-100 text-brand-800",
};

export function CategoryBadge({ category }: { category: PublicationCategory }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${CATEGORY_STYLES[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
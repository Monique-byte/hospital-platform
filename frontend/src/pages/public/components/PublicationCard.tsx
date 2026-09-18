import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import { PublicationListItem } from "@/types";
import { CategoryBadge } from "./CategoryBadge";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

interface PublicationCardProps {
  publication: PublicationListItem;
  variant?: "default" | "featured" | "secondary";
}

export function PublicationCard({ publication, variant = "default" }: PublicationCardProps) {
  const date = formatDate(publication.publishedAt ?? publication.createdAt);
  const isFeatured = variant === "featured";
  const isSecondary = variant === "secondary";

  return (
    <Link
      to={`/publicacoes/${publication.id}`}
      className={`group flex h-full overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black/10 hover:shadow-md ${
        isFeatured ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-brand-50 ${
        isFeatured ? "aspect-[16/9] md:aspect-auto md:w-1/2" : isSecondary ? "aspect-[4/3] w-full" : "aspect-[16/9] w-full"
      }`}>
        {publication.featuredImageUrl ? (
          <img
            src={publication.featuredImageUrl}
            alt={publication.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-300">
            <ImageOff size={isFeatured ? 40 : isSecondary ? 24 : 28} />
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col gap-2 ${isSecondary ? "p-3" : "p-4"} ${isFeatured ? "md:p-6" : ""}`}>
        <CategoryBadge category={publication.category} />
        <h3 className={`font-semibold text-brand-900 transition-colors group-hover:text-brand-700 ${
          isFeatured ? "text-xl md:text-2xl" : isSecondary ? "text-sm line-clamp-2" : "text-base line-clamp-2"
        }`}>
          {publication.title}
        </h3>
        {publication.subtitle && !isSecondary ? (
          <p className={`text-brand-700/70 ${isFeatured ? "text-sm md:text-base line-clamp-3" : "text-sm line-clamp-2"}`}>
            {publication.subtitle}
          </p>
        ) : null}
        {date ? <p className="mt-auto pt-1 text-xs text-brand-700/50">{date}</p> : null}
      </div>
    </Link>
  );
}
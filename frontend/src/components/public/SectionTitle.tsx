import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function SectionTitle({ title, subtitle, viewAllHref, viewAllLabel = "Ver todas" }: SectionTitleProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-900 md:text-xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-brand-700/60">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          {viewAllLabel} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
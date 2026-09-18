import { PublicationListItem } from "@/types";
import { PublicationCard } from "./PublicationCard";

export function PublicationGrid({ items }: { items: PublicationListItem[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.id} className="animate-[fadeInUp_0.35s_ease-out_both]" style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}>
          <PublicationCard publication={item} />
        </div>
      ))}
    </div>
  );
}
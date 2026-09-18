import { Link } from "react-router-dom";

type Specialty = {
  name: string;
  slug: string;
  description?: string;
};

interface SpecialtyListItemProps {
  specialty: Specialty;
}

export function SpecialtyListItem({ specialty }: SpecialtyListItemProps) {
  return (
    <Link
      to={`/especialidades/${specialty.slug}`}
      className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-3 transition-all duration-200 hover:border-black/5 hover:bg-gray-50"
    >
      <div className="min-w-0">
        <h3 className="font-medium text-gray-900 transition-colors group-hover:text-primary">
          {specialty.name}
        </h3>

        {specialty.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {specialty.description}
          </p>
        )}
      </div>

      <svg
        className="ml-3 h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.24 4.24a.75.75 0 0 1 0 1.06l-4.24 4.24a.75.75 0 0 1-1.06-.02Z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
}

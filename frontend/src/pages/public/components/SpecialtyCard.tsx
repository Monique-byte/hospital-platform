import { Specialty } from "@/data/specialties";

export function SpecialtyCard({ specialty }: { specialty: Specialty }) {
  const Icon = specialty.icon;
  return (
    <div className="flex flex-col rounded-xl border border-black/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon size={22} />
      </div>
      <span className="mb-1 w-fit rounded-full bg-accent-500/10 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
        {specialty.frequency}
      </span>
      <h3 className="mb-1 text-base font-semibold text-brand-900">{specialty.name}</h3>
      <p className="text-sm leading-relaxed text-brand-700/70 line-clamp-4">{specialty.description}</p>
    </div>
  );
}
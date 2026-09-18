import { useEffect } from "react";
import { SPECIALTIES } from "@/data/specialties";
import { SectionTitle } from "@/components/public/SectionTitle";
import { SpecialtyListItem } from "./components/SpecialtyListItem";

export function SpecialtiesPage() {
  useEffect(() => {
    document.title = "Especialidades e Serviços | Hospital Santo Antônio";
  }, []);

  const sorted = [...SPECIALTIES].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="animate-[fadeInUp_0.3s_ease-out] space-y-6">
      <SectionTitle
        title="Especialidades e Serviços"
        subtitle="Consulte com médicos e profissionais especialistas no Hospital Santo Antônio"
      />
      <div className="columns-1 gap-6 rounded-2xl border border-black/5 bg-white p-4 sm:columns-2 md:p-6 lg:columns-3">
        {sorted.map((specialty) => (
          <div key={specialty.slug} className="break-inside-avoid pb-1">
            <SpecialtyListItem specialty={specialty} />
          </div>
        ))}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { OrgStructureService } from "@/services/orgStructure.service";
import { OrgTreeUnit } from "@/types";

interface OrgCascadeSelectProps {
  value?: string;
  onChange: (sectorId: string) => void;
  disabled?: boolean;
}

export function OrgCascadeSelect({ value, onChange, disabled }: OrgCascadeSelectProps) {
  const [tree, setTree] = useState<OrgTreeUnit[]>([]);
  const [unitId, setUnitId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    OrgStructureService.getTree().then((data) => {
      setTree(data);
      setIsLoading(false);

      if (value) {
        for (const unit of data) {
          for (const department of unit.departments) {
            if (department.sectors.some((s) => s.id === value)) {
              setUnitId(unit.id);
              setDepartmentId(department.id);
              return;
            }
          }
        }
      }
    });
  }, []);

  const selectedUnit = tree.find((u) => u.id === unitId);
  const departments = selectedUnit?.departments ?? [];
  const selectedDepartment = departments.find((d) => d.id === departmentId);
  const sectors = selectedDepartment?.sectors ?? [];

  if (isLoading) {
    return (
      <p className="text-sm text-brand-700/50">
        Carregando estrutura organizacional...
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-brand-700/70">
          Unidade
        </label>

        <select
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          value={unitId}
          disabled={disabled}
          onChange={(e) => {
            setUnitId(e.target.value);
            setDepartmentId("");
            onChange("");
          }}
        >
          <option value="">Selecione...</option>

          {tree.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-brand-700/70">
          Departamento
        </label>

        <select
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm disabled:bg-black/5"
          value={departmentId}
          disabled={disabled || !unitId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            onChange("");
          }}
        >
          <option value="">Selecione...</option>

          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-brand-700/70">
          Setor
        </label>

        <select
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm disabled:bg-black/5"
          value={value ?? ""}
          disabled={disabled || !departmentId}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Selecione...</option>

          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

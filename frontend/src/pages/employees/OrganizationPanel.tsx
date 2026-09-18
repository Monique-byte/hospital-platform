import { useEffect, useState } from "react";
import { EmployeesService } from "@/services/employees.service";
import { OrgStructureService } from "@/services/orgStructure.service";
import { extractErrorMessage } from "@/services/api";
import { EmployeePublic, Position } from "@/types";
import { OrgCascadeSelect } from "./components/OrgCascadeSelect";
import { ManagerPicker } from "./components/ManagerPicker";

interface OrganizationPanelProps {
  employee: EmployeePublic;
  onSaved: () => void;
}

/**
 * Painel de alteracao de cargo, setor (e, por consequencia,
 * departamento/unidade) e gestor. Usa o endpoint unico
 * PATCH /funcionarios/:id/organizacao ja existente no backend.
 */
export function OrganizationPanel({ employee, onSaved }: OrganizationPanelProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionId, setPositionId] = useState(employee.position.id);
  const [sectorId, setSectorId] = useState(employee.sector.id);
  const [managerId, setManagerId] = useState<string | null>(employee.manager?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { OrgStructureService.listPositions().then(setPositions); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await EmployeesService.updateOrganization(employee.id, { positionId, sectorId, managerId });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível salvar a alteração organizacional."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-brand-700/70">Cargo</label>
        <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm sm:w-72">
          {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-brand-700/70">Unidade / Departamento / Setor</label>
        <OrgCascadeSelect value={sectorId} onChange={setSectorId} />
      </div>

      <div className="sm:w-96">
        <label className="mb-1 block text-xs font-medium text-brand-700/70">Gestor</label>
        <ManagerPicker
          value={managerId}
          currentLabel={employee.manager ? `${employee.manager.fullName} · ${employee.manager.registrationNumber}` : null}
          excludeEmployeeId={employee.id}
          onChange={setManagerId}
        />
      </div>

      {error && <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-500">{error}</p>}

      <button
        type="submit"
        disabled={isSaving || !sectorId}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {isSaving ? "Salvando..." : "Salvar alteração organizacional"}
      </button>
    </form>
  );
}
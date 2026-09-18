import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import { EmployeesService } from "@/services/employees.service";
import { OrgStructureService } from "@/services/orgStructure.service";
import { EmployeePublic, Unit, Position } from "@/types";
import { StatusBadge } from "./components/StatusBadge";
import { PermissionGate } from "@/components/PermissionGate";
import { extractErrorMessage } from "@/services/api";

const PAGE_SIZE = 10;

export function Directory() {
  const [search, setSearch] = useState("");
  const [unitId, setUnitId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<EmployeePublic[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [units, setUnits] = useState<Unit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    OrgStructureService.listUnits().then(setUnits);
    OrgStructureService.listPositions().then(setPositions);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const timeout = setTimeout(() => {
      EmployeesService.listDirectory({
        search: search || undefined,
        unitId: unitId || undefined,
        positionId: positionId || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
        .then((data) => { setItems(data.items); setTotal(data.total); })
        .catch((err) => setError(extractErrorMessage(err, "Não foi possível carregar o diretório de funcionários.")))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, unitId, positionId, page, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-900">Funcionários</h1>
          <p className="text-sm text-brand-700/60">Diretório corporativo do hospital.</p>
        </div>

        <PermissionGate permission="funcionarios:create">
          <Link
            to="/funcionarios/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={16} /> Novo Funcionário
          </Link>
        </PermissionGate>
      </div>

      <div className="grid gap-3 rounded-xl border border-black/5 bg-white p-4 sm:grid-cols-4">
        <div className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2">
          <Search size={16} className="text-brand-700/40" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nome, nome social, matrícula, cargo, setor ou ramal..."
            className="w-full text-sm outline-none"
          />
        </div>

        <select
          value={unitId}
          onChange={(e) => { setUnitId(e.target.value); setPage(1); }}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          <option value="">Todas as unidades</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select
          value={positionId}
          onChange={(e) => { setPositionId(e.target.value); setPage(1); }}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          <option value="">Todos os cargos</option>
          {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs font-medium uppercase tracking-wide text-brand-700/60">
            <tr>
              <th className="px-4 py-3">Funcionário</th>
              <th className="px-4 py-3 hidden md:table-cell">Cargo</th>
              <th className="px-4 py-3 hidden lg:table-cell">Setor / Unidade</th>
              <th className="px-4 py-3 hidden sm:table-cell">Ramal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
                  <tbody className="divide-y divide-black/5">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-700/50">Carregando...</td></tr>
            )}

            {!isLoading && error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <p className="text-sm text-danger-500">{error}</p>
                  <button
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="mt-2 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    Tentar novamente
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-700/50">Nenhum funcionário encontrado.</td></tr>
            )}

            {!isLoading && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-700/50">Nenhum funcionário encontrado.</td></tr>
            )}

            {!isLoading && !error && items.map((employee) => (
              <tr key={employee.id} className="hover:bg-brand-50/50">
                <td className="px-4 py-3">
                  <Link to={`/funcionarios/${employee.id}`} className="flex items-center gap-3">
                    {employee.photoUrl ? (
                      <img src={employee.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-brand-700"><UserIcon size={16} /></div>
                    )}
                    <div>
                      <p className="font-medium text-brand-900">{employee.socialName || employee.fullName}</p>
                      <p className="text-xs text-brand-700/60">Mat. {employee.registrationNumber} · {employee.corporateEmail}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-brand-700/80">{employee.position.name}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-brand-700/80">
                  {employee.sector.name} · {employee.sector.department.unit.name}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-brand-700/80">{employee.extension || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={employee.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/funcionarios/${employee.id}`} className="text-sm font-medium text-brand-700 hover:underline">Ver perfil</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-sm text-brand-700/60">
          <span>{total} funcionário(s) encontrado(s)</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            <span>Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, X, Search } from "lucide-react";
import { DocumentsService } from "@/services/documents.service";
import { OrgStructureService } from "@/services/orgStructure.service";
import { EmployeesService } from "@/services/employees.service";
import {
  Department, DocumentCategory, DocumentTargetInput, DocumentTargetType,
  EmployeePublic, Position, Sector, Unit,
} from "@/types";
import { extractErrorMessage } from "@/services/api";

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "POLITICA", label: "Política" },
  { value: "PROCEDIMENTO", label: "Procedimento" },
  { value: "MANUAL", label: "Manual" },
  { value: "REGULAMENTO", label: "Regulamento" },
  { value: "FORMULARIO", label: "Formulário" },
  { value: "COMUNICADO", label: "Comunicado" },
  { value: "NORMA", label: "Norma" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
];

const TARGET_TYPE_OPTIONS: { value: DocumentTargetType; label: string }[] = [
  { value: "TODOS", label: "Todos os funcionários" },
  { value: "UNIDADE", label: "Unidade específica" },
  { value: "DEPARTAMENTO", label: "Departamento específico" },
  { value: "SETOR", label: "Setor específico" },
  { value: "CARGO", label: "Cargo específico" },
  { value: "GRUPO", label: "Grupo (identificador livre)" },
  { value: "USUARIO", label: "Usuário específico" },
];

/**
 * Formulario de criacao de Documento.
 *
 * Seletor de publico-alvo com cascata real via OrgStructureService:
 *  - UNIDADE: dropdown de listUnits().
 *  - DEPARTAMENTO: dropdown de Unidade (para filtrar) + dropdown de
 *    listDepartments(unitId). Unidade e apenas um filtro visual; o
 *    target enviado usa somente departmentId, conforme o contrato do
 *    backend (DocumentTargetInput nao aceita unitId+departmentId juntos
 *    para targetType=DEPARTAMENTO).
 *  - SETOR: dropdown de Unidade + Departamento (filtros) + dropdown de
 *    listSectors(departmentId). Mesma logica: so sectorId e enviado.
 *  - CARGO: dropdown de listPositions().
 *  - USUARIO: busca de funcionario (EmployeesService.listDirectory),
 *    resolvendo para EmployeePublic.userId. So permite selecionar
 *    funcionarios com usuario de sistema vinculado.
 *  - GRUPO: identificador livre (nao ha entidade de Grupo no sistema).
 */
export function DocumentForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("POLITICA");
  const [tags, setTags] = useState("");
  const [targetType, setTargetType] = useState<DocumentTargetType>("TODOS");
  const [groupKey, setGroupKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [units, setUnits] = useState<Unit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);

  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState("");

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeResults, setEmployeeResults] = useState<EmployeePublic[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePublic | null>(null);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);

  useEffect(() => {
    OrgStructureService.listUnits().then(setUnits);
    OrgStructureService.listPositions().then(setPositions);
  }, []);

  // Cascata para DEPARTAMENTO: unidade filtra a lista de departamentos.
  useEffect(() => {
    if (targetType !== "DEPARTAMENTO") return;
    OrgStructureService.listDepartments(filterUnitId || undefined).then(setDepartments);
  }, [targetType, filterUnitId]);

  // Cascata para SETOR: unidade filtra departamentos, departamento filtra setores.
  useEffect(() => {
    if (targetType !== "SETOR") return;
    OrgStructureService.listDepartments(filterUnitId || undefined).then(setDepartments);
  }, [targetType, filterUnitId]);

  useEffect(() => {
    if (targetType !== "SETOR") return;
    OrgStructureService.listSectors(filterDepartmentId || undefined).then(setSectors);
  }, [targetType, filterDepartmentId]);

  useEffect(() => {
    if (targetType !== "USUARIO" || !employeeSearch) {
      setEmployeeResults([]);
      return;
    }
    setIsSearchingEmployees(true);
    const timeout = setTimeout(() => {
      EmployeesService.listDirectory({ search: employeeSearch, page: 1, pageSize: 8 })
        .then((data) => setEmployeeResults(data.items))
        .finally(() => setIsSearchingEmployees(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [employeeSearch, targetType]);

  function resetTargetSelection() {
    setFilterUnitId(""); setFilterDepartmentId("");
    setSelectedUnitId(""); setSelectedDepartmentId(""); setSelectedSectorId(""); setSelectedPositionId("");
    setSelectedEmployee(null); setEmployeeSearch(""); setEmployeeResults([]);
    setGroupKey(""); setDepartments([]); setSectors([]);
  }

  function buildTarget(): DocumentTargetInput | null {
    switch (targetType) {
      case "TODOS": return { targetType: "TODOS" };
      case "UNIDADE": return selectedUnitId ? { targetType: "UNIDADE", unitId: selectedUnitId } : null;
      case "DEPARTAMENTO": return selectedDepartmentId ? { targetType: "DEPARTAMENTO", departmentId: selectedDepartmentId } : null;
      case "SETOR": return selectedSectorId ? { targetType: "SETOR", sectorId: selectedSectorId } : null;
      case "CARGO": return selectedPositionId ? { targetType: "CARGO", positionId: selectedPositionId } : null;
      case "USUARIO": return selectedEmployee?.userId ? { targetType: "USUARIO", targetUserId: selectedEmployee.userId } : null;
      case "GRUPO": return groupKey ? { targetType: "GRUPO", groupKey } : null;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecione um arquivo para enviar."); return; }
    const target = buildTarget();
    if (!target) { setError("Selecione o público-alvo do documento."); return; }

    setError(null);
    setIsSubmitting(true);
    try {
      const document = await DocumentsService.create({
        title,
        description: description || undefined,
        category,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        targets: [target],
        file,
      });
      navigate(`/documentos/${document.id}`);
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível criar o documento."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Novo Documento</h1>
        <p className="text-sm text-brand-700/60">Envie um arquivo e defina quem poderá acessá-lo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-black/5 bg-white p-6">
        {error ? <div className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-500">{error}</div> : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Título</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-900">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-900">Tags (separadas por vírgula)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="rh, admissão, formulário" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Público-alvo</label>
          <select value={targetType} onChange={(e) => { setTargetType(e.target.value as DocumentTargetType); resetTargetSelection(); }} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
            {TARGET_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {targetType === "UNIDADE" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-900">Unidade</label>
            <select required value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="">Selecione uma unidade...</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        ) : null}

        {targetType === "DEPARTAMENTO" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-900">Unidade (filtro)</label>
              <select value={filterUnitId} onChange={(e) => { setFilterUnitId(e.target.value); setSelectedDepartmentId(""); }} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
                <option value="">Todas as unidades</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-900">Departamento</label>
              <select required value={selectedDepartmentId} onChange={(e) => setSelectedDepartmentId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
                <option value="">Selecione um departamento...</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        ) : null}

        {targetType === "SETOR" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-900">Unidade (filtro)</label>
              <select value={filterUnitId} onChange={(e) => { setFilterUnitId(e.target.value); setFilterDepartmentId(""); setSelectedSectorId(""); }} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
                <option value="">Todas</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-900">Departamento (filtro)</label>
              <select value={filterDepartmentId} onChange={(e) => { setFilterDepartmentId(e.target.value); setSelectedSectorId(""); }} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
                <option value="">Todos</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-900">Setor</label>
              <select required value={selectedSectorId} onChange={(e) => setSelectedSectorId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        ) : null}

        {targetType === "CARGO" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-900">Cargo</label>
            <select required value={selectedPositionId} onChange={(e) => setSelectedPositionId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="">Selecione um cargo...</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        ) : null}

        {targetType === "USUARIO" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-900">Funcionário</label>
            {selectedEmployee ? (
              <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
                <span className="text-sm text-brand-900">{selectedEmployee.socialName || selectedEmployee.fullName}</span>
                <button type="button" onClick={() => setSelectedEmployee(null)} className="text-brand-700/60 hover:text-danger-500">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2">
                  <Search size={14} className="text-brand-700/40" />
                  <input value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} placeholder="Buscar funcionário por nome..." className="w-full text-sm outline-none" />
                </div>
                {isSearchingEmployees ? <p className="mt-1 text-xs text-brand-700/50">Buscando...</p> : null}
                {employeeResults.length > 0 ? (
                  <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-black/10">
                    {employeeResults.map((emp) => (
                      <li key={emp.id}>
                        <button
                          type="button"
                          disabled={!emp.userId}
                          onClick={() => { setSelectedEmployee(emp); setEmployeeResults([]); }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span>{emp.socialName || emp.fullName}</span>
                          {!emp.userId ? <span className="text-xs text-brand-700/40">sem usuário vinculado</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {targetType === "GRUPO" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-900">Identificador do grupo</label>
            <input required value={groupKey} onChange={(e) => setGroupKey(e.target.value)} placeholder="ex: enfermagem-noturno" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Arquivo</label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-6 text-sm text-brand-700/70 hover:bg-brand-50">
            <UploadCloud size={18} />
            {file ? file.name : "Clique para selecionar um arquivo"}
            <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file ? (
            <button type="button" onClick={() => setFile(null)} className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700/60 hover:text-danger-500">
              <X size={12} /> Remover arquivo
            </button>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {isSubmitting ? "Enviando..." : "Criar Documento"}
          </button>
        </div>
      </form>
    </div>
  );
}
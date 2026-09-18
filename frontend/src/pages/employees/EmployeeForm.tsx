import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { EmployeesService } from "@/services/employees.service";
import { OrgStructureService } from "@/services/orgStructure.service";
import { extractErrorMessage } from "@/services/api";
import { EmploymentType, Position } from "@/types";
import { OrgCascadeSelect } from "./components/OrgCascadeSelect";
import { ManagerPicker } from "./components/ManagerPicker";

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "Pessoa Jurídica (PJ)" },
  { value: "ESTAGIO", label: "Estágio" },
  { value: "TERCEIRIZADO", label: "Terceirizado" },
  { value: "COOPERADO", label: "Cooperado" },
];

interface FormState {
  fullName: string;
  socialName: string;
  registrationNumber: string;
  photoUrl: string;
  admissionDate: string;
  employmentType: EmploymentType;
  positionId: string;
  sectorId: string;
  managerId: string | null;
  extension: string;
  corporateEmail: string;
  corporatePhone: string;
  cpf: string;
  birthDate: string;
  personalPhone: string;
  personalEmail: string;
}

const INITIAL_STATE: FormState = {
  fullName: "", socialName: "", registrationNumber: "", photoUrl: "", admissionDate: "",
  employmentType: "CLT", positionId: "", sectorId: "", managerId: null, extension: "",
  corporateEmail: "", corporatePhone: "", cpf: "", birthDate: "", personalPhone: "", personalEmail: "",
};

/**
 * Formulario unico para criacao e edicao de funcionarios.
 *
 * - Modo CRIACAO (/funcionarios/novo): todos os campos, incluindo
 *   estrutura organizacional e dados restritos (POST /funcionarios).
 * - Modo EDICAO (/funcionarios/:id/editar): somente os campos
 *   cadastrais publicos (PATCH /funcionarios/:id) - cargo, setor e
 *   gestor sao alterados no painel de Organizacao do proprio perfil,
 *   e dados restritos nao sao editaveis por este formulario.
 */
export function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { OrgStructureService.listPositions().then(setPositions); }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;
    EmployeesService.getProfile(id)
      .then(({ employee }) => {
        setForm((prev) => ({
          ...prev,
          fullName: employee.fullName,
          socialName: employee.socialName ?? "",
          registrationNumber: employee.registrationNumber,
          photoUrl: employee.photoUrl ?? "",
          extension: employee.extension ?? "",
          corporateEmail: employee.corporateEmail,
          corporatePhone: employee.corporatePhone ?? "",
        }));
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id, isEditMode]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        const employee = await EmployeesService.update(id, {
          fullName: form.fullName,
          socialName: form.socialName || undefined,
          photoUrl: form.photoUrl || undefined,
          extension: form.extension || undefined,
          corporateEmail: form.corporateEmail,
          corporatePhone: form.corporatePhone || undefined,
        });
        navigate(`/funcionarios/${employee.id}`);
      } else {
        const employee = await EmployeesService.create({
          fullName: form.fullName,
          socialName: form.socialName || undefined,
          registrationNumber: form.registrationNumber,
          photoUrl: form.photoUrl || undefined,
          admissionDate: form.admissionDate,
          employmentType: form.employmentType,
          positionId: form.positionId,
          sectorId: form.sectorId,
          managerId: form.managerId || undefined,
          extension: form.extension || undefined,
          corporateEmail: form.corporateEmail,
          corporatePhone: form.corporatePhone || undefined,
          restricted: {
            cpf: form.cpf,
            birthDate: form.birthDate,
            personalPhone: form.personalPhone || undefined,
            personalEmail: form.personalEmail || undefined,
          },
        });
        navigate(`/funcionarios/${employee.id}`);
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível salvar o funcionário. Verifique os dados informados."));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-brand-700/50">Carregando dados do funcionário...</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <Link to={isEditMode ? `/funcionarios/${id}` : "/funcionarios"} className="inline-flex items-center gap-1 text-sm text-brand-700/70 hover:text-brand-900">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-brand-900">{isEditMode ? "Editar Funcionário" : "Novo Funcionário"}</h1>
        <p className="text-sm text-brand-700/60">
          {isEditMode ? "Atualize os dados cadastrais públicos do funcionário." : "Preencha o cadastro corporativo completo."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-brand-900">Dados cadastrais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nome completo" required value={form.fullName} onChange={(v) => update("fullName", v)} />
            <TextField label="Nome social" value={form.socialName} onChange={(v) => update("socialName", v)} />
            <TextField label="Matrícula" required disabled={isEditMode} value={form.registrationNumber} onChange={(v) => update("registrationNumber", v)} />
            <TextField label="URL da foto" value={form.photoUrl} onChange={(v) => update("photoUrl", v)} placeholder="https://..." />
            <TextField label="E-mail corporativo" required type="email" value={form.corporateEmail} onChange={(v) => update("corporateEmail", v)} />
            <TextField label="Telefone corporativo" value={form.corporatePhone} onChange={(v) => update("corporatePhone", v)} />
            <TextField label="Ramal" value={form.extension} onChange={(v) => update("extension", v)} />
          </div>
        </section>

        {!isEditMode && (
          <>
            <section className="space-y-4 border-t border-black/5 pt-6">
              <h2 className="text-sm font-semibold text-brand-900">Vínculo</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Data de admissão" required type="date" value={form.admissionDate} onChange={(v) => update("admissionDate", v)} />
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-700/70">Tipo de vínculo</label>
                  <select value={form.employmentType} onChange={(e) => update("employmentType", e.target.value as EmploymentType)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
                    {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-700/70">Cargo</label>
                  <select required value={form.positionId} onChange={(e) => update("positionId", e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
                    <option value="">Selecione...</option>
                    {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-black/5 pt-6">
              <h2 className="text-sm font-semibold text-brand-900">Estrutura organizacional</h2>
              <OrgCascadeSelect value={form.sectorId} onChange={(v) => update("sectorId", v)} />
              <div className="sm:w-96">
                <label className="mb-1 block text-xs font-medium text-brand-700/70">Gestor (opcional)</label>
                <ManagerPicker value={form.managerId} onChange={(v) => update("managerId", v)} />
              </div>
            </section>

            <section className="space-y-4 border-t border-black/5 pt-6">
              <h2 className="text-sm font-semibold text-brand-900">Dados restritos</h2>
              <p className="text-xs text-brand-700/50">
                Visíveis apenas ao próprio funcionário e a usuários com permissão de administração do módulo.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="CPF" required value={form.cpf} onChange={(v) => update("cpf", v)} placeholder="000.000.000-00" />
                <TextField label="Data de nascimento" required type="date" value={form.birthDate} onChange={(v) => update("birthDate", v)} />
                <TextField label="Telefone pessoal" value={form.personalPhone} onChange={(v) => update("personalPhone", v)} />
                <TextField label="E-mail pessoal" type="email" value={form.personalEmail} onChange={(v) => update("personalEmail", v)} />
              </div>
            </section>
          </>
        )}

        {error && <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-black/5 pt-6">
          <Link to={isEditMode ? `/funcionarios/${id}` : "/funcionarios"} className="rounded-lg px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Cancelar
          </Link>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TextField(props: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-brand-700/70">{props.label}{props.required && " *"}</label>
      <input
        type={props.type ?? "text"}
        required={props.required}
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm disabled:bg-black/5 disabled:text-brand-700/50"
      />
    </div>
  );
}
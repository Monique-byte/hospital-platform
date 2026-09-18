import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { User as UserIcon, Lock, Pencil, ArrowLeft } from "lucide-react";
import { EmployeesService } from "@/services/employees.service";
import { extractErrorMessage } from "@/services/api";
import { EmployeeProfileResponse, EmployeeStatus } from "@/types";
import { StatusBadge } from "./components/StatusBadge";
import { PermissionGate } from "@/components/PermissionGate";
import { OrganizationPanel } from "./OrganizationPanel";

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  CLT: "CLT", PJ: "Pessoa Jurídica", ESTAGIO: "Estágio", TERCEIRIZADO: "Terceirizado", COOPERADO: "Cooperado",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EmployeeProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showOrgPanel, setShowOrgPanel] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const result = await EmployeesService.getProfile(id);
      setData(result);
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível carregar o perfil do funcionário."));
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function handleStatusChange(status: EmployeeStatus) {
    if (!id) return;
    const confirmMsg = status === "INATIVO" ? "Confirma a inativação deste funcionário? O histórico será preservado." : `Confirma alterar o status para ${status}?`;
    if (!window.confirm(confirmMsg)) return;
    setIsChangingStatus(true);
    try {
      await EmployeesService.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsChangingStatus(false);
    }
  }

  if (error) return <p className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-500">{error}</p>;
  if (!data) return <p className="text-sm text-brand-700/50">Carregando perfil...</p>;

  const { employee, restricted } = data;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-brand-700/70 hover:text-brand-900">
        <ArrowLeft size={16} /> Voltar ao diretório
      </button>

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {employee.photoUrl ? (
              <img src={employee.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-700"><UserIcon size={28} /></div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-brand-900">{employee.socialName || employee.fullName}</h1>
              {employee.socialName && <p className="text-sm text-brand-700/60">Nome civil: {employee.fullName}</p>}
              <p className="text-sm text-brand-700/60">Matrícula {employee.registrationNumber} · {employee.position.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={employee.status} />
            <PermissionGate permission="funcionarios:edit">
              <Link to={`/funcionarios/${employee.id}/editar`} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-brand-900 hover:bg-brand-50">
                <Pencil size={14} /> Editar
              </Link>
            </PermissionGate>
          </div>
        </div>

        <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Setor">{employee.sector.name}</Field>
          <Field label="Departamento">{employee.sector.department.name}</Field>
          <Field label="Unidade">{employee.sector.department.unit.name}</Field>
          <Field label="Gestor">{employee.manager ? `${employee.manager.fullName} (${employee.manager.registrationNumber})` : "—"}</Field>
          <Field label="Ramal">{employee.extension || "—"}</Field>
          <Field label="E-mail corporativo">{employee.corporateEmail}</Field>
          <Field label="Telefone corporativo">{employee.corporatePhone || "—"}</Field>
          <Field label="Data de admissão">{formatDate(employee.admissionDate)}</Field>
          <Field label="Tipo de vínculo">{EMPLOYMENT_TYPE_LABELS[employee.employmentType] ?? employee.employmentType}</Field>
        </div>
      </div>

      {restricted && (
        <div className="rounded-xl border border-warn-500/30 bg-warn-500/5 p-6">
          <div className="mb-4 flex items-center gap-2 text-warn-500">
            <Lock size={16} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Informações restritas</h2>
          </div>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="CPF">{restricted.cpf}</Field>
            <Field label="Data de nascimento">{formatDate(restricted.birthDate)}</Field>
            <Field label="Telefone pessoal">{restricted.personalPhone || "—"}</Field>
            <Field label="E-mail pessoal">{restricted.personalEmail || "—"}</Field>
          </div>
          <p className="mt-4 text-xs text-warn-500/80">
            Estas informações são visíveis apenas para o próprio funcionário e para usuários com permissão de administração do módulo.
          </p>
        </div>
      )}

      <PermissionGate permission="funcionarios:edit">
        <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-brand-900">Status do funcionário</h2>
          <div className="flex flex-wrap gap-2">
            {(["ATIVO", "AFASTADO", "INATIVO"] as EmployeeStatus[]).map((status) => (
              <button
                key={status}
                disabled={isChangingStatus || employee.status === status}
                onClick={() => handleStatusChange(status)}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-brand-900 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Marcar como {status === "ATIVO" ? "Ativo" : status === "AFASTADO" ? "Afastado" : "Inativo"}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-brand-700/50">
            A inativação preserva todo o histórico do funcionário — nenhum dado é excluído fisicamente.
          </p>
        </div>
      </PermissionGate>

      <PermissionGate permission="funcionarios:manage">
        <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-900">Organização (cargo, setor e gestor)</h2>
            <button onClick={() => setShowOrgPanel((v) => !v)} className="text-sm font-medium text-brand-700 hover:underline">
              {showOrgPanel ? "Fechar" : "Alterar"}
            </button>
          </div>
          {showOrgPanel && (
            <div className="mt-4">
              <OrganizationPanel
                employee={employee}
                onSaved={async () => { setShowOrgPanel(false); await load(); }}
              />
            </div>
          )}
        </div>
      </PermissionGate>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-brand-700/50">{label}</p>
      <p className="mt-0.5 text-sm text-brand-900">{children}</p>
    </div>
  );
}
import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { PublicationsService } from "@/services/publications.service";
import { OrgStructureService } from "@/services/orgStructure.service";
import { extractErrorMessage } from "@/services/api";
import {
  Department, Position, PublicationCategory, PublicationTargetInput,
  PublicationTargetType, Sector, Unit,
} from "@/types";

const CATEGORY_OPTIONS: { value: PublicationCategory; label: string }[] = [
  { value: "NOTICIA", label: "Notícia" }, { value: "COMUNICADO", label: "Comunicado" },
  { value: "AVISO", label: "Aviso" }, { value: "EVENTO", label: "Evento" },
  { value: "CAMPANHA", label: "Campanha" }, { value: "INFORMATIVO", label: "Informativo" },
];

const TARGET_TYPE_OPTIONS: { value: PublicationTargetType; label: string }[] = [
  { value: "TODOS", label: "Todos (inclui visitantes públicos)" },
  { value: "UNIDADE", label: "Unidade específica" },
  { value: "DEPARTAMENTO", label: "Departamento específico" },
  { value: "SETOR", label: "Setor específico" },
  { value: "CARGO", label: "Cargo específico" },
  { value: "GRUPO", label: "Grupo (identificador livre)" },
];

/**
 * Formulario de criacao/edicao de Publicacao (area administrativa
 * interna, /admin/publicacoes). Publicacao sempre nasce RASCUNHO -
 * publicar/agendar/arquivar acontecem na tela de listagem administrativa,
 * nao aqui. A imagem de destaque so pode ser enviada DEPOIS que a
 * publicacao existe (a rota de upload exige um :id), entao no modo
 * criacao ela fica desabilitada ate o primeiro "Salvar".
 */
export function PublicationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PublicationCategory>("NOTICIA");
  const [expiresAt, setExpiresAt] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);

  const [targetType, setTargetType] = useState<PublicationTargetType>("TODOS");
  const [groupKey, setGroupKey] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState("");

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    OrgStructureService.listUnits().then(setUnits);
    OrgStructureService.listPositions().then(setPositions);
  }, []);

  useEffect(() => {
    if (targetType !== "DEPARTAMENTO" && targetType !== "SETOR") return;
    OrgStructureService.listDepartments(filterUnitId || undefined).then(setDepartments);
  }, [targetType, filterUnitId]);

  useEffect(() => {
    if (targetType !== "SETOR") return;
    OrgStructureService.listSectors(filterDepartmentId || undefined).then(setSectors);
  }, [targetType, filterDepartmentId]);

  useEffect(() => {
    if (!id) return;
    PublicationsService.getById(id)
      .then((pub) => {
        setTitle(pub.title);
        setSubtitle(pub.subtitle ?? "");
        setContent(pub.content);
        setCategory(pub.category);
        setExpiresAt(pub.expiresAt ? pub.expiresAt.slice(0, 10) : "");
        setFeaturedImageUrl(pub.featuredImageUrl);
      })
      .catch((err) => setError(extractErrorMessage(err, "Não foi possível carregar a publicação.")))
      .finally(() => setIsLoading(false));
  }, [id]);

  function buildTarget(): PublicationTargetInput | null {
    switch (targetType) {
      case "TODOS": return { targetType: "TODOS" };
      case "UNIDADE": return selectedUnitId ? { targetType: "UNIDADE", unitId: selectedUnitId } : null;
      case "DEPARTAMENTO": return selectedDepartmentId ? { targetType: "DEPARTAMENTO", departmentId: selectedDepartmentId } : null;
      case "SETOR": return selectedSectorId ? { targetType: "SETOR", sectorId: selectedSectorId } : null;
      case "CARGO": return selectedPositionId ? { targetType: "CARGO", positionId: selectedPositionId } : null;
      case "GRUPO": return groupKey ? { targetType: "GRUPO", groupKey } : null;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const target = buildTarget();
    if (!target) { setError("Selecione o público-alvo da publicação."); return; }

    setError(null);
    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await PublicationsService.update(id, {
          title, subtitle: subtitle || undefined, content, category,
          expiresAt: expiresAt || null, targets: [target],
        });
        navigate("/admin/publicacoes");
      } else {
        const created = await PublicationsService.create({
          title, subtitle: subtitle || undefined, content, category,
          expiresAt: expiresAt || undefined, targets: [target],
        });
        navigate(`/admin/publicacoes/${created.id}/editar`);
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível salvar a publicação."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageUpload(file: File) {
    if (!id) return;
    setIsUploadingImage(true);
    try {
      const updated = await PublicationsService.uploadFeaturedImage(id, file);
      setFeaturedImageUrl(updated.featuredImageUrl);
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível enviar a imagem."));
    } finally {
      setIsUploadingImage(false);
    }
  }

  if (isLoading) return <p className="text-sm text-brand-700/60">Carregando...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">{isEditMode ? "Editar Publicação" : "Nova Publicação"}</h1>
        <p className="text-sm text-brand-700/60">Toda publicação nasce como rascunho — publique, agende ou arquive na listagem.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-black/5 bg-white p-6">
        {error ? <div className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-500">{error}</div> : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Título</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Subtítulo</label>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Conteúdo</label>
          <textarea required rows={6} value={content} onChange={(e) => setContent(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-900">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as PublicationCategory)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-900">Data de expiração (opcional)</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Imagem de destaque</label>
          {!isEditMode ? (
            <p className="rounded-lg border border-dashed border-black/10 px-4 py-3 text-xs text-brand-700/50">
              Salve a publicação primeiro para poder enviar uma imagem.
            </p>
          ) : (
            <>
              {featuredImageUrl ? (
                <img src={featuredImageUrl} alt="Imagem de destaque" className="mb-2 h-40 w-full rounded-lg object-cover" />
              ) : null}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-4 text-sm text-brand-700/70 hover:bg-brand-50">
                <UploadCloud size={16} />
                {isUploadingImage ? "Enviando..." : "Selecionar imagem"}
                <input type="file" accept="image/*" className="hidden" disabled={isUploadingImage} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              </label>
            </>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Público-alvo</label>
          <select value={targetType} onChange={(e) => setTargetType(e.target.value as PublicationTargetType)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
            {TARGET_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {targetType === "UNIDADE" ? (
          <select required value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="">Selecione uma unidade...</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        ) : null}

        {targetType === "DEPARTAMENTO" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <select value={filterUnitId} onChange={(e) => { setFilterUnitId(e.target.value); setSelectedDepartmentId(""); }} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="">Todas as unidades</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select required value={selectedDepartmentId} onChange={(e) => setSelectedDepartmentId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="">Selecione um departamento...</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        ) : null}

        {targetType === "SETOR" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <select value={filterUnitId} onChange={(e) => { setFilterUnitId(e.target.value); setFilterDepartmentId(""); }} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="">Todas</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={filterDepartmentId} onChange={(e) => setFilterDepartmentId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="">Todos</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select required value={selectedSectorId} onChange={(e) => setSelectedSectorId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="">Selecione...</option>
              {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        ) : null}

        {targetType === "CARGO" ? (
          <select required value={selectedPositionId} onChange={(e) => setSelectedPositionId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="">Selecione um cargo...</option>
            {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        ) : null}

        {targetType === "GRUPO" ? (
          <input required value={groupKey} onChange={(e) => setGroupKey(e.target.value)} placeholder="ex: enfermagem-noturno" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {isSubmitting ? "Salvando..." : isEditMode ? "Salvar alterações" : "Criar Publicação"}
          </button>
        </div>
      </form>
    </div>
  );
}
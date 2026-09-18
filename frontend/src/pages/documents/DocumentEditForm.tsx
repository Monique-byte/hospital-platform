import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DocumentsService } from "@/services/documents.service";
import { DocumentCategory, DocumentDetail } from "@/types";
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

/**
 * Edicao de metadados de um documento existente (PATCH /documentos/:id).
 * Nao altera publico-alvo (targets) nesta tela - o formulario original
 * (DocumentForm) so cria um unico target por vez; manter a mesma
 * limitacao aqui evita reescrever a regra de publico-alvo sem um
 * seletor em cascata adequado (melhoria futura documentada).
 */
export function DocumentEditForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("POLITICA");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    DocumentsService.getById(id)
      .then((data) => {
        setDoc(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setCategory(data.category);
        setTags(data.tags.join(", "));
      })
      .catch((err) => setError(extractErrorMessage(err, "Não foi possível carregar o documento.")))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await DocumentsService.update(id, {
        title,
        description: description || undefined,
        category,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      navigate(`/documentos/${id}`);
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível salvar as alterações."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <p className="text-sm text-brand-700/60">Carregando...</p>;
  if (!doc) return <p className="text-sm text-danger-500">{error ?? "Documento não encontrado."}</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Editar Documento</h1>
        <p className="text-sm text-brand-700/60">Atualize as informações do documento (a versão do arquivo é gerenciada na tela de detalhes).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-black/5 bg-white p-6">
        {error ? <div className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-500">{error}</div> : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Título</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-900">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700"
          />
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
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(`/documentos/${id}`)} className="rounded-lg border border-black/10 px-5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
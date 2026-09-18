import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { DocumentsService } from "@/services/documents.service";
import { triggerBrowserDownload } from "@/lib/downloadFile";
import { DocumentCategory, DocumentListItem } from "@/types";
import { PermissionGate } from "@/components/PermissionGate";
import { DocumentStatusBadge } from "./components/DocumentStatusBadge";
import { DocumentCategoryBadge } from "./components/DocumentCategoryBadge";
import { getFileKindIcon } from "./components/DocumentFileIcon";
import { describeDocumentTarget } from "./utils/describeTarget";

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS: { value: DocumentCategory | ""; label: string }[] = [
  { value: "", label: "Todas as categorias" },
  { value: "POLITICA", label: "Política" },
  { value: "PROCEDIMENTO", label: "Procedimento" },
  { value: "MANUAL", label: "Manual" },
  { value: "REGULAMENTO", label: "Regulamento" },
  { value: "FORMULARIO", label: "Formulário" },
  { value: "COMUNICADO", label: "Comunicado" },
  { value: "NORMA", label: "Norma" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      DocumentsService.list({
        search: search || undefined,
        category: category || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
        .then((data) => {
          setItems(data.items);
          setTotal(data.total);
        })
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, category, page]);

  async function handleDownload(doc: DocumentListItem) {
    if (!doc.currentVersion) return;
    setDownloadingId(doc.id);
    try {
      const { blob, filename } = await DocumentsService.download(doc.id, doc.currentVersion.id, doc.currentVersion.originalName);
      triggerBrowserDownload(blob, filename);
    } finally {
      setDownloadingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-900">Documentos</h1>
          <p className="text-sm text-brand-700/60">Gestão eletrônica de documentos do hospital.</p>
        </div>

        <PermissionGate permission="documentos:create">
          <Link
            to="/documentos/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Plus size={16} />
            Novo Documento
          </Link>
        </PermissionGate>
      </div>

      <div className="grid gap-3 rounded-xl border border-black/5 bg-white p-4 sm:grid-cols-3">
        <div className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2">
          <Search size={16} className="text-brand-700/40" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Título do documento..."
            className="w-full text-sm outline-none"
          />
        </div>

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value as DocumentCategory | ""); setPage(1); }}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs font-medium uppercase tracking-wide text-brand-700/60">
            <tr>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3 hidden md:table-cell">Categoria</th>
              <th className="px-4 py-3 hidden lg:table-cell">Versão</th>
              <th className="px-4 py-3 hidden lg:table-cell">Público-alvo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-700/50">Carregando...</td></tr>
            ) : null}

            {!isLoading && items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-700/50">Nenhum documento encontrado.</td></tr>
            ) : null}

            {!isLoading && items.map((doc) => {
              const currentVersion = doc.currentVersion;
              const Icon = currentVersion ? getFileKindIcon(currentVersion.mimeType) : null;
              const audience = doc.targets[0] ? describeDocumentTarget(doc.targets[0]) : null;
              const extraTargets = doc.targets.length - 1;

              return (
                <tr key={doc.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3">
                    <Link to={`/documentos/${doc.id}`} className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                        {Icon ? <Icon size={16} /> : null}
                      </div>
                      <div>
                        <p className="font-medium text-brand-900">{doc.title}</p>
                        {doc.tags.length > 0 ? (
                          <p className="text-xs text-brand-700/50">{doc.tags.join(", ")}</p>
                        ) : null}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><DocumentCategoryBadge category={doc.category} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-brand-700/80">
                    {currentVersion ? <span>v{currentVersion.versionNumber} · {formatSize(currentVersion.sizeBytes)}</span> : <span>—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-brand-700/70">
                    {audience ? (
                      <span>{audience}{extraTargets > 0 ? ` +${extraTargets}` : ""}</span>
                    ) : <span>—</span>}
                  </td>
                  <td className="px-4 py-3"><DocumentStatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {currentVersion ? (
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="text-brand-700 hover:text-brand-900 disabled:opacity-40"
                          title="Baixar versão atual"
                        >
                          {downloadingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        </button>
                      ) : null}
                      <Link to={`/documentos/${doc.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                        Ver detalhes
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-sm text-brand-700/60">
          <span>{total} documento(s) encontrado(s)</span>
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
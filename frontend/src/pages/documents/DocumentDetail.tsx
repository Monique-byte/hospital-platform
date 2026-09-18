import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, UploadCloud, Archive, RotateCcw, Trash2, Pencil, Loader2 } from "lucide-react";
import { DocumentsService } from "@/services/documents.service";
import { triggerBrowserDownload } from "@/lib/downloadFile";
import { DocumentDetail as DocumentDetailType } from "@/types";
import { extractErrorMessage } from "@/services/api";
import { PermissionGate } from "@/components/PermissionGate";
import { DocumentStatusBadge } from "./components/DocumentStatusBadge";
import { DocumentCategoryBadge } from "./components/DocumentCategoryBadge";
import { describeDocumentTarget } from "./utils/describeTarget";
import { useDocumentPreviewUrl } from "./hooks/useDocumentPreviewUrl";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);

  function reload() {
    if (!id) return;
    setIsLoading(true);
    DocumentsService.getById(id)
      .then((data) => setDoc(data))
      .catch((err) => setLoadError(extractErrorMessage(err, "Não foi possível carregar o documento.")))
      .finally(() => setIsLoading(false));
  }

  useEffect(reload, [id]);

  const currentVersion = doc?.currentVersion ?? null;
  const previewUrl = useDocumentPreviewUrl(doc?.id, currentVersion?.id, currentVersion?.mimeType);

  async function handleDownload(versionId: string, versionOriginalName: string) {
    if (!doc) return;
    setDownloadingVersionId(versionId);
    try {
      const { blob, filename } = await DocumentsService.download(doc.id, versionId, versionOriginalName);
      triggerBrowserDownload(blob, filename);
    } finally {
      setDownloadingVersionId(null);
    }
  }

  async function handleAddVersion() {
    if (!id || !newVersionFile) return;
    setActionError(null);
    setIsUploadingVersion(true);
    try {
      const updated = await DocumentsService.addVersion(id, newVersionFile, changeNote || undefined);
      setDoc(updated);
      setNewVersionFile(null);
      setChangeNote("");
    } catch (err) {
      setActionError(extractErrorMessage(err, "Não foi possível enviar a nova versão."));
    } finally {
      setIsUploadingVersion(false);
    }
  }

  async function handleArchive() {
    if (!id) return;
    setActionError(null);
    try { setDoc(await DocumentsService.archive(id)); }
    catch (err) { setActionError(extractErrorMessage(err, "Não foi possível arquivar o documento.")); }
  }

  async function handleActivate() {
    if (!id) return;
    setActionError(null);
    try { setDoc(await DocumentsService.activate(id)); }
    catch (err) { setActionError(extractErrorMessage(err, "Não foi possível reativar o documento.")); }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Excluir este documento e todas as suas versões permanentemente?")) return;
    setActionError(null);
    try {
      await DocumentsService.remove(id);
      navigate("/documentos");
    } catch (err) {
      setActionError(extractErrorMessage(err, "Não foi possível excluir o documento."));
    }
  }

  if (isLoading) return <p className="text-sm text-brand-700/60">Carregando...</p>;
  if (loadError || !doc) return <p className="text-sm text-danger-500">{loadError ?? "Documento não encontrado."}</p>;

  const showNewVersionForm = doc.status === "ATIVO";
  const showArchiveButton = doc.status === "ATIVO";
  const showActivateButton = doc.status === "ARQUIVADO";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate("/documentos")} className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900">
        <ArrowLeft size={16} />
        Voltar para documentos
      </button>

      {actionError ? <div className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-500">{actionError}</div> : null}

      <div className="rounded-xl border border-black/5 bg-white p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <DocumentCategoryBadge category={doc.category} />
          <DocumentStatusBadge status={doc.status} />
        </div>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-brand-900">{doc.title}</h1>
          {doc.status === "ATIVO" ? (
            <PermissionGate permission="documentos:edit">
              <Link
                to={`/documentos/${doc.id}/editar`}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                <Pencil size={14} /> Editar
              </Link>
            </PermissionGate>
          ) : null}
        </div>

        {doc.description ? <p className="mt-2 text-brand-700/70">{doc.description}</p> : null}

        {doc.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {doc.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">{tag}</span>
            ))}
          </div>
        ) : null}

        {/* Indicador visual de publico-alvo/permissao - meramente informativo, a autorizacao real e sempre do backend */}
        {doc.targets.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700/40">Visível para</p>
            <div className="flex flex-wrap gap-2">
              {doc.targets.map((target) => (
                <span key={target.id} className="rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-medium text-accent-600">
                  {describeDocumentTarget(target)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-3 text-xs text-brand-700/50">Enviado por {doc.author.name} em {formatDate(doc.createdAt)}</p>

        {previewUrl ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-black/5 bg-brand-50">
            <img src={previewUrl} alt={doc.title} className="max-h-[420px] w-full object-contain" />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          {currentVersion ? (
            <button
              onClick={() => handleDownload(currentVersion.id, currentVersion.originalName)}
              disabled={downloadingVersionId === currentVersion.id}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {downloadingVersionId === currentVersion.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Baixar versão atual (v{currentVersion.versionNumber})
            </button>
          ) : null}

          {showArchiveButton ? (
            <PermissionGate permission="documentos:archive">
              <button onClick={handleArchive} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
                <Archive size={16} /> Arquivar
              </button>
            </PermissionGate>
          ) : null}

          {showActivateButton ? (
            <PermissionGate permission="documentos:activate">
              <button onClick={handleActivate} className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
                <RotateCcw size={16} /> Reativar
              </button>
            </PermissionGate>
          ) : null}

          <PermissionGate permission="documentos:delete">
            <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-lg border border-danger-500/30 px-4 py-2 text-sm font-medium text-danger-500 hover:bg-danger-500/5">
              <Trash2 size={16} /> Excluir
            </button>
          </PermissionGate>
        </div>
      </div>

      {showNewVersionForm ? (
        <PermissionGate permission="documentos:edit">
          <div className="rounded-xl border border-black/5 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-brand-900">Enviar nova versão</h2>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-4 text-sm text-brand-700/70 hover:bg-brand-50">
                <UploadCloud size={16} />
                {newVersionFile ? newVersionFile.name : "Selecionar arquivo"}
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="hidden"
                  onChange={(e) => setNewVersionFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <input
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="O que mudou nesta versão? (opcional)"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-700"
              />
              <button
                onClick={handleAddVersion}
                disabled={!newVersionFile || isUploadingVersion}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
              >
                {isUploadingVersion ? "Enviando..." : "Enviar nova versão"}
              </button>
            </div>
          </div>
        </PermissionGate>
      ) : null}

      <div className="rounded-xl border border-black/5 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-brand-900">Histórico de versões</h2>
        <div className="divide-y divide-black/5">
          {doc.versions.map((version) => (
            <div key={version.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-brand-900">
                  v{version.versionNumber} — {version.originalName}
                  {currentVersion && currentVersion.id === version.id ? (
                    <span className="ml-2 rounded-full bg-accent-500/10 px-2 py-0.5 text-xs font-semibold text-accent-600">Atual</span>
                  ) : null}
                </p>
                <p className="text-xs text-brand-700/50">
                  {formatSize(version.sizeBytes)} · {version.author.name} · {formatDate(version.createdAt)}
                  {version.changeNote ? <> · {version.changeNote}</> : null}
                </p>
              </div>
              <button
                onClick={() => handleDownload(version.id, version.originalName)}
                disabled={downloadingVersionId === version.id}
                className="shrink-0 text-brand-700 hover:text-brand-900 disabled:opacity-40"
                title="Baixar esta versão"
              >
                {downloadingVersionId === version.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
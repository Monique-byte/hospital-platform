import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Send, CalendarClock, Archive } from "lucide-react";
import { PublicationsService } from "@/services/publications.service";
import { PublicationListItem, PublicationStatus } from "@/types";
import { PermissionGate } from "@/components/PermissionGate";
import { extractErrorMessage } from "@/services/api";

const STATUS_LABEL: Record<PublicationStatus, string> = {
  RASCUNHO: "Rascunho", AGENDADA: "Agendada", PUBLICADA: "Publicada", EXPIRADA: "Expirada", ARQUIVADA: "Arquivada",
};

/** Listagem administrativa de Publicacoes - usuario com permissao de gestao ve todos os status (backend ja diferencia isso automaticamente). */
export function PublicationAdminList() {
  const [items, setItems] = useState<PublicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setIsLoading(true);
    PublicationsService.list({ page: 1, pageSize: 50 })
      .then((data) => setItems(data.items))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(reload, []);

  async function handlePublish(id: string) {
    await PublicationsService.publish(id);
    reload();
  }
  async function handleArchive(id: string) {
    await PublicationsService.archive(id);
    reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-900">Publicações</h1>
          <p className="text-sm text-brand-700/60">Gestão de notícias, comunicados e avisos do portal público.</p>
        </div>
        <PermissionGate permission="publicacoes:create">
          <Link to="/admin/publicacoes/nova" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            <Plus size={16} /> Nova Publicação
          </Link>
        </PermissionGate>
      </div>

      {error ? <div className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-500">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs font-medium uppercase tracking-wide text-brand-700/60">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {isLoading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-700/50">Carregando...</td></tr> : null}
            {!isLoading && items.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-700/50">Nenhuma publicação encontrada.</td></tr> : null}
            {!isLoading && items.map((pub) => (
              <tr key={pub.id} className="hover:bg-brand-50/50">
                <td className="px-4 py-3"><Link to={`/admin/publicacoes/${pub.id}/editar`} className="font-medium text-brand-900 hover:underline">{pub.title}</Link></td>
                <td className="px-4 py-3 text-brand-700/70">{pub.category}</td>
                <td className="px-4 py-3 text-brand-700/70">{STATUS_LABEL[pub.effectiveStatus]}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    {pub.status === "RASCUNHO" ? (
                      <PermissionGate permission="publicacoes:publish">
                        <button onClick={() => handlePublish(pub.id)} title="Publicar" className="text-brand-700 hover:text-brand-900"><Send size={16} /></button>
                      </PermissionGate>
                    ) : null}
                    {(pub.status === "PUBLICADA" || pub.status === "AGENDADA") ? (
                      <PermissionGate permission="publicacoes:archive">
                        <button onClick={() => handleArchive(pub.id)} title="Arquivar" className="text-brand-700 hover:text-brand-900"><Archive size={16} /></button>
                      </PermissionGate>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
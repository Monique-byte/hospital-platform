import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { PublicationsService } from "@/services/publications.service";
import { PublicationCategory, PublicationListItem } from "@/types";
import { SectionTitle } from "@/components/public/SectionTitle";
import { LoadingState } from "@/components/public/LoadingState";
import { EmptyState } from "@/components/public/EmptyState";
import { ErrorState } from "@/components/public/ErrorState";
import { PublicationGrid } from "./components/PublicationGrid";

const PAGE_SIZE = 9;

const CATEGORY_OPTIONS: { value: PublicationCategory | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "NOTICIA", label: "Notícia" },
  { value: "COMUNICADO", label: "Comunicado" },
  { value: "AVISO", label: "Aviso" },
  { value: "EVENTO", label: "Evento" },
  { value: "CAMPANHA", label: "Campanha" },
  { value: "INFORMATIVO", label: "Informativo" },
];

/**
 * Le e grava filtros na URL (?search=&category=) - permite link direto
 * (usado pelo footer: /publicacoes?category=AVISO) e pela busca do
 * header (/publicacoes?search=...). Antes desta correcao, esses links
 * nao tinham efeito porque o estado nao lia a query string.
 */
export function PublicationsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState<PublicationCategory | "">(
    (searchParams.get("category") as PublicationCategory | null) ?? ""
  );
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<PublicationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = "Notícias | Hospital Santo Antônio";
  }, []);

  // Reage a mudancas externas na URL (ex.: clique em link do footer/header
  // enquanto ja se esta em /publicacoes).
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setCategory((searchParams.get("category") as PublicationCategory | null) ?? "");
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    const timeout = setTimeout(() => {
      PublicationsService.list({
        search: search || undefined,
        category: category || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
        .then((data) => { setItems(data.items); setTotal(data.total); })
        .catch(() => setError(true))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, category, page, reloadKey]);

  function updateFilters(nextSearch: string, nextCategory: PublicationCategory | "") {
    setSearch(nextSearch);
    setCategory(nextCategory);
    setPage(1);
    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextCategory) params.set("category", nextCategory);
    setSearchParams(params, { replace: true });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="animate-[fadeInUp_0.3s_ease-out] space-y-6">
      <SectionTitle title="Notícias e publicações" subtitle="Comunicados, avisos, campanhas e informativos do hospital" />

      <div className="space-y-3 rounded-xl border border-black/5 bg-white p-4">
        <div className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 transition-colors focus-within:border-brand-700">
          <Search size={16} className="text-brand-700/40" />
          <input
            value={search}
            onChange={(e) => updateFilters(e.target.value, category)}
            placeholder="Buscar por título..."
            className="w-full text-sm outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilters(search, opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                category === opt.value ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message="Não foi possível carregar as publicações." onRetry={() => setReloadKey((k) => k + 1)} />}
      {!isLoading && !error && items.length === 0 && <EmptyState message="Nenhuma publicação encontrada." />}

      {!isLoading && !error && items.length > 0 && (
        <>
          <PublicationGrid items={items} />
          <div className="flex items-center justify-between border-t border-black/5 pt-4 text-sm text-brand-700/60">
            <span>{total} publicação(ões) encontrada(s)</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-black/10 px-3 py-1.5 transition-colors hover:bg-brand-50 disabled:opacity-40 disabled:hover:bg-transparent">Anterior</button>
              <span>Página {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-black/10 px-3 py-1.5 transition-colors hover:bg-brand-50 disabled:opacity-40 disabled:hover:bg-transparent">Próxima</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
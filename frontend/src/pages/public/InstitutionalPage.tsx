import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getInstitutionalPage } from "@/data/institutionalPages";

export function InstitutionalPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getInstitutionalPage(slug) : null;

  useEffect(() => { if (page) document.title = `${page.title} | Hospital Santo Antônio`; }, [page]);

  if (!page) return <Navigate to="/" replace />;

  return (
    <article className="mx-auto max-w-3xl animate-[fadeInUp_0.3s_ease-out] space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition-colors hover:text-brand-900">
        <ArrowLeft size={16} /> Voltar para o início
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">{page.title}</h1>
        <p className="text-brand-700/60">{page.summary}</p>
      </header>

      {page.content && page.content.length > 0 ? (
        <div className="space-y-4 text-sm leading-relaxed text-brand-700/80 md:text-base">
          {page.content.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-6 text-sm leading-relaxed text-brand-700/70">
          <p>Este conteúdo ainda está em atualização. Assim que as informações oficiais desta seção forem disponibilizadas pela instituição, elas serão publicadas aqui.</p>
        </div>
      )}
    </article>
  );
}
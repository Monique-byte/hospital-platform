import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ImageOff } from "lucide-react";
import axios from "axios";
import { PublicationsService } from "../../services/publications.service";
import { PublicationDetail as PublicationDetailType } from "@/types";
import { CategoryBadge } from "./components/CategoryBadge";
import { LoadingState } from "../../components/public/LoadingState";
import { ErrorState } from "../../components/public/ErrorState";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Detalhe publico de uma publicacao (/publicacoes/:id). Consome GET
 * /publicacoes/:id sem autenticacao. Se o backend retornar 404
 * (publicacao inexistente, nao publicada, ou fora do publico-alvo do
 * visitante - protecao anti-IDOR ja implementada no backend), exibimos
 * "nao encontrada" - nao tentamos distinguir os casos, pois o backend
 * intencionalmente nao diferencia (evita vazar existencia de conteudo
 * restrito).
 */
export function PublicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [publication, setPublication] = useState<PublicationDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(false);
    setNotFound(false);
    PublicationsService.getById(id)
      .then((data) => {
        setPublication(data);
        document.title = `${data.title} | Hospital Santo Antônio`;
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, [id, reloadKey]);

  if (isLoading) return <LoadingState variant="detail" />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-lg font-semibold text-brand-900">Publicação não encontrada.</p>
        <p className="text-sm text-brand-700/60">
          O conteúdo pode ter sido removido, arquivado ou não está mais disponível.
        </p>
        <Link
          to="/publicacoes"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          <ArrowLeft size={16} /> Voltar para notícias
        </Link>
      </div>
    );
  }

  if (error || !publication) {
    return (
      <ErrorState
        message="Não foi possível carregar esta publicação."
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  const date = formatDate(publication.publishedAt ?? publication.createdAt);
  const paragraphs = publication.content.split(/\n+/).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link to="/publicacoes" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900">
        <ArrowLeft size={16} /> Voltar para notícias
      </Link>

      <header className="space-y-3">
        <CategoryBadge category={publication.category} />
        <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">{publication.title}</h1>
        {publication.subtitle && (
          <p className="text-lg text-brand-700/70">{publication.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-700/50">
          {date && <span>{date}</span>}
          <span>Por {publication.author.name}</span>
        </div>
      </header>

      <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-brand-50">
        {publication.featuredImageUrl ? (
          <img
            src={publication.featuredImageUrl}
            alt={publication.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-300">
            <ImageOff size={40} />
          </div>
        )}
      </div>

      {/*
        O conteudo e armazenado como texto simples (content: string no
        backend, sem indicacao de formato HTML nem biblioteca de
        sanitizacao no projeto) - renderizado como paragrafos de texto
        puro (React escapa automaticamente), nunca via
        dangerouslySetInnerHTML.
      */}
      <div className="space-y-4 text-base leading-relaxed text-brand-900/90">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {publication.attachments.length > 0 && (
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-brand-900">Anexos</p>
          {/*
            Endpoint publico de download de anexos ainda nao confirmado
            no backend (storagePath nao e necessariamente uma URL
            acessivel) - exibindo somente os nomes, sem link, ate que
            isso seja definido.
          */}
          <ul className="space-y-1 text-sm text-brand-700/70">
            {publication.attachments.map((attachment) => (
              <li key={attachment.id}>{attachment.originalName}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
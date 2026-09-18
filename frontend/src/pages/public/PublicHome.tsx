import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Newspaper, ShieldCheck, UserRound } from "lucide-react";
import { PublicationsService } from "@/services/publications.service";
import { PublicationListItem } from "@/types";
import { SPECIALTIES } from "@/data/specialties";
import { siteConfig } from "@/data/siteConfig";
import { FullBleed } from "@/components/public/FullBleed";
import { SectionTitle } from "@/components/public/SectionTitle";
import { LoadingState } from "@/components/public/LoadingState";
import { EmptyState } from "@/components/public/EmptyState";
import { ErrorState } from "@/components/public/ErrorState";
import { PublicationCard } from "./components/PublicationCard";
import { PublicationGrid } from "./components/PublicationGrid";
import { SpecialtyCard } from "./components/SpecialtyCard";

const HOME_PUBLICATIONS_COUNT = 6;
const HOME_SPECIALTIES_COUNT = 4;

export function PublicHome() {
  const [items, setItems] = useState<PublicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => { document.title = "Início | Hospital Santo Antônio"; }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    PublicationsService.list({ page: 1, pageSize: HOME_PUBLICATIONS_COUNT })
      .then((data) => setItems(data.items))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [reloadKey]);

  const [featured, secondary1, secondary2, ...rest] = items;
  const secondaries = [secondary1, secondary2].filter(Boolean) as PublicationListItem[];

  return (
    <div className="space-y-16">
      {/* HERO - borda a borda, com suporte a imagem de fundo (siteConfig.heroImageUrl) */}
      <FullBleed>
        <div
          className="relative flex min-h-[440px] items-center overflow-hidden bg-brand-700 md:min-h-[520px]"
          style={siteConfig.heroImageUrl ? { backgroundImage: `url(${siteConfig.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {siteConfig.heroImageUrl ? <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/50 to-brand-900/20" /> : null}
          <div className="relative mx-auto w-full max-w-7xl px-4 py-16 text-white sm:px-6 lg:px-8">
            <div className="max-w-2xl animate-[fadeInUp_0.4s_ease-out] space-y-5">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                Portal Institucional
              </span>
              <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
                Cuidado, confiança e humanização em cada atendimento.
              </h1>
              <p className="text-base text-brand-100/90 md:text-lg">
                Acompanhe as notícias, comunicados e campanhas do Hospital Santo
                Antônio. Informação clara e acessível para pacientes, familiares
                e comunidade.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/publicacoes" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 transition-transform hover:scale-[1.03] hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700">
                  Ver notícias <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700">
                  Área do Funcionário
                </Link>
              </div>
            </div>
          </div>
        </div>
      </FullBleed>

      {/* SOBRE - suporte a imagem futura (siteConfig.aboutImageUrl) */}
      <section id="sobre" className="scroll-mt-24 grid animate-[fadeInUp_0.35s_ease-out] gap-8 rounded-2xl border border-black/5 bg-white p-6 md:grid-cols-3 md:p-10">
        <div className="md:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-brand-900 md:text-xl">Sobre o Hospital Santo Antônio</h2>
          <p className="text-sm leading-relaxed text-brand-700/70 md:text-base">
            O Hospital Santo Antônio mantém este portal como canal oficial de
            comunicação com pacientes, acompanhantes, familiares e a
            comunidade. Aqui você encontra notícias, comunicados, avisos e
            campanhas divulgados pela instituição.
          </p>
          <p className="text-sm leading-relaxed text-brand-700/70 md:text-base">
            Colaboradores do hospital contam ainda com uma área interna
            exclusiva, com acesso mediante login, para funcionalidades
            administrativas e de gestão.
          </p>
        </div>
        {siteConfig.aboutImageUrl ? (
          <div className="overflow-hidden rounded-xl">
            <img src={siteConfig.aboutImageUrl} alt={siteConfig.aboutImageAlt} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-700 text-white">
              <ShieldCheck size={20} />
            </div>
            <p className="text-sm text-brand-800">
              Acesso público sem cadastro. Nenhuma informação pessoal é
              solicitada para consultar as notícias do hospital.
            </p>
          </div>
        )}
      </section>

      {/* ESPECIALIDADES */}
      <section id="especialidades" className="scroll-mt-24 animate-[fadeInUp_0.35s_ease-out] space-y-5">
        <SectionTitle title="Especialidades e Serviços" subtitle="Consulte com médicos e profissionais especialistas no HSA" viewAllHref="/especialidades" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALTIES.slice(0, HOME_SPECIALTIES_COUNT).map((specialty) => (
            <SpecialtyCard key={specialty.slug} specialty={specialty} />
          ))}
        </div>
      </section>

      {/* NOTICIAS - layout editorial: destaque + secundarias + grid */}
      <section className="animate-[fadeInUp_0.35s_ease-out]">
        <SectionTitle title="Notícias em destaque" subtitle="Últimas publicações do hospital" viewAllHref="/publicacoes" />

        {isLoading ? <LoadingState /> : null}
        {!isLoading && error ? <ErrorState message="Não foi possível carregar as notícias." onRetry={() => setReloadKey((k) => k + 1)} /> : null}
        {!isLoading && !error && items.length === 0 ? <EmptyState /> : null}

        {!isLoading && !error && items.length > 0 ? (
          <div className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PublicationCard publication={featured} variant="featured" />
              </div>
              {secondaries.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {secondaries.map((p) => <PublicationCard key={p.id} publication={p} variant="secondary" />)}
                </div>
              ) : null}
            </div>
            {rest.length > 0 ? <PublicationGrid items={rest} /> : null}
          </div>
        ) : null}
      </section>

      {/* ACESSO RAPIDO */}
      <section className="grid animate-[fadeInUp_0.35s_ease-out] gap-4 sm:grid-cols-3">
        <div className="group rounded-xl border border-black/5 bg-white p-6 transition-shadow hover:shadow-md">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700"><Newspaper size={20} /></div>
          <p className="font-medium text-brand-900">Notícias e comunicados</p>
          <p className="mt-1 text-sm text-brand-700/60">Fique por dentro de avisos, campanhas e informativos do hospital.</p>
          <Link to="/publicacoes" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-all group-hover:gap-2">
            Ver todas as publicações <ArrowRight size={14} />
          </Link>
        </div>

        <div className="group rounded-xl border border-black/5 bg-white p-6 transition-shadow hover:shadow-md">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700"><ShieldCheck size={20} /></div>
          <p className="font-medium text-brand-900">Especialidades</p>
          <p className="mt-1 text-sm text-brand-700/60">Conheça as áreas de atendimento médico do hospital.</p>
          <Link to="/especialidades" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-all group-hover:gap-2">
            Ver especialidades <ArrowRight size={14} />
          </Link>
        </div>

        <div className="group rounded-xl border border-black/5 bg-white p-6 transition-shadow hover:shadow-md">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700"><UserRound size={20} /></div>
          <p className="font-medium text-brand-900">Área do Funcionário</p>
          <p className="mt-1 text-sm text-brand-700/60">Colaboradores acessam o sistema interno com login e senha.</p>
          <Link to="/login" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-all group-hover:gap-2">
            Fazer login <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
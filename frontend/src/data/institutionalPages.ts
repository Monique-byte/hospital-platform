export interface InstitutionalPageConfig {
  slug: string;
  title: string;
  summary: string;
  /** Paragrafos de conteudo real, quando disponiveis. Ausente = mostra placeholder generico. */
  content?: string[];
}

export const INSTITUTIONAL_PAGES: InstitutionalPageConfig[] = [
  { slug: "historia", title: "Nossa História", summary: "A trajetória do Hospital Santo Antônio." },
  { slug: "quem-somos", title: "Quem Somos", summary: "Missão, valores e propósito da instituição." },
  { slug: "organograma", title: "Organograma Institucional", summary: "Estrutura organizacional do hospital." },
  { slug: "direcao-administracao", title: "Direção e Administração", summary: "Corpo diretivo e administrativo." },
  { slug: "planejamento-estrategico", title: "Planejamento Estratégico", summary: "Diretrizes estratégicas da instituição." },
  { slug: "politicas", title: "Políticas Institucionais", summary: "Políticas e normas internas do hospital." },
  { slug: "guia-do-paciente", title: "Guia do Paciente", summary: "Orientações para pacientes e acompanhantes." },
  { slug: "relatorios", title: "Relatórios e Balanços", summary: "Demonstrativos e relatórios institucionais." },
  { slug: "transparencia", title: "Portal da Transparência", summary: "Informações de transparência institucional." },
];

export function getInstitutionalPage(slug: string) {
  return INSTITUTIONAL_PAGES.find((p) => p.slug === slug) ?? null;
}
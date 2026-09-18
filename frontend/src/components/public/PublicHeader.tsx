import { useState, FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { INSTITUTIONAL_PAGES } from "@/data/institutionalPages";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2";
const TRANSITION = "transition-colors duration-150 ease-out";

const TOP_TABS = [
  { to: "/", label: "Institucional", end: true },
  { to: "/especialidades", label: "Especialidades", end: false },
  { to: "/publicacoes", label: "Notícias", end: false },
];

/**
 * Header em duas camadas, inspirado estruturalmente em portais
 * hospitalares institucionais (barra superior fina com abas + barra
 * principal com marca, navegacao, busca e CTA) - conteudo e identidade
 * sao do HSA, nao reproduz texto/abas de nenhum site de terceiros (nao
 * criamos abas para modulos inexistentes no projeto, como "Corpo
 * Clinico" ou "Exames").
 */
export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [institutionalOpen, setInstitutionalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const query = search.trim();
    navigate(query ? `/publicacoes?search=${encodeURIComponent(query)}` : "/publicacoes");
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      {/* Barra superior fina - abas de secao */}
      <div className="hidden border-b border-black/5 bg-brand-50/60 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-6">
          {TOP_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide ${TRANSITION} ${
                  isActive
                    ? "border-brand-700 text-brand-900"
                    : "border-transparent text-brand-700/60 hover:border-brand-300 hover:text-brand-900"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Barra principal */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className={`flex shrink-0 items-center gap-2 rounded-lg ${FOCUS_RING}`} onClick={() => setMobileOpen(false)}>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 font-bold text-white">H</div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none text-brand-900">Hospital Santo Antônio</p>
            <p className="text-xs text-brand-700/60">Portal Institucional</p>
          </div>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-5 text-sm font-medium text-brand-700/80 lg:flex">
          <NavLink to="/" end className={({ isActive }) => `rounded-lg px-1 py-0.5 ${TRANSITION} ${FOCUS_RING} ${isActive ? "text-brand-900" : "hover:text-brand-900"}`}>
            Início
          </NavLink>

          <div className="relative" onMouseEnter={() => setInstitutionalOpen(true)} onMouseLeave={() => setInstitutionalOpen(false)}>
            <button
              type="button"
              onClick={() => setInstitutionalOpen((v) => !v)}
              aria-expanded={institutionalOpen}
              className={`flex items-center gap-1 rounded-lg px-1 py-0.5 hover:text-brand-900 ${TRANSITION} ${FOCUS_RING}`}
            >
              O Hospital <ChevronDown size={14} className={`transition-transform duration-200 ${institutionalOpen ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`absolute left-0 top-full w-64 origin-top rounded-xl border border-black/5 bg-white py-2 shadow-lg transition-all duration-150 ease-out ${
                institutionalOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
              }`}
            >
              {INSTITUTIONAL_PAGES.map((item) => (
                <Link
                  key={item.slug}
                  to={`/institucional/${item.slug}`}
                  onClick={() => setInstitutionalOpen(false)}
                  className={`block px-4 py-2 text-sm text-brand-700/80 hover:bg-brand-50 hover:text-brand-900 ${TRANSITION} ${FOCUS_RING}`}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <NavLink to="/especialidades" className={({ isActive }) => `rounded-lg px-1 py-0.5 ${TRANSITION} ${FOCUS_RING} ${isActive ? "text-brand-900" : "hover:text-brand-900"}`}>
            Especialidades
          </NavLink>
          <NavLink to="/publicacoes" className={({ isActive }) => `rounded-lg px-1 py-0.5 ${TRANSITION} ${FOCUS_RING} ${isActive ? "text-brand-900" : "hover:text-brand-900"}`}>
            Notícias
          </NavLink>
        </nav>

        <form onSubmit={handleSearchSubmit} className="ml-auto hidden max-w-[220px] flex-1 items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 md:flex">
          <Search size={15} className="shrink-0 text-brand-700/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar notícias..."
            aria-label="Pesquisar notícias"
            className="w-full bg-transparent text-sm outline-none placeholder:text-brand-700/40"
          />
        </form>

        <Link to="/login" className={`hidden shrink-0 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 lg:inline-flex ${TRANSITION} ${FOCUS_RING}`}>
          Área do Funcionário
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-brand-700 hover:bg-brand-50 lg:hidden ${TRANSITION} ${FOCUS_RING}`}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Menu mobile */}
      <div
        className={`overflow-hidden border-t border-black/5 bg-white transition-[max-height] duration-200 ease-out lg:hidden ${
          mobileOpen ? "max-h-[80vh]" : "max-h-0 border-t-0"
        }`}
      >
        <div className="thin-scrollbar max-h-[80vh] overflow-y-auto px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="mb-3 flex items-center gap-2 rounded-full border border-black/10 px-3 py-2">
            <Search size={16} className="text-brand-700/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar notícias..."
              aria-label="Pesquisar notícias"
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>
          <ul className="flex flex-col gap-1">
            <li>
              <NavLink to="/" end onClick={() => setMobileOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${TRANSITION} ${FOCUS_RING} ${isActive ? "bg-brand-50 text-brand-900" : "text-brand-700/80 hover:bg-brand-50"}`}>
                Início
              </NavLink>
            </li>
            <li className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-brand-700/40">O Hospital</li>
            {INSTITUTIONAL_PAGES.map((item) => (
              <li key={item.slug}>
                <Link to={`/institucional/${item.slug}`} onClick={() => setMobileOpen(false)} className={`block rounded-lg px-3 py-2 text-sm text-brand-700/80 hover:bg-brand-50 ${TRANSITION} ${FOCUS_RING}`}>
                  {item.title}
                </Link>
              </li>
            ))}
            <li>
              <NavLink to="/especialidades" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${TRANSITION} ${FOCUS_RING} ${isActive ? "bg-brand-50 text-brand-900" : "text-brand-700/80 hover:bg-brand-50"}`}>
                Especialidades
              </NavLink>
            </li>
            <li>
              <NavLink to="/publicacoes" onClick={() => setMobileOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${TRANSITION} ${FOCUS_RING} ${isActive ? "bg-brand-50 text-brand-900" : "text-brand-700/80 hover:bg-brand-50"}`}>
                Notícias
              </NavLink>
            </li>
            <li>
              <Link to="/login" onClick={() => setMobileOpen(false)} className={`mt-1 block rounded-full bg-brand-700 px-3 py-2 text-center text-sm font-semibold text-white ${TRANSITION} ${FOCUS_RING}`}>
                Área do Funcionário
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
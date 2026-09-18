import { Link } from "react-router-dom";
import { INSTITUTIONAL_PAGES } from "@/data/institutionalPages";

export function PublicFooter() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4 md:px-6">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-sm font-bold text-white">H</div>
            <p className="font-semibold text-brand-900">Hospital Santo Antônio</p>
          </div>
          <p className="text-sm text-brand-700/60">
            Portal institucional — notícias, comunicados e informações públicas do hospital.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-brand-900">Navegação</p>
          <ul className="space-y-2 text-sm text-brand-700/70">
            <li><Link to="/" className="hover:text-brand-900">Início</Link></li>
            <li><Link to="/especialidades" className="hover:text-brand-900">Especialidades</Link></li>
            <li><Link to="/publicacoes" className="hover:text-brand-900">Notícias</Link></li>
            <li><Link to="/login" className="hover:text-brand-900">Área do Funcionário</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-brand-900">Institucional</p>
          <ul className="space-y-2 text-sm text-brand-700/70">
            {INSTITUTIONAL_PAGES.slice(0, 4).map((item) => (
              <li key={item.slug}><Link to={`/institucional/${item.slug}`} className="hover:text-brand-900">{item.title}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-brand-900">Governança</p>
          <ul className="space-y-2 text-sm text-brand-700/70">
            {INSTITUTIONAL_PAGES.slice(4).map((item) => (
              <li key={item.slug}><Link to={`/institucional/${item.slug}`} className="hover:text-brand-900">{item.title}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-black/5 px-4 py-4 text-center text-xs text-brand-700/40 md:px-6">
        © {new Date().getFullYear()} Hospital Santo Antônio — Portal Institucional
      </div>
    </footer>
  );
}
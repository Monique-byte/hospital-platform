import { Outlet } from "react-router-dom";
import { PublicHeader } from "./public/PublicHeader";
import { PublicFooter } from "./public/PublicFooter";
import { BackToTop } from "./public/BackToTop";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <PublicHeader />
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <PublicFooter />
      <BackToTop />
    </div>
  );
}
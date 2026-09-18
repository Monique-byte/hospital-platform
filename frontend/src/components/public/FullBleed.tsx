import { ReactNode } from "react";

/** Faz um bloco ocupar 100% da largura da viewport, ignorando o max-width do container pai. Usado para banners/hero de borda a borda. */
export function FullBleed({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`relative left-1/2 right-1/2 -mx-[50vw] w-screen ${className}`}>{children}</div>;
}
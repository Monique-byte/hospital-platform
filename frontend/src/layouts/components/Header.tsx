import { Search } from "lucide-react";
import { NotificationsPanel } from "./NotificationsPanel";
import { UserMenu } from "./UserMenu";
import { Breadcrumb } from "./Breadcrumb";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-16">
        <div className="flex-1 min-w-0">
          <Breadcrumb />
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 w-72 text-brand-700/60">
          <Search size={16} />
          <input
            placeholder="Buscar no sistema..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-brand-700/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <NotificationsPanel />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

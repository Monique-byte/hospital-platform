import { useState, useRef, useEffect } from "react";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = (user?.name || user?.login || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-brand-50 transition-colors"
      >
        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white">
          {initials}
        </div>

        <span className="hidden sm:block text-sm font-medium text-brand-900">
          {user?.name || user?.login}
        </span>

        <ChevronDown size={16} className="text-brand-700/60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-black/5 bg-white py-1 shadow-lg z-20">
          <div className="px-3 py-2 border-b border-black/5">
            <p className="text-sm font-medium text-brand-900">
              {user?.name || user?.login}
            </p>
            <p className="text-xs text-brand-700/60">{user?.email}</p>
          </div>

          <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-brand-900 hover:bg-brand-50">
            <UserIcon size={16} />
            Meu perfil
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-500 hover:bg-brand-50"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

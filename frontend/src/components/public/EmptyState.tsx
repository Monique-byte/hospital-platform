// EmptyState.tsx
import { Newspaper } from "lucide-react";

export function EmptyState({ message = "Nenhuma publicação disponível no momento." }: { message?: string }) {
  return (
    <div className="flex animate-[fadeIn_0.25s_ease-out] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/10 bg-white/50 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
        <Newspaper size={22} />
      </div>
      <p className="text-sm text-brand-700/60">{message}</p>
    </div>
  );
}
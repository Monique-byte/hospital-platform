// ErrorState.tsx
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps { message?: string; onRetry?: () => void; }

export function ErrorState({ message = "Não foi possível carregar o conteúdo.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex animate-[fadeIn_0.25s_ease-out] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-danger-500/30 bg-white/50 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-danger-500/10 text-danger-500">
        <AlertCircle size={22} />
      </div>
      <p className="text-sm text-brand-700/70">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50">
          <RefreshCw size={14} /> Tentar novamente
        </button>
      )}
    </div>
  );
}
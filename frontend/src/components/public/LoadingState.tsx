export function LoadingState({ variant = "grid" }: { variant?: "grid" | "detail" }) {
  const shimmer = "bg-gradient-to-r from-brand-100 via-brand-50 to-brand-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]";
  if (variant === "detail") {
    return (
      <div className="animate-[fadeIn_0.2s_ease-out] space-y-4">
        <div className={`h-6 w-24 rounded ${shimmer}`} />
        <div className={`h-8 w-3/4 rounded ${shimmer}`} />
        <div className={`aspect-[16/9] w-full rounded-xl ${shimmer}`} />
        <div className="space-y-2">
          <div className={`h-4 w-full rounded ${shimmer}`} />
          <div className={`h-4 w-full rounded ${shimmer}`} />
          <div className={`h-4 w-2/3 rounded ${shimmer}`} />
        </div>
      </div>
    );
  }
  return (
    <div className="grid animate-[fadeIn_0.2s_ease-out] gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-black/5 bg-white">
          <div className={`aspect-[16/9] w-full ${shimmer}`} />
          <div className="space-y-2 p-4">
            <div className={`h-4 w-16 rounded ${shimmer}`} />
            <div className={`h-4 w-full rounded ${shimmer}`} />
            <div className={`h-4 w-2/3 rounded ${shimmer}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
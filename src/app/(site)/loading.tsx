export default function SiteLoading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(26,122,110,0.06),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.05),transparent_26%),linear-gradient(180deg,#f7fcfa_0%,#fbf8f5_46%,#e7f3ef_100%)]">
      {/* Hero skeleton */}
      <section className="relative h-[500px] sm:h-[540px] lg:h-[620px] bg-neutral-900/70 animate-pulse" />

      {/* Section skeletons */}
      <div className="container py-10 sm:py-14">
        <div className="h-8 w-64 rounded bg-neutral-200/70 animate-pulse" />
        <div className="mt-4 h-4 w-1/2 rounded bg-neutral-200/60 animate-pulse" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-neutral-200/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Shown instantly on navigation while the product page server-renders.
// Mirrors the skeleton inside ProductDetailClient.
export default function ProductLoading() {
  return (
    <div className="container animate-pulse py-8 sm:py-10">
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="aspect-square rounded-2xl bg-neutral-200" />
        <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur sm:p-8">
          <div className="h-6 w-1/3 rounded bg-neutral-200" />
          <div className="h-4 w-1/2 rounded bg-neutral-200" />
          <div className="h-10 w-32 rounded bg-neutral-200" />
        </div>
      </div>
      <div className="mt-10 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur sm:p-8">
        <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
          <div className="h-8 w-24 rounded-full bg-neutral-200" />
          <div className="h-8 w-28 rounded-full bg-neutral-200" />
          <div className="h-8 w-28 rounded-full bg-neutral-200" />
          <div className="h-8 w-28 rounded-full bg-neutral-200" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-4 w-5/6 rounded bg-neutral-200" />
          <div className="h-4 w-4/6 rounded bg-neutral-200" />
          <div className="h-32 w-full rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

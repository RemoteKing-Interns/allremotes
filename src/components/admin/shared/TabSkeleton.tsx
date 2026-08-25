"use client";

export function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-neutral-200" />
          <div className="h-4 w-64 rounded bg-neutral-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 rounded-lg bg-neutral-200" />
          <div className="h-10 w-32 rounded-lg bg-neutral-200" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-20 rounded bg-neutral-100" />
            <div className="mt-3 h-8 w-28 rounded bg-neutral-200" />
            <div className="mt-2 h-3 w-16 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-32 rounded bg-neutral-200" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-neutral-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-neutral-100" />
                <div className="h-3 w-1/2 rounded bg-neutral-50" />
              </div>
              <div className="h-8 w-20 rounded-lg bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import RealtimeMap from "./RealtimeMap";

export default function RealtimeOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-view", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const sessions: any[] = stats?.sessions || [];
  const active = stats?.activeVisitors ?? 0;

  return (
    <div className="glass-card mb-8 rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {active} visitor{active === 1 ? "" : "s"} online now
            </h2>
            <p className="text-xs text-neutral-500">Realtime overview — city-level geo, IPs are never stored</p>
          </div>
        </div>
        <button onClick={load} className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <RealtimeMap sessions={sessions} />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass-inset lg:col-span-2 overflow-hidden rounded-xl">
          <div className="grid grid-cols-[1fr_80px_90px_110px] bg-white/40 px-3 py-2 text-xs font-semibold uppercase text-neutral-500">
            <span>Current page</span><span>Device</span><span>Source</span><span>Location</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">No active visitors</p>
            ) : sessions.map((s) => (
              <div key={s.id} className="grid grid-cols-[1fr_80px_90px_110px] border-t border-neutral-100 px-3 py-2 text-sm">
                <span className="truncate text-neutral-800" title={s.page}>{s.page}</span>
                <span className="capitalize text-neutral-500">{s.device}</span>
                <span className="truncate text-neutral-500">{s.source}</span>
                <span className="truncate text-neutral-500">{s.location || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-inset rounded-xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">Top pages now</h3>
            {(stats?.topPages || []).slice(0, 5).map((p: any) => (
              <div key={p.path} className="flex justify-between py-1 text-sm">
                <span className="truncate text-neutral-600" title={p.path}>{p.path}</span>
                <span className="font-medium text-neutral-900">{p.views}</span>
              </div>
            ))}
            {!(stats?.topPages || []).length && <p className="text-sm text-neutral-400">—</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(stats?.devices || []).slice(0, 4).map((d: any) => (
              <div key={d.device} className="glass-inset rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-neutral-900">{d.count}</p>
                <p className="text-xs capitalize text-neutral-500">{d.device}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function StoreAnalytics() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/analytics?range=${range}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Analytics request failed");
      setData(j);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [range]);
  useEffect(() => { load(); }, [load]);

  const s = data?.summary || [];
  const cards = [
    ["Users", s[0] || 0], ["Sessions", s[1] || 0], ["Page views", s[2] || 0],
    ["Engagement", `${((s[3] || 0) * 100).toFixed(1)}%`],
    ["Avg. session", `${Math.round(s[4] || 0)}s`], ["New users", s[5] || 0],
  ];
  return (
    <section className="mb-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold text-neutral-900">Website Analytics</h2><p className="text-sm text-neutral-500">Visitors, acquisition, content and ecommerce funnel from GA4</p></div>
        <div className="flex gap-2"><select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-semibold"><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option></select><button onClick={load} className="h-9 w-9 rounded-lg border border-neutral-300"><RefreshCw size={15} className={`mx-auto ${loading ? "animate-spin" : ""}`} /></button></div>
      </div>
      {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><b>GA4 reporting needs configuration.</b><p className="mt-1 break-words">{error}</p><p className="mt-2 text-xs">Set GA4_PROPERTY_ID and grant the existing Google service-account email Viewer access to the GA4 property.</p></div> : loading ? <p className="py-10 text-center text-sm text-neutral-400">Loading analytics…</p> : <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{cards.map(([k,v]) => <div key={String(k)} className="rounded-lg bg-neutral-50 p-3"><p className="text-xs text-neutral-500">{k}</p><p className="mt-1 text-xl font-extrabold">{typeof v === "number" ? v.toLocaleString() : v}</p></div>)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Table title="Top pages" rows={data.pages} labels={["Page", "Views", "Users"]} />
          <Table title="Acquisition" rows={data.sources} labels={["Channel", "Sessions", "Users", "Conversions"]} />
          <Table title="Devices" rows={data.devices} labels={["Device", "Users", "Sessions"]} />
          <Table title="Countries" rows={data.countries} labels={["Country", "Users", "Sessions"]} />
        </div>
        <div className="mt-6"><h3 className="mb-3 font-bold">Ecommerce funnel</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{["view_item","add_to_cart","begin_checkout","purchase"].map((event) => { const row = data.funnel.find((r:any) => r.dimensions[0] === event); return <div key={event} className="rounded-lg border border-neutral-200 p-3"><p className="text-xs capitalize text-neutral-500">{event.replaceAll("_", " ")}</p><p className="text-xl font-bold">{(row?.metrics[0] || 0).toLocaleString()}</p></div>; })}</div></div>
      </>}
    </section>
  );
}

function Table({ title, rows = [], labels }: { title: string; rows: any[]; labels: string[] }) {
  return <div><h3 className="mb-2 font-bold">{title}</h3><div className="overflow-hidden rounded-lg border border-neutral-200"><table className="w-full text-sm"><thead className="bg-neutral-50 text-xs text-neutral-500"><tr>{labels.map((l,i) => <th key={l} className={`px-3 py-2 ${i ? "text-right" : "text-left"}`}>{l}</th>)}</tr></thead><tbody>{rows.slice(0,10).map((r,i) => <tr key={i} className="border-t"><td className="max-w-[240px] truncate px-3 py-2" title={r.dimensions.join(" — ")}>{r.dimensions.join(" — ")}</td>{r.metrics.slice(0, labels.length - 1).map((v:number,j:number) => <td key={j} className="px-3 py-2 text-right">{Number(v).toLocaleString(undefined,{maximumFractionDigits:1})}</td>)}</tr>)}</tbody></table></div></div>;
}

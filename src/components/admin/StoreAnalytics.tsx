"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export default function StoreAnalytics() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [onsite, setOnsite] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    fetch(`/api/admin/live-view?days=${RANGE_DAYS[range] || 30}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null)).then(setOnsite).catch(() => setOnsite(null));
    try {
      const ga4Res = await fetch(`/api/admin/analytics?range=${range}`, { cache: "no-store" });
      const j = await ga4Res.json();
      if (!ga4Res.ok) throw new Error(j.error || "Analytics request failed");
      setData(j);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [range]);
  useEffect(() => { load(); }, [load]);

  const s = data?.summary || [];
  const cards = [
    ["Users", s[0] || 0], ["Sessions", s[1] || 0], ["Page views", s[2] || 0],
    ["Engagement", `${((s[3] || 0) * 100).toFixed(1)}%`],
    ["Avg. session", `${Math.round(s[4] || 0)}s`], ["New users", s[5] || 0],
  ];
  return (
    <>
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

      {onsite && (
        <section className="mb-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-neutral-900">On-site Visitor Stats</h2>
            <p className="text-sm text-neutral-500">Tracked by the store itself — page, device, source and location for every visitor (last {RANGE_DAYS[range]} days)</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Visitors", onsite.visitors || 0],
              ["Page views", onsite.pageviews || 0],
              ["Add to cart", onsite.events?.add_to_cart || 0],
              ["Purchases", onsite.events?.purchase || 0],
            ].map(([k, v]) => <div key={String(k)} className="rounded-lg bg-neutral-50 p-3"><p className="text-xs text-neutral-500">{k}</p><p className="mt-1 text-xl font-extrabold">{Number(v).toLocaleString()}</p></div>)}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <SimpleTable title="Top pages" rows={onsite.pages} rowKey="path" cols={["views", "users"]} labels={["Page", "Views", "Users"]} />
            <SimpleTable title="Locations" rows={onsite.locations} rowKey="location" cols={["count"]} labels={["Location", "Visitors"]} />
            <SimpleTable title="Sources" rows={onsite.sources} rowKey="source" cols={["count"]} labels={["Source", "Visitors"]} />
            <SimpleTable title="Devices" rows={onsite.devices} rowKey="device" cols={["count"]} labels={["Device", "Visitors"]} />
          </div>
        </section>
      )}
    </>
  );
}

function Table({ title, rows = [], labels }: { title: string; rows: any[]; labels: string[] }) {
  return <div><h3 className="mb-2 font-bold">{title}</h3><div className="overflow-hidden rounded-lg border border-neutral-200"><table className="w-full text-sm"><thead className="bg-neutral-50 text-xs text-neutral-500"><tr>{labels.map((l,i) => <th key={l} className={`px-3 py-2 ${i ? "text-right" : "text-left"}`}>{l}</th>)}</tr></thead><tbody>{rows.slice(0,10).map((r,i) => <tr key={i} className="border-t"><td className="max-w-[240px] truncate px-3 py-2" title={r.dimensions.join(" — ")}>{r.dimensions.join(" — ")}</td>{r.metrics.slice(0, labels.length - 1).map((v:number,j:number) => <td key={j} className="px-3 py-2 text-right">{Number(v).toLocaleString(undefined,{maximumFractionDigits:1})}</td>)}</tr>)}</tbody></table></div></div>;
}

function SimpleTable({ title, rows = [], rowKey, cols, labels }: { title: string; rows: any[]; rowKey: string; cols: string[]; labels: string[] }) {
  return (
    <div>
      <h3 className="mb-2 font-bold">{title}</h3>
      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500">
            <tr>{labels.map((l, i) => <th key={l} className={`px-3 py-2 ${i ? "text-right" : "text-left"}`}>{l}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-t"><td colSpan={labels.length} className="px-3 py-6 text-center text-neutral-400">No data yet</td></tr>
            ) : rows.slice(0, 10).map((r, i) => (
              <tr key={i} className="border-t">
                <td className="max-w-[240px] truncate px-3 py-2" title={String(r[rowKey])}>{String(r[rowKey] || "Unknown")}</td>
                {cols.map((c) => <td key={c} className="px-3 py-2 text-right">{Number(r[c] || 0).toLocaleString()}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

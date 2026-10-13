"use client";

import { useCallback, useEffect, useState } from "react";
import { Facebook, RefreshCw } from "lucide-react";

const AUD = (n: number) => `$${n.toFixed(2)}`;

export default function MetaAdsInsights() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/meta/insights?range=${range}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load Meta insights");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const t = data?.totals;
  const campaigns: any[] = data?.campaigns || [];

  return (
    <div className="mt-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Facebook size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Meta Ads</h2>
            <p className="text-xs text-neutral-500">Facebook &amp; Instagram campaign performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-8 text-sm font-semibold text-neutral-700 focus:border-primary focus:outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-500 hover:bg-neutral-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Meta insights unavailable</p>
          <p className="mt-1 break-words">{error}</p>
          <p className="mt-2 text-xs text-amber-700">
            Fix: Business Settings → Accounts → Ad Accounts → your ad account → Assign People/System
            Users → grant the API user &ldquo;View performance&rdquo;. Also set META_AD_ACCOUNT_ID in .env.local.
          </p>
        </div>
      )}

      {!error && loading && <div className="py-10 text-center text-sm text-neutral-400">Loading Meta ads data…</div>}

      {!error && !loading && (
        <>
          {t && (
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Spend", AUD(t.spend)],
                ["Impressions", t.impressions.toLocaleString()],
                ["Clicks", t.clicks.toLocaleString()],
                ["CTR", `${t.ctr.toFixed(2)}%`],
                ["Purchases", String(t.purchases)],
                ["Cost / Purchase", t.costPerPurchase ? AUD(t.costPerPurchase) : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-xs font-medium text-neutral-500">{label}</p>
                  <p className="mt-1 text-lg font-extrabold text-neutral-900">{value}</p>
                </div>
              ))}
            </div>
          )}

          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <th className="px-3 py-2">Campaign</th>
                    <th className="px-3 py-2 text-right">Spend</th>
                    <th className="px-3 py-2 text-right">Impr.</th>
                    <th className="px-3 py-2 text-right">Clicks</th>
                    <th className="px-3 py-2 text-right">CTR</th>
                    <th className="px-3 py-2 text-right">CPC</th>
                    <th className="px-3 py-2 text-right">Purch.</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="max-w-[280px] truncate px-3 py-2.5 font-medium text-neutral-900">{c.name}</td>
                      <td className="px-3 py-2.5 text-right">{AUD(c.spend)}</td>
                      <td className="px-3 py-2.5 text-right text-neutral-600">{c.impressions.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-neutral-600">{c.clicks.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-neutral-600">{c.ctr.toFixed(2)}%</td>
                      <td className="px-3 py-2.5 text-right text-neutral-600">{AUD(c.cpc)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{c.purchases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-neutral-500">
              No campaign activity in this range. Create an ad in Meta Ads Manager and data will appear here.
            </p>
          )}
        </>
      )}
    </div>
  );
}

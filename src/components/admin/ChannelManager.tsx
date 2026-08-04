"use client";

import React, { useEffect, useMemo, useState } from "react";

interface Product {
  id: string;
  name?: string;
  title?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  stock?: number;
  inStock?: boolean;
  condition?: string;
  brand?: string;
  model?: string;
  marketplaceCategory?: {
    ebay?: string;
    amazon?: string;
    temu?: string;
    aliexpress?: string;
  };
}

interface ChannelListing {
  productId: string;
  sku: string;
  channel: string;
  externalId?: string;
  externalUrl?: string;
  status: string;
  lastSyncedAt?: string;
  lastError?: string;
}

const ALL_FIELDS = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "price", label: "Price" },
  { key: "quantity", label: "Quantity" },
  { key: "condition", label: "Condition" },
  { key: "images", label: "Images" },
  { key: "category", label: "Category" },
  { key: "mpn", label: "MPN" },
  { key: "gtin", label: "GTIN" },
  { key: "package", label: "Package" },
];

const ALL_CHANNELS = ["ebay", "amazon", "temu", "aliexpress"];

export default function ChannelManager() {
  const [status, setStatus] = useState<Record<string, { connected: boolean; updatedAt?: string }>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [listings, setListings] = useState<ChannelListing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["ebay"]);
  const [selectedFields, setSelectedFields] = useState<string[]>(ALL_FIELDS.map((f) => f.key));
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const listingMap = useMemo(() => {
    const map: Record<string, Record<string, ChannelListing>> = {};
    for (const l of listings) {
      if (!map[l.productId]) map[l.productId] = {};
      map[l.productId][l.channel] = l;
    }
    return map;
  }, [listings]);

  const load = async () => {
    try {
      setLoading(true);
      const [prodRes, chRes] = await Promise.all([
        fetch("/api/admin/products?limit=1000"),
        fetch("/api/admin/channels"),
      ]);
      const prodData = await prodRes.json();
      const chData = await chRes.json();
      setProducts(prodData.products || []);
      setTotal(prodData.total || 0);
      setStatus(chData.accounts || {});
      setListings(chData.listings || []);
    } catch (err: any) {
      setMessage(`Failed to load: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) =>
      [p.id, p.sku, p.name, p.title].some((v) => String(v || "").toLowerCase().includes(s))
    );
  }, [products, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const connect = async (channel: string) => {
    try {
      const res = await fetch(`/api/channels/${channel}/auth`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage(data.details || data.error || `No auth URL returned for ${channel}`);
    } catch (err: any) {
      setMessage(`${channel} auth failed: ${err?.message || err}`);
    }
  };

  const push = async (productIds: string[], preflightMissing?: string[]) => {
    if (productIds.length === 0) return;
    if (selectedChannels.length === 0) {
      setMessage("Select at least one channel");
      return;
    }
    if (selectedFields.length === 0) {
      setMessage("Select at least one field to push");
      return;
    }
    setLoading(true);
    if (preflightMissing?.length) {
      setMessage(`Skipped ${preflightMissing.length} product(s) without an eBay category:\n\n${preflightMissing.join("\n")}`);
    }
    try {
      const res = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "push",
          productIds,
          channels: selectedChannels,
          fields: selectedFields,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || `HTTP ${res.status}`);
      const failed = data.results?.filter((r: any) => !r.ok).map((r: any) => `${r.sku ? `SKU ${r.sku}` : r.productId}${r.name ? ` (${r.name})` : ""}: ${r.error}`).join("; ");
      const missingMsg = preflightMissing?.length ? `Skipped ${preflightMissing.length} product(s) without an eBay category:\n\n${preflightMissing.join("\n")}` : "";
      const resultMsg = failed ? `Some failed: ${failed}` : `Pushed ${data.results?.length || 0} product(s)`;
      setMessage([missingMsg, resultMsg].filter(Boolean).join("\n\n"));
      await load();
    } catch (err: any) {
      setMessage(`Push failed: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const pushSelected = () => {
    const selectedProducts = products.filter((p) => selected.has(p.id));
    const missing: string[] = [];
    const validIds: string[] = [];
    for (const p of selectedProducts) {
      const label = `${p.name || p.title || p.id}${p.sku ? ` (SKU: ${p.sku})` : ""}`;
      if (!p.marketplaceCategory?.ebay) {
        missing.push(label);
      } else {
        validIds.push(p.id);
      }
    }
    if (validIds.length === 0) {
      setMessage(`No products have an eBay category set.\n\n${missing.join("\n")}`);
      return;
    }
    push(validIds, missing);
  };

  const pushSingle = (id: string) => {
    const p = products.find((x) => x.id === id);
    const label = `${p?.name || p?.title || id}${p?.sku ? ` (SKU: ${p.sku})` : ""}`;
    if (!p?.marketplaceCategory?.ebay) {
      setMessage(`No eBay category set for ${label}`);
      return;
    }
    push([id]);
  };

  const syncOrders = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncOrders", channel: "ebay" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || `HTTP ${res.status}`);
      setMessage(`Synced ${data.count || 0} eBay order(s)`);
    } catch (err: any) {
      setMessage(`Sync orders failed: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Marketplace Channel Manager</h1>

      {message && (
        <div className="mb-4 rounded-lg bg-neutral-100 p-3 text-sm text-neutral-800 whitespace-pre-wrap">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {ALL_CHANNELS.map((channel) => (
          <div key={channel} className="rounded-xl border border-neutral-200 p-4">
            <h2 className="text-lg font-semibold mb-2 capitalize">{channel} Account</h2>
            <p className="text-sm text-neutral-600 mb-3">
              {status[channel]?.connected ? `Connected` : "Not connected"}
              {status[channel]?.updatedAt ? ` · ${status[channel].updatedAt}` : ""}
            </p>
            <button
              type="button"
              onClick={() => connect(channel)}
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {status[channel]?.connected ? "Reconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>

        <div className="rounded-xl border border-neutral-200 p-4 md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Push Controls</h2>

          <div className="mb-3">
            <span className="text-sm font-medium mr-2">Channels:</span>
            {ALL_CHANNELS.map((c) => (
              <label key={c} className="inline-flex items-center mr-4 text-sm capitalize">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes(c)}
                  onChange={() => toggleChannel(c)}
                  className="mr-1"
                />
                {c}
              </label>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="text-sm font-medium w-full">Fields to push:</span>
            {ALL_FIELDS.map((f) => (
              <label key={f.key} className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(f.key)}
                  onChange={() => toggleField(f.key)}
                  className="mr-1"
                />
                {f.label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={pushSelected}
              disabled={loading || selected.size === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              Push {selected.size} selected
            </button>
            <button
              type="button"
              onClick={syncOrders}
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              Sync eBay Orders
            </button>
          </div>
        </div>

      <div className="rounded-xl border border-neutral-200 p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">Products ({filtered.length} of {total})</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, SKU, name..."
            className="w-full md:w-72 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 text-neutral-700">
              <tr>
                <th className="p-2">
                  <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} />
                </th>
                <th className="p-2">Name / SKU</th>
                <th className="p-2">Price</th>
                <th className="p-2">Qty</th>
                <th className="p-2">eBay</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const qty = p.quantity ?? p.stock ?? (p.inStock ? 1 : 0);
                const listing = listingMap[p.id]?.ebay;
                return (
                  <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-2">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{p.name || p.title || "—"}</div>
                      <div className="text-xs text-neutral-500">{p.sku || p.id}</div>
                    </td>
                    <td className="p-2">{p.price?.toFixed(2) ?? "—"}</td>
                    <td className="p-2">{qty}</td>
                    <td className="p-2">
                      {listing ? (
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            listing.status === "listed"
                              ? "bg-green-100 text-green-800"
                              : listing.status === "error"
                                ? "bg-red-100 text-red-800"
                                : "bg-neutral-100 text-neutral-800"
                          }`}
                        >
                          {listing.status}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Not listed</span>
                      )}
                      {listing?.externalUrl && (
                        <a href={listing.externalUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs text-primary underline">
                          View
                        </a>
                      )}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => pushSingle(p.id)}
                        disabled={loading}
                        className="rounded-md bg-primary px-2 py-1 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        Push
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

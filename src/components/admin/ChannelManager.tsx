"use client";

import React, { useEffect, useState } from "react";

export default function ChannelManager() {
  const [status, setStatus] = useState<{ ebay?: { connected: boolean; updatedAt?: string } }>({});
  const [listings, setListings] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/channels");
      const data = await res.json();
      setStatus(data.accounts || {});
      setListings(data.listings || []);
    } catch (err: any) {
      setMessage(`Failed to load channel data: ${err?.message || err}`);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connectEbay = async () => {
    try {
      const res = await fetch("/api/channels/ebay/auth");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(data.error || "No auth URL returned");
      }
    } catch (err: any) {
      setMessage(`eBay auth failed: ${err?.message || err}`);
    }
  };

  const action = async (action: string) => {
    if (action === "publish" && !productId.trim()) {
      setMessage("Enter a product ID to publish");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, channel: "ebay", productId: productId.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || `HTTP ${res.status}`);
      setMessage(`${action} succeeded: ${JSON.stringify(data)}`);
      await load();
    } catch (err: any) {
      setMessage(`${action} failed: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Marketplace Channels</h1>

      {message && (
        <div className="mb-4 rounded-lg bg-neutral-100 p-3 text-sm text-neutral-800">
          {message}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-neutral-200 p-4">
        <h2 className="text-lg font-semibold mb-2">eBay</h2>
        <p className="text-sm text-neutral-600 mb-3">
          Status: {status.ebay?.connected ? `Connected (${status.ebay.updatedAt})` : "Not connected"}
        </p>
        <button
          type="button"
          onClick={connectEbay}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {status.ebay?.connected ? "Reconnect eBay" : "Connect eBay"}
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-4">
        <h2 className="text-lg font-semibold mb-2">Publish to eBay</h2>
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Product ID"
          className="mb-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => action("publish")}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={() => action("updateInventory")}
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            Update Inventory
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-4">
        <h2 className="text-lg font-semibold mb-2">Orders</h2>
        <button
          type="button"
          onClick={() => action("syncOrders")}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          Sync eBay Orders
        </button>
      </div>

      {listings.length > 0 && (
        <div className="rounded-xl border border-neutral-200 p-4">
          <h2 className="text-lg font-semibold mb-2">Channel Listings</h2>
          <ul className="space-y-2">
            {listings.map((l) => (
              <li key={l._id || `${l.productId}-${l.channel}`} className="text-sm">
                <span className="font-semibold">{l.channel}</span> — {l.sku} — {l.status} {l.externalUrl && (
                  <a href={l.externalUrl} target="_blank" rel="noreferrer" className="text-primary underline">View</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

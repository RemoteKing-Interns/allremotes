"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { buildPackingSlipData, renderPackingSlipHtml, DEFAULT_PACKING_SLIP_TEMPLATE } from "../../lib/packingSlip";

const SAMPLE_EBAY_ORDER = {
  id: "EBAY-02-14994-66583",
  channel: "ebay",
  externalOrderId: "02-14994-66583",
  createdAt: "2026-08-03T12:00:00.000Z",
  customer: {
    fullName: "Jennifer Cimino",
    email: "01207e732eedf56kb8880@members.ebay.com",
  },
  shipping: {
    address: "Unit 3 1 Fay Court",
    city: "Croydon",
    state: "VIC",
    zipCode: "3136",
    country: "Australia",
  },
  items: [
    {
      name: "Avanti/Centurion/Superlift/GNS Genuine/Matador 4 Btn Remote Garage Door Remote",
      sku: "AR-AVANTI4",
      quantity: 1,
      unitPrice: 63.5,
      lineTotal: 63.5,
    },
  ],
  pricing: {
    currency: "AU",
    subtotal: 63.5,
    shipping: 0,
    discountTotal: 0,
    total: 63.5,
  },
};

const SAMPLE_SITE_ORDER = {
  id: "ARSO-000123",
  channel: "site",
  createdAt: "2026-08-03T12:00:00.000Z",
  customer: {
    fullName: "Shane M",
    email: "shane@allremotes.com.au",
  },
  shipping: {
    address: "123 Example St",
    city: "Sydney",
    state: "NSW",
    zipCode: "2000",
    country: "Australia",
    phone: "+61 400 000 000",
  },
  items: [
    {
      name: "DEA GTI2B 434MHz 2Button Transmitter",
      sku: "AR-REA02",
      quantity: 2,
      unitPrice: 75,
      lineTotal: 150,
    },
    {
      name: "Aftermarket Garage Remote",
      sku: "AR-REMOTE1",
      quantity: 1,
      unitPrice: 29.95,
      lineTotal: 29.95,
    },
  ],
  pricing: {
    currency: "AUD",
    subtotal: 179.95,
    shipping: 12,
    discountTotal: 0,
    total: 191.95,
  },
};

const FONTS = [
  { name: "System", family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { name: "Arial", family: "Arial, sans-serif" },
  { name: "Georgia", family: "Georgia, serif" },
  { name: "Courier", family: "'Courier Prime', Courier, monospace" },
  { name: "Inter", family: "'Inter', sans-serif" },
];

const PLACEHOLDERS = [
  "storeName",
  "storeUrl",
  "orderId",
  "externalOrderId",
  "channel",
  "orderDate",
  "buyerName",
  "buyerEmail",
  "shipTo.fullName",
  "shipTo.address",
  "shipTo.address2",
  "shipTo.city",
  "shipTo.state",
  "shipTo.zipCode",
  "shipTo.cityLine",
  "shipTo.country",
  "shipTo.phone",
  "subtotal",
  "shippingCost",
  "discount",
  "total",
  "currency",
  "footerText",
  "postageService",
  "buyerPhone",
  "buyerUsername",
  "displayOrderId",
  "#each items -> index, name, sku, externalId, color, qty, price, lineTotal",
  "Image",
  "Font",
];

export default function DocumentDesign() {
  const [html, setHtml] = useState<string>("");
  const [savedHtml, setSavedHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [sample, setSample] = useState<"ebay" | "site">("ebay");
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [font, setFont] = useState<string>(FONTS[0].family);
  const [imageUrl, setImageUrl] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/document-templates?key=packing-slip");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to load template");
      const template = typeof data.html === "string" && data.html.trim() ? data.html : DEFAULT_PACKING_SLIP_TEMPLATE;
      setHtml(template);
      setSavedHtml(template);
    } catch (err: any) {
      setError(err.message || "Failed to load template");
      setHtml(DEFAULT_PACKING_SLIP_TEMPLATE);
      setSavedHtml(DEFAULT_PACKING_SLIP_TEMPLATE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  useEffect(() => {
    if (!html) return;
    const order = sample === "ebay" ? SAMPLE_EBAY_ORDER : SAMPLE_SITE_ORDER;
    const data = buildPackingSlipData(order);
    try {
      setPreview(renderPackingSlipHtml(html, data));
      setError("");
    } catch (err: any) {
      setPreview("");
      setError(`Preview error: ${err.message}`);
    }
  }, [html, sample]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/document-templates?key=packing-slip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Save failed");
      setSavedHtml(html);
      setMessage("Saved.");
    } catch (err: any) {
      setMessage(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset the template to the built-in default?")) {
      setHtml(DEFAULT_PACKING_SLIP_TEMPLATE);
    }
  };

  const getSnippet = (token: string) => {
    if (token === "Image") return `<img src="${imageUrl || "https://"}" alt="logo" style="max-width:120px;display:block;margin-bottom:12px">`;
    if (token === "Font") return `<span style="font-family:${font}">text</span>`;
    if (token.startsWith("#each")) return `\n{{#each items}}\n  <tr><td>{{name}}</td><td>{{sku}}</td><td>{{qty}}</td><td>{{lineTotal}}</td></tr>\n{{/each}}`;
    return `{{${token}}}`;
  };

  const insertText = (text: string, at?: number) => {
    const pos = at ?? textareaRef.current?.selectionStart ?? html.length;
    const next = html.slice(0, pos) + text + html.slice(pos);
    setHtml(next);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const end = pos + text.length;
      ta.selectionStart = end;
      ta.selectionEnd = end;
      ta.focus();
    }, 0);
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain");
    if (!text) return;
    insertText(text, (e.currentTarget as HTMLTextAreaElement).selectionStart);
  };

  const hasChanges = html !== savedHtml;

  if (loading) return <div className="p-6 text-neutral-500">Loading template…</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Document Design</h2>
          <p className="text-sm text-neutral-500">Edit the packing-slip HTML template. Use placeholders to render order data.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${hasChanges ? "text-amber-600" : "text-emerald-600"}`}>
            {hasChanges ? "Unsaved changes" : "Up to date"}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-2 text-sm ${message.startsWith("Save failed") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-neutral-700">Template HTML / CSS</label>
            <div className="flex gap-2">
              <button onClick={handleReset} className="text-xs text-violet-600 hover:underline">
                Reset to default
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="h-[500px] w-full rounded-lg border border-neutral-300 p-4 font-mono text-sm text-neutral-800 focus:border-violet-500 focus:outline-none"
            spellCheck={false}
          />

          <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-neutral-600">Font for Font chip</label>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                >
                  {FONTS.map((f) => (
                    <option key={f.name} value={f.family}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-[2]">
                <label className="mb-1 block text-xs font-semibold text-neutral-600">Image URL for Image chip</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-neutral-700">Drag or click a placeholder</h3>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map((p) => (
                <span
                  key={p}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", getSnippet(p))}
                  onClick={() => insertText(getSnippet(p))}
                  className="cursor-grab rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50 active:cursor-grabbing"
                  title={`Drag or click to insert ${p}`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-neutral-700">Live preview</label>
            <select
              value={sample}
              onChange={(e) => setSample(e.target.value as "ebay" | "site")}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
            >
              <option value="ebay">Sample eBay order</option>
              <option value="site">Sample site order</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <iframe
            title="Packing slip preview"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Packing Slip Preview</title></head><body>${preview}</body></html>`}
            className="h-[600px] w-full rounded-lg border border-neutral-300 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import HotTable from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import { Save, Loader2, AlertCircle, FileSpreadsheet, Table2, Share2, Lock, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { activityLogger } from "@/lib/activity-logger";
import { useAuth } from "@/context/AuthContext";

registerAllModules();

const COLUMN_DEFS = [
  { data: "id", title: "ID", width: 120, readOnly: true },
  { data: "sku", title: "SKU", width: 100 },
  { data: "skuKey", title: "SKU Key", width: 100 },
  { data: "rk_sku", title: "RK_SKU", width: 100 },
  { data: "rk_url", title: "RK_URL", width: 240, wordWrap: true },
  { data: "name", title: "Name", width: 220, wordWrap: true },
  { data: "brand", title: "Brand", width: 100 },
  { data: "category", title: "Category", width: 100, type: "dropdown", source: ["car", "garage", "all"] },
  { data: "cat1", title: "Category 1", width: 100 },
  { data: "price", title: "Price", width: 80, type: "numeric" },
  { data: "comparePrice", title: "Compare Price", width: 100, type: "numeric" },
  { data: "stock", title: "Stock", width: 70, type: "numeric" },
  { data: "inStock", title: "In Stock", width: 80, type: "checkbox" },
  { data: "frequency_mhz", title: "Frequency MHz", width: 100 },
  { data: "buttons", title: "Buttons", width: 70, type: "numeric" },
  { data: "compatibility", title: "Compatibility", width: 180, wordWrap: true },
  { data: "condition", title: "Condition", width: 100, type: "dropdown", source: ["Brand New", "Refurbished", "Used"] },
  { data: "returns", title: "Returns", width: 200, wordWrap: true },
  { data: "seo_title", title: "SEO Title", width: 200, wordWrap: true },
  { data: "tags", title: "Tags", width: 140, wordWrap: true },
  { data: "image", title: "Image URL", width: 200, wordWrap: true },
  { data: "images", title: "All Images", width: 300, wordWrap: true },
  { data: "imgIndex", title: "Image Index", width: 80, type: "numeric" },
  { data: "imageIndex", title: "Image Index", width: 80, type: "numeric" },
  { data: "brandImage", title: "Brand Image", width: 200, wordWrap: true },
  { data: "description", title: "Description", width: 300, wordWrap: true },
  { data: "features", title: "Features", width: 250, wordWrap: true },
  { data: "seller", title: "Seller", width: 150 },
  { data: "instructions", title: "Instructions", width: 200, wordWrap: true },
  { data: "createdAt", title: "Created At", width: 150, readOnly: true },
  { data: "updatedAt", title: "Updated At", width: 150, readOnly: true },
];

export default function ProductSpreadsheet({ onBack, readOnly = false, shareConfig, fullHeight = false }: { onBack: () => void; readOnly?: boolean; shareConfig?: { columns: string[]; shareMode: string } | null; fullHeight?: boolean }) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changedRows, setChangedRows] = useState<Set<number>>(new Set());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<{ read: string; edit: string } | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(COLUMN_DEFS.map(col => col.data)));
  const [shareMode, setShareMode] = useState<"all" | "selected">("all");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [activeLinks, setActiveLinks] = useState<any[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadActiveLinks = async () => {
    setLinksLoading(true);
    try {
      const resp = await fetch("/api/admin/spreadsheet/share?list=1");
      const data = await resp.json();
      setActiveLinks(data.links || []);
    } catch { /* ignore */ } finally {
      setLinksLoading(false);
    }
  };

  const revokeLink = async (token: string) => {
    await fetch(`/api/admin/spreadsheet/share?token=${token}`, { method: "DELETE" });
    setActiveLinks(prev => prev.filter(l => l.token !== token));
    toast.success("Link revoked");
  };

  const copyLink = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      activityLogger.pageView("spreadsheet", {
        shareMode: shareConfig?.shareMode,
        columnCount: shareConfig?.columns?.length || COLUMN_DEFS.length,
      });

      const resp = await fetch("/api/products", { cache: "no-store" });
      const json = await resp.json();
      setData(Array.isArray(json) ? json : []);

      activityLogger.action("spreadsheet_loaded", {
        productCount: Array.isArray(json) ? json.length : 0,
      });
    } catch (err: any) {
      activityLogger.error("spreadsheet_load_failed", { error: err.message });
      toast.error("Failed to load products: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (changes: any[] | null, source: string) => {
    if (!changes || changes.length === 0) return;
    if (source === "loadData") return;
    const next = new Set(changedRows);
    changes.forEach(([row]) => next.add(row));
    setChangedRows(next);
  };

  const handleSave = async () => {
    if (changedRows.size === 0) {
      toast("No changes to save");
      return;
    }

    const changedProducts = Array.from(changedRows).map((index) => data[index]);

    setSaving(true);
    try {
      const resp = await fetch("/api/admin/products/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: changedProducts }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "Save failed");
      toast.success(`Saved ${json.modifiedCount} products`);
      activityLogger.action("spreadsheet_bulk_save", { count: json.modifiedCount, rowIndexes: Array.from(changedRows) });
      setChangedRows(new Set());
    } catch (err: any) {
      activityLogger.error("spreadsheet_save_failed", { error: err.message, rowCount: changedRows.size });
      toast.error("Save failed: " + (err?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const filteredColumns = useMemo(() => {
  if (!shareConfig || shareConfig.shareMode === "all") {
    return COLUMN_DEFS;
  }
  return COLUMN_DEFS.filter(col => shareConfig.columns.includes(col.data));
}, [shareConfig]);

const colHeaders = useMemo(() => filteredColumns.map((c) => c.title), [filteredColumns]);
const columns = useMemo(() => filteredColumns.map(col => ({
    ...col,
    readOnly: readOnly ? true : (col.readOnly || false)
  })), [filteredColumns, readOnly]);

  const handleShare = async (permission: "read" | "edit") => {
    setShareLoading(true);
    try {
      const columnsToShare = shareMode === "all" 
        ? COLUMN_DEFS.map(col => col.data)
        : Array.from(selectedColumns);
      
      const storedUser = typeof window !== "undefined"
        ? (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })()
        : {};
      const userEmail = storedUser.email || "";
      const userName = storedUser.name || "";
      const resp = await fetch("/api/admin/spreadsheet/share", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail, "x-user-name": userName },
        body: JSON.stringify({ 
          permission, 
          expiresInHours,
          columns: columnsToShare,
          shareMode
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to create share link");
      
      setShareLinks(prev => ({
        ...prev,
        [permission]: data.shareUrl
      }));
      loadActiveLinks();
      
      // Copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success(`${permission === "read" ? "Read-only" : "Edit"} link copied to clipboard!`);
    } catch (err: any) {
      toast.error("Failed to create share link: " + (err?.message || "Unknown error"));
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Product Spreadsheet</h2>
            <p className="text-xs text-neutral-500">
              Edit like Excel. Copy & paste, wrap text, undo/redo supported. Click Save to persist changes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!shareConfig && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <Table2 size={16} />
              Back to Table
            </button>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || changedRows.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save {changedRows.size > 0 ? `(${changedRows.size})` : ""}
            </button>
          )}
          {!shareConfig && (
            <button
              type="button"
              onClick={() => { setShareModalOpen(true); loadActiveLinks(); }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <Share2 size={16} />
              Share
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm font-medium text-neutral-500 bg-white rounded-xl border border-neutral-200">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Loading products...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-neutral-500 bg-white rounded-xl border border-neutral-200">
          <AlertCircle size={18} className="mr-2" />
          No products found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-auto">
          <div className="p-4">
            <HotTable
              data={data}
              colHeaders={colHeaders}
              columns={columns}
              rowHeaders={true}
              height={fullHeight ? window.innerHeight - 80 : Math.min(700, data.length * 40 + 50)}
              stretchH="none"
              autoWrapRow={true}
              licenseKey="non-commercial-and-evaluation"
              contextMenu={true}
              multiColumnSorting={true}
              filters={true}
              dropdownMenu={true}
              columnSorting={true}
              manualColumnResize={true}
              afterChange={handleChange}
              copyPaste={true}
              undo={true}
              wordWrap={true}
              className="htMiddle"
            />
          </div>
          <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
            {data.length} products loaded. Edited rows: {changedRows.size}.
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Share Spreadsheet</h3>
              <button onClick={() => setShareModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Expiry */}
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-2">Link Expiry</label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 6, 24, 48, 72, 168].map(h => (
                    <button
                      key={h}
                      onClick={() => setExpiresInHours(h)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        expiresInHours === h
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-emerald-400"
                      }`}
                    >
                      {h < 24 ? `${h}h` : `${h / 24}d`}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={expiresInHours}
                    onChange={e => setExpiresInHours(Math.max(1, Math.min(720, Number(e.target.value))))}
                    className="w-20 px-2 py-1.5 text-xs border border-neutral-200 rounded-lg"
                    placeholder="hours"
                  />
                </div>
              </div>

              {/* Column Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-neutral-700">Columns</label>
                  <div className="flex gap-2">
                    {(["all", "selected"] as const).map(m => (
                      <button key={m} onClick={() => setShareMode(m)}
                        className={`px-3 py-1 text-xs rounded-lg ${shareMode === m ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>
                        {m === "all" ? "All Columns" : "Select Columns"}
                      </button>
                    ))}
                  </div>
                </div>
                {shareMode === "selected" && (
                  <div className="border border-neutral-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {COLUMN_DEFS.map((col) => (
                        <label key={col.data} className="flex items-center text-xs gap-1 cursor-pointer">
                          <input type="checkbox" checked={selectedColumns.has(col.data)}
                            onChange={(e) => setSelectedColumns(prev => {
                              const next = new Set(prev);
                              e.target.checked ? next.add(col.data) : next.delete(col.data);
                              return next;
                            })} />
                          <span className="truncate">{col.title}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-neutral-500">
                      <span>{selectedColumns.size}/{COLUMN_DEFS.length} selected</span>
                      <button onClick={() => setSelectedColumns(new Set(COLUMN_DEFS.map(c => c.data)))} className="text-emerald-600">Select All</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Create Link Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {(["read", "edit"] as const).map(perm => (
                  <div key={perm}>
                    <button
                      onClick={() => handleShare(perm)}
                      disabled={shareLoading || (shareMode === "selected" && selectedColumns.size === 0)}
                      className={`w-full flex items-center justify-between p-3 border rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 ${shareLoading ? "cursor-wait" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <Lock className={`h-4 w-4 ${perm === "read" ? "text-amber-500" : "text-green-500"}`} />
                        <span className="text-sm font-medium">{perm === "read" ? "Read Only" : "Can Edit"}</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-medium">+ Create</span>
                    </button>
                    {shareLinks?.[perm] && (
                      <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 break-all flex items-center justify-between gap-2">
                        <span className="truncate">{shareLinks[perm]}</span>
                        <button onClick={() => copyLink(shareLinks![perm], perm)} className="shrink-0 text-emerald-600 hover:text-emerald-800">
                          {copiedToken === perm ? "✓" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-neutral-700">Active Links</label>
                  <button onClick={loadActiveLinks} className="text-xs text-emerald-600 hover:text-emerald-700">↺ Refresh</button>
                </div>
                {linksLoading ? (
                  <div className="text-xs text-neutral-500 py-4 text-center">Loading…</div>
                ) : activeLinks.length === 0 ? (
                  <div className="text-xs text-neutral-400 py-4 text-center border border-dashed border-neutral-200 rounded-lg">No active links</div>
                ) : (
                  <div className="space-y-2">
                    {activeLinks.map(link => {
                      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${link.token}`;
                      const expiresAt = new Date(link.expiresAt);
                      const diff = expiresAt.getTime() - Date.now();
                      const hrs = Math.floor(diff / 3600000);
                      const mins = Math.floor((diff % 3600000) / 60000);
                      const timeLeft = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                      return (
                        <div key={link.token} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg text-xs">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`font-medium ${link.permission === "read" ? "text-amber-600" : "text-green-600"}`}>
                                {link.permission === "read" ? "Read Only" : "Can Edit"}
                              </span>
                              <span className="text-neutral-400">·</span>
                              <span className="text-neutral-500">{link.shareMode === "selected" ? `${link.columnCount} cols` : "All cols"}</span>
                              <span className="text-neutral-400">·</span>
                              <span className="text-neutral-500">by {link.createdBy || "Unknown"}</span>
                            </div>
                            <div className="text-neutral-400 flex items-center gap-1">
                              <Clock size={10} />
                              <span>Expires in {timeLeft}</span>
                            </div>
                          </div>
                          <button onClick={() => copyLink(url, link.token)} className="shrink-0 px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600">
                            {copiedToken === link.token ? "✓ Copied" : "Copy"}
                          </button>
                          <button onClick={() => revokeLink(link.token)} className="shrink-0 px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600">
                            Revoke
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

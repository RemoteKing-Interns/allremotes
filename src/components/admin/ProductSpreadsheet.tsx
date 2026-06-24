"use client";

import React, { useEffect, useMemo, useState } from "react";
import HotTable from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import { Save, Loader2, AlertCircle, FileSpreadsheet, Table2, Share2, Lock } from "lucide-react";
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
  { data: "cat2", title: "Category 2", width: 100 },
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

export default function ProductSpreadsheet({ onBack, readOnly = false, shareConfig }: { onBack: () => void; readOnly?: boolean; shareConfig?: { columns: string[]; shareMode: string } | null }) {
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

  useEffect(() => {
    loadProducts();
  }, []);

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
    readOnly: readOnly ? true : col.readOnly
  })), [filteredColumns, readOnly]);

  const handleShare = async (permission: "read" | "edit") => {
    setShareLoading(true);
    try {
      const columnsToShare = shareMode === "all" 
        ? COLUMN_DEFS.map(col => col.data)
        : Array.from(selectedColumns);
      
      const resp = await fetch("/api/admin/spreadsheet/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          permission, 
          expiresInHours: 24,
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
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            <Table2 size={16} />
            Back to Table
          </button>
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
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
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
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4">
            <HotTable
              data={data}
              colHeaders={colHeaders}
              columns={columns}
              rowHeaders={true}
              height={Math.min(700, data.length * 40 + 50)}
              width="100%"
              stretchH="all"
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Share Spreadsheet</h3>
            <p className="text-sm text-neutral-600 mb-6">
              Create shareable links with different permission levels and column selection. Links expire in 24 hours.
            </p>
            
            {/* Column Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-700">Column Selection</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShareMode("all")}
                    className={`px-3 py-1 text-xs rounded ${
                      shareMode === "all" 
                        ? "bg-emerald-600 text-white" 
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    All Columns
                  </button>
                  <button
                    onClick={() => setShareMode("selected")}
                    className={`px-3 py-1 text-xs rounded ${
                      shareMode === "selected" 
                        ? "bg-emerald-600 text-white" 
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    Selected Columns
                  </button>
                </div>
              </div>
              
              {shareMode === "selected" && (
                <div className="border border-neutral-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {COLUMN_DEFS.map((col) => (
                      <label key={col.data} className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={selectedColumns.has(col.data)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns(prev => new Set(prev).add(col.data));
                            } else {
                              setSelectedColumns(prev => {
                                const next = new Set(prev);
                                next.delete(col.data);
                                return next;
                              });
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="truncate">{col.title}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>{selectedColumns.size} of {COLUMN_DEFS.length} columns selected</span>
                    <button
                      onClick={() => setSelectedColumns(new Set(COLUMN_DEFS.map(col => col.data)))}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      Select All
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Share Options */}
            <div className="space-y-3">
              <div>
                <button
                  onClick={() => handleShare("read")}
                  disabled={shareLoading || (shareMode === "selected" && selectedColumns.size === 0)}
                  className="w-full flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-amber-500 mr-2" />
                    <span className="text-sm font-medium">Read Only</span>
                    {shareMode === "selected" && (
                      <span className="ml-2 text-xs text-neutral-500">
                        ({selectedColumns.size} columns)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">View only, no editing</span>
                </button>
                {shareLinks?.read && (
                  <div className="mt-2 p-2 bg-neutral-50 rounded text-xs text-neutral-600 break-all">
                    {shareLinks.read}
                  </div>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => handleShare("edit")}
                  disabled={shareLoading || (shareMode === "selected" && selectedColumns.size === 0)}
                  className="w-full flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium">Can Edit</span>
                    {shareMode === "selected" && (
                      <span className="ml-2 text-xs text-neutral-500">
                        ({selectedColumns.size} columns)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">Full editing access</span>
                </button>
                {shareLinks?.edit && (
                  <div className="mt-2 p-2 bg-neutral-50 rounded text-xs text-neutral-600 break-all">
                    {shareLinks.edit}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

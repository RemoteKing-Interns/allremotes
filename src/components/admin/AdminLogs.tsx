"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Search, Trash2, Download, RefreshCw, ChevronDown, ChevronRight, User, AlertTriangle, Info, CheckCircle, Bug, ArrowRight, Eye, ShoppingCart, Package, Settings, LogIn, LogOut, Zap, X } from "lucide-react";
import { LogEntry } from "../../lib/logger";
import toast from "react-hot-toast";

// ── Human-readable action labels ──────────────────────────────────────────────
function prettifyAction(action: string): string {
  const map: Record<string, string> = {
    page_view: "Viewed page",
    // orders
    "action:order_status_updated": "Updated order status",
    "error:order_status_update_failed": "Failed to update order status",
    "action:orders_pushed": "Pushed orders",
    "error:orders_push_failed": "Failed to push orders",
    // returns
    "action:return_updated": "Updated return",
    "error:return_update_failed": "Failed to update return",
    // products
    "action:product_saved": "Saved product",
    "action:product_created": "Created product",
    "action:product_updated": "Updated product",
    "action:product_edit_started": "Started editing product",
    "action:product_save_clicked": "Save button clicked",
    "action:product_auto_saved": "Product Auto Saved",
    "error:product_auto_save_failed": "Product Auto-Save Failed",
    "action:spreadsheet_bulk_save": "Bulk-saved products (spreadsheet)",
    "error:spreadsheet_save_failed": "Spreadsheet save failed",
    "error:product_save_failed": "Product save failed",
    // categories & brands
    "action:category_added": "Added category",
    "action:category_renamed": "Renamed category",
    "action:category_deleted": "Deleted category",
    "action:brand_added": "Added brand",
    "action:brand_renamed": "Renamed brand",
    "action:brand_deleted": "Deleted brand",
    // content
    "action:home_content_saved": "Saved homepage content",
    "action:navigation_saved": "Saved navigation",
    "action:reviews_saved": "Saved reviews",
    "action:review_deleted": "Deleted review",
    "action:promotions_saved": "Saved promotions",
    "action:settings_saved": "Saved settings",
    // abandoned carts
    "action:abandoned_cart_email_sent": "Sent abandoned cart email",
    "action:abandoned_cart_marked_contacted": "Marked cart as contacted",
    "action:abandoned_cart_deleted": "Deleted abandoned cart",
    "action:abandoned_carts_exported": "Exported abandoned carts",
    // admin
    "action:admin_data_reset": "Reset all admin data",
    "error:admin_data_reset_failed": "Admin data reset failed",
  };
  if (map[action]) return map[action];
  return action
    .replace(/^action:/, "")
    .replace(/^error:/, "Error: ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Inline detail summary shown on the log row itself ─────────────────────────
function summarizeLine(action: string, details: any): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as Record<string, any>;

  if (action === "action:order_status_updated")
    return `#${d.orderId} · ${d.customer ?? ""} · ${d.previousStatus} → ${d.newStatus}`;

  if (action === "error:order_status_update_failed")
    return `#${d.orderId} · tried → ${d.attemptedStatus} · ${d.error ?? ""}`;

  if (action === "action:orders_pushed")
    return `${d.orderCount} order${d.orderCount !== 1 ? "s" : ""} → ${d.targets} · group: ${d.groupLabel}${d.unleashedOrderNumber ? ` · UNL #${d.unleashedOrderNumber}` : ""}`;

  if (action === "error:orders_push_failed")
    return `${d.targets} · group: ${d.groupLabel} · ${d.error ?? ""}`;

  if (action === "action:return_updated")
    return `#${d.returnId} · fields: ${(d.fields ?? []).join(", ")}`;

  if (action === "action:product_saved" || action === "action:product_updated")
    return `${d.name}${d.sku ? ` · SKU: ${d.sku}` : ""} · ${d.changedFieldCount ?? 0} change${d.changedFieldCount === 1 ? "" : "s"}${d.changedFields?.length ? ` · ${d.changedFields.map((c: any) => c.field).join(", ")}` : ""}`;

  if (action === "action:product_created")
    return `${d.name}${d.sku ? ` · SKU: ${d.sku}` : ""} · ${d.category ?? ""}${d.brand ? ` · ${d.brand}` : ""}`;

  if (action === "action:product_save_clicked")
    return `${d.name}${d.sku ? ` · SKU: ${d.sku}` : ""}${d.isNewProduct ? " · new product" : ""}`;

  if (action === "action:product_auto_saved")
    return `${d.name}${d.sku ? ` · SKU: ${d.sku}` : ""} · ${d.fieldCount ?? 0} field${d.fieldCount === 1 ? "" : "s"} · ${(d.savedFields ?? []).join(", ")}`;

  if (action === "error:product_auto_save_failed")
    return `${d.name}${d.sku ? ` · SKU: ${d.sku}` : ""} · ${d.error ?? ""}`;

  if (action === "action:product_edit_started")
    return `${d.name}${d.sku ? ` · SKU: ${d.sku}` : ""} · ${d.category ?? ""}${d.brand ? ` · ${d.brand}` : ""}`;

  if (action === "error:product_save_failed")
    return `${d.name}${d.sku ? ` · SKU: ${d.sku}` : ""} · ${d.error ?? ""}`;

  if (action === "action:spreadsheet_bulk_save")
    return `${d.count ?? d.modifiedCount ?? "?"} products updated`;

  if (action === "action:category_renamed")
    return `"${d.from}" → "${d.to}"`;

  if (action === "action:brand_renamed")
    return `"${d.from}" → "${d.to}"`;

  if (action === "action:category_added" || action === "action:category_deleted")
    return `"${d.name}"`;

  if (action === "action:brand_added" || action === "action:brand_deleted")
    return `"${d.name}"`;

  if (action === "action:abandoned_cart_email_sent")
    return `${d.email} · ${d.discountPercent}% off`;

  if (action === "action:abandoned_cart_marked_contacted" || action === "action:abandoned_cart_deleted")
    return d.email ?? "";

  if (action === "action:abandoned_carts_exported")
    return `${d.count ?? "?"} carts`;

  if (action === "action:reviews_saved")
    return `${d.count ?? "?"} reviews`;

  if (action === "page_view")
    return d.page ?? d.tab ?? null;

  return null;
}

function getActionIcon(action: string) {
  if (action.startsWith("error:")) return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (action === "page_view") return <Eye className="h-4 w-4 text-neutral-400" />;
  if (action.includes("login")) return <LogIn className="h-4 w-4 text-emerald-500" />;
  if (action.includes("logout")) return <LogOut className="h-4 w-4 text-neutral-500" />;
  if (action.includes("order")) return <ShoppingCart className="h-4 w-4 text-blue-500" />;
  if (action.includes("product")) return <Package className="h-4 w-4 text-violet-500" />;
  if (action.includes("setting")) return <Settings className="h-4 w-4 text-neutral-500" />;
  if (action.includes("unleashed") || action.includes("pickops")) return <Zap className="h-4 w-4 text-amber-500" />;
  return <ArrowRight className="h-4 w-4 text-neutral-400" />;
}

const LEVEL_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  error: { pill: "bg-red-100 text-red-700 ring-red-200",    dot: "bg-red-500",    label: "Error" },
  warn:  { pill: "bg-amber-100 text-amber-700 ring-amber-200", dot: "bg-amber-400", label: "Warn"  },
  info:  { pill: "bg-blue-100 text-blue-700 ring-blue-200",   dot: "bg-blue-400",   label: "Info"  },
  debug: { pill: "bg-neutral-100 text-neutral-600 ring-neutral-200", dot: "bg-neutral-400", label: "Debug" },
};

function relativeTime(ts: Date | string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // fetch whenever page / level / date filters change
  useEffect(() => { fetchLogs(); }, [page, levelFilter, startDate, endDate]);

  // auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshRef.current = setInterval(fetchLogs, 10000);
    } else {
      if (refreshRef.current) clearInterval(refreshRef.current);
    }
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [autoRefresh, levelFilter, startDate, endDate, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (levelFilter) q.append("level", levelFilter);
      if (startDate) q.append("startDate", new Date(startDate).toISOString());
      if (endDate) q.append("endDate", new Date(endDate).toISOString());
      q.append("limit", pageSize.toString());
      q.append("offset", ((page - 1) * pageSize).toString());
      const res = await fetch(`/api/admin/logs?${q}`);
      const data = await res.json();
      if (res.ok) { setLogs(data.logs ?? []); setTotal(data.total ?? 0); }
      else toast.error(data.error || "Failed to fetch logs");
    } catch { toast.error("Failed to fetch logs"); }
    finally { setLoading(false); }
  };

  const clearLogs = async () => {
    if (!confirm("Clear all logs? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/logs", { method: "DELETE" });
      if (res.ok) { toast.success("Logs cleared"); fetchLogs(); }
      else toast.error("Failed to clear logs");
    } catch { toast.error("Failed to clear logs"); }
  };

  const clearFilters = () => {
    setSearch('');
    setLevelFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const exportLogs = async () => {
    try {
      const q = new URLSearchParams();
      if (levelFilter) q.append("level", levelFilter);
      if (startDate) q.append("startDate", new Date(startDate).toISOString());
      if (endDate) q.append("endDate", new Date(endDate).toISOString());
      q.append("export", "true");
      const res = await fetch(`/api/admin/logs?${q}`);
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `admin-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success("Exported");
    } catch { toast.error("Export failed"); }
  };

  // client-side search filter (action + user + details)
  const visible = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.userEmail?.toLowerCase().includes(q) ||
      (typeof log.details === "string" ? log.details : JSON.stringify(log.details ?? "")).toLowerCase().includes(q) ||
      log.route?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  const LEVELS = ["", "error", "warn", "info", "debug"] as const;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Activity Log</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{total} entries · showing page {page} of {Math.max(1, totalPages)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setAutoRefresh(v => !v); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${autoRefresh ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
          >
            <RefreshCw size={13} className={autoRefresh ? "animate-spin" : ""} />
            {autoRefresh ? "Live" : "Auto-refresh"}
          </button>
          <button onClick={fetchLogs} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={exportLogs} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={clearLogs} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100">
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search action, user, route…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        {/* Level pills */}
        <div className="flex gap-1">
          {LEVELS.map(l => {
            const style = l ? LEVEL_STYLES[l] : null;
            const active = levelFilter === l;
            return (
              <button
                key={l || "all"}
                onClick={() => { setLevelFilter(l); setPage(1); }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${active
                  ? l ? `${LEVEL_STYLES[l].pill} ring-1 ring-inset` : "bg-neutral-800 text-white border-neutral-800"
                  : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100"}`}
              >
                {l ? LEVEL_STYLES[l].label : "All"}
              </button>
            );
          })}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="px-2 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-400" />
          <span>–</span>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="px-2 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-400" />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }} className="text-neutral-400 hover:text-neutral-600 ml-1">✕</button>
          )}
        </div>

        {/* Clear filters */}
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          title="Clear all filters"
        >
          <X size={13} /> Clear filters
        </button>
      </div>

      {/* ── Timeline feed ── */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-500">No logs match your filters</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {visible.map(log => {
              const id = String(log._id || log.id);
              const expanded = expandedId === id;
              const ls = LEVEL_STYLES[log.level] ?? LEVEL_STYLES.debug;
              const hasDetails = log.details || log.route || log.method || log.statusCode || log.ip || log.error || log.metadata;

              return (
                <li key={id}>
                  <button
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${hasDetails ? "cursor-pointer hover:bg-neutral-50" : "cursor-default"} ${expanded ? "bg-neutral-50" : ""}`}
                    onClick={() => hasDetails && setExpandedId(expanded ? null : id)}
                  >
                    {/* level dot */}
                    <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${ls.dot}`} />

                    {/* action icon */}
                    <span className="shrink-0 mt-0.5">{getActionIcon(log.action)}</span>

                    {/* main content */}
                    <span className="flex-1 min-w-0">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-neutral-900">{prettifyAction(log.action)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-1 ring-inset ${ls.pill}`}>{ls.label}</span>
                        {log.route && (
                          <span className="text-xs text-neutral-400 font-mono truncate max-w-xs">
                            {log.method && <span className="text-violet-500 font-bold">{log.method} </span>}{log.route}
                            {log.statusCode && <span className={`ml-1 font-bold ${log.statusCode >= 400 ? "text-red-500" : "text-emerald-600"}`}>{log.statusCode}</span>}
                          </span>
                        )}
                      </span>
                      {summarizeLine(log.action, log.details) && (
                        <span className="block text-xs text-neutral-600 mt-0.5 truncate">
                          {summarizeLine(log.action, log.details)}
                        </span>
                      )}
                      <span className="flex flex-wrap items-center gap-x-3 mt-0.5 text-xs text-neutral-400">
                        {log.userEmail && <span className="flex items-center gap-1"><User size={11} />{log.userEmail}</span>}
                        {log.ip && <span>{log.ip}</span>}
                        {log.duration != null && <span>{log.duration}ms</span>}
                        <span title={new Date(log.timestamp).toLocaleString()}>{relativeTime(log.timestamp)}</span>
                      </span>
                    </span>

                    {/* expand chevron */}
                    {hasDetails && (
                      <span className="shrink-0 mt-1 text-neutral-300">
                        {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </span>
                    )}
                  </button>

                  {/* ── Expanded detail panel ── */}
                  {expanded && (
                    <div className="px-4 pb-4 pt-1 bg-neutral-50 border-t border-neutral-100">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                        <div><dt className="font-semibold text-neutral-500 uppercase tracking-wide text-[10px]">Timestamp</dt><dd className="text-neutral-800 mt-0.5">{new Date(log.timestamp).toLocaleString()}</dd></div>
                        {log.action && <div><dt className="font-semibold text-neutral-500 uppercase tracking-wide text-[10px]">Raw action</dt><dd className="font-mono text-neutral-700 mt-0.5">{log.action}</dd></div>}
                        {log.userEmail && <div><dt className="font-semibold text-neutral-500 uppercase tracking-wide text-[10px]">User</dt><dd className="text-neutral-800 mt-0.5">{log.userEmail}{log.userId && <span className="ml-1 text-neutral-400">({log.userId})</span>}</dd></div>}
                        {log.ip && <div><dt className="font-semibold text-neutral-500 uppercase tracking-wide text-[10px]">IP</dt><dd className="text-neutral-800 mt-0.5">{log.ip}</dd></div>}
                        {log.route && <div><dt className="font-semibold text-neutral-500 uppercase tracking-wide text-[10px]">Route</dt><dd className="font-mono text-neutral-700 mt-0.5">{log.method} {log.route}</dd></div>}
                        {log.statusCode && <div><dt className="font-semibold text-neutral-500 uppercase tracking-wide text-[10px]">Status</dt><dd className={`font-bold mt-0.5 ${log.statusCode >= 400 ? "text-red-600" : "text-emerald-600"}`}>{log.statusCode}</dd></div>}
                        {log.duration != null && <div><dt className="font-semibold text-neutral-500 uppercase tracking-wide text-[10px]">Duration</dt><dd className="text-neutral-800 mt-0.5">{log.duration}ms</dd></div>}
                        {log.userAgent && <div className="sm:col-span-2"><dt className="font-semibold text-neutral-500 uppercase tracking-wide text-[10px]">User Agent</dt><dd className="font-mono text-neutral-500 mt-0.5 break-all">{log.userAgent}</dd></div>}
                      </dl>
                      {log.error && (
                        <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-red-500 mb-1">Error</p>
                          <p className="text-xs font-mono text-red-700">{log.error}</p>
                        </div>
                      )}
                      {log.details && (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1">Details</p>
                          <pre className="text-xs bg-neutral-900 text-emerald-300 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                            {typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1">Metadata</p>
                          <pre className="text-xs bg-neutral-900 text-sky-300 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 text-xs font-medium">← Prev</button>
            <span className="px-3 py-1.5 text-xs font-semibold">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 text-xs font-medium">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

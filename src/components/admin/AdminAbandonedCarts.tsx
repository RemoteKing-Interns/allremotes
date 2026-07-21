"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductImage from "../images/ProductImage";
import {
  Package,
  Mail,
  RefreshCw,
  Search,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  CheckSquare,
  Square,
  Send,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  History,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { activityLogger } from "@/lib/activity-logger";

const TIME_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "6 hours", value: 6 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
  { label: "7 days", value: 168 }
];

export default function AdminAbandonedCarts() {
  const [carts, setCarts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hours, setHours] = useState(24);
  const [search, setSearch] = useState("");
  const [includeContacted, setIncludeContacted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<{ cart?: any; discountPercent: number; bulk?: boolean } | null>(null);
  const [viewModal, setViewModal] = useState<any>(null);
  const [autoSending, setAutoSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("hours", String(hours));
      if (search.trim()) params.set("search", search.trim());
      if (includeContacted) params.set("includeContacted", "true");
      const resp = await fetch(`/api/abandoned-carts?${params.toString()}`, { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to load abandoned carts");
      setCarts(Array.isArray(data?.carts) ? data.carts : []);
      setSelectedIds(new Set());
    } catch (err: any) {
      setCarts([]);
      setError(err?.message || "Failed to load abandoned carts");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const resp = await fetch(`/api/abandoned-carts/stats?hours=${hours}`, { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (resp.ok) setStats(data);
    } catch { /* ignore */ } finally { setStatsLoading(false); }
  };

  useEffect(() => {
    load();
    loadStats();
  }, [hours, includeContacted]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const getCartTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  };

  const formatCurrency = (value: number) => {
    return `AU$${value.toFixed(2)}`;
  };

  const getTimeSinceActivity = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === carts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(carts.map(c => c._id)));
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const markContacted = async (cart: any) => {
    setMarkingId(cart._id);
    try {
      const resp = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: cart.userId,
          email: cart.email,
          action: "mark_contacted"
        })
      });
      if (!resp.ok) throw new Error("Failed to mark contacted");
      toast.success("Marked as contacted");
      activityLogger.action("abandoned_cart_marked_contacted", { email: cart.email });
      await load();
      await loadStats();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setMarkingId(null);
    }
  };

  const deleteCart = async (cart: any) => {
    if (!confirm(`Delete abandoned cart for ${cart.email || cart.userId}?`)) return;
    setDeletingId(cart._id);
    try {
      const params = new URLSearchParams();
      if (cart.userId) params.set("userId", cart.userId);
      else if (cart.email) params.set("email", cart.email);
      const resp = await fetch(`/api/cart?${params.toString()}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Failed to delete cart");
      toast.success("Cart deleted");
      activityLogger.action("abandoned_cart_deleted", { email: cart.email });
      await load();
      await loadStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const sendDiscountEmail = async (cart: any, discountPercent: number) => {
    setSendingEmail(cart._id);
    setError("");
    try {
      const couponCode = `SAVE${discountPercent}${Date.now().toString(36).toUpperCase()}`;
      const couponResp = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          discountPercent,
          validDays: 7,
          customerEmail: cart.email,
          customerUserId: cart.userId
        })
      });
      if (!couponResp.ok) throw new Error("Failed to create coupon");
      const emailResp = await fetch("/api/abandoned-cart-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cart.email,
          couponCode,
          discountPercent,
          items: cart.items
        })
      });
      if (!emailResp.ok) throw new Error("Failed to send email");
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: cart.userId,
          email: cart.email,
          action: "mark_contacted"
        })
      });
      await load();
      await loadStats();
      setEmailModal(null);
      toast.success(`Discount email sent to ${cart.email}`);
      activityLogger.action("abandoned_cart_email_sent", { email: cart.email, discountPercent });
    } catch (err: any) {
      setError(err?.message || "Failed to send discount email");
      toast.error(err?.message || "Failed");
    } finally {
      setSendingEmail(null);
    }
  };

  const sendBulkDiscount = async (discountPercent: number) => {
    const selected = carts.filter(c => selectedIds.has(c._id));
    let success = 0;
    let failed = 0;
    setSendingEmail("bulk");
    for (const cart of selected) {
      if (!cart.email) { failed++; continue; }
      try {
        await sendDiscountEmail(cart, discountPercent);
        success++;
      } catch {
        failed++;
      }
    }
    setSendingEmail(null);
    setEmailModal(null);
    setSelectedIds(new Set());
    toast.success(`Sent ${success} emails${failed > 0 ? `, ${failed} failed` : ""}`);
  };

  const autoSend = async (discountPercent: number) => {
    setAutoSending(true);
    try {
      const resp = await fetch("/api/abandoned-carts/auto-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountPercent, hours })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Auto-send failed");
      toast.success(`Auto-sent ${data.sent} of ${data.total} reminder emails`);
      await load();
      await loadStats();
    } catch (err: any) {
      toast.error(err.message || "Auto-send failed");
    } finally {
      setAutoSending(false);
      setEmailModal(null);
    }
  };

  const exportCSV = () => {
    const rows = carts.map(cart => ({
      Email: cart.email || "",
      UserId: cart.userId || "",
      Items: (cart.items || []).map((i: any) => `${i.name || i.id} x${i.quantity || 1}`).join("; "),
      Total: getCartTotal(cart.items).toFixed(2),
      "Last Activity": cart.lastActivity || "",
      Contacted: cart.abandoned ? "Yes" : "No",
      "Contacted At": cart.contactedAt || ""
    }));
    if (rows.length === 0) {
      toast("No carts to export");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(row => headers.map(h => {
        const val = (row as any)[h];
        const str = String(val ?? "");
        return `"${str.replace(/"/g, "\"\"")}"`;
      }).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abandoned-carts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} carts`);
    activityLogger.action("abandoned_carts_exported", { count: rows.length });
  };

  const selectedCarts = useMemo(() => carts.filter(c => selectedIds.has(c._id)), [carts, selectedIds]);

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
            Abandoned Carts
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Carts with items that haven't been updated in the selected time window
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEmailModal({ discountPercent: 10 })}
            disabled={autoSending}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {autoSending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            Auto-send
          </button>
          <button
            onClick={exportCSV}
            disabled={carts.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => { load(); loadStats(); }}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Abandoned", value: stats?.totalAbandoned ?? 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Contacted", value: stats?.contacted ?? 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Recovered", value: stats?.recovered ?? 0, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Est. Revenue", value: formatCurrency(stats?.estimatedRevenue || 0), icon: History, color: "text-rose-600", bg: "bg-rose-50" }
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center gap-3 transition hover:shadow-sm hover:border-neutral-300">
            <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900">{statsLoading ? "—" : s.value}</div>
              <div className="text-xs text-neutral-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Clock size={16} className="text-neutral-400" />
          <span className="text-sm font-medium text-neutral-700">Abandoned for:</span>
          {TIME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setHours(opt.value)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                hours === opt.value
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-neutral-200 hidden sm:block" />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search email, user, product..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeContacted}
            onChange={e => setIncludeContacted(e.target.checked)}
            className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
          />
          Include contacted
        </label>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-emerald-800">
            {selectedIds.size} cart{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEmailModal({ discountPercent: 10, bulk: true })}
              disabled={sendingEmail === "bulk"}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Mail size={14} />
              Send Discount
            </button>
            <button
              onClick={async () => {
                for (const cart of selectedCarts) await markContacted(cart);
                setSelectedIds(new Set());
              }}
              disabled={markingId !== null}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
            >
              <CheckCircle size={14} />
              Mark Contacted
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-emerald-700 hover:text-emerald-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={18} className="animate-spin text-neutral-400 mr-2" />
          <div className="text-neutral-500">Loading abandoned carts...</div>
        </div>
      ) : carts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <Package size={48} className="mx-auto mb-4 text-neutral-400" />
          <h3 className="text-lg font-semibold text-neutral-900">No abandoned carts</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Carts that haven't been updated in the selected time window will appear here
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">
                  <button onClick={toggleAll} className="text-neutral-500 hover:text-emerald-600">
                    {selectedIds.size === carts.length ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Items</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Last Activity</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {carts.map((cart) => (
                <React.Fragment key={cart._id}>
                  <tr className={`hover:bg-neutral-50 ${cart.abandoned ? "bg-neutral-50/50" : ""}`}>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleSelect(cart._id)} className="text-neutral-500 hover:text-emerald-600">
                        {selectedIds.has(cart._id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-neutral-900">{cart.email || cart.userId}</div>
                      {cart.email && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <Link
                            href={`/admin?tab=customers`}
                            className="text-xs text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1"
                          >
                            View customer <ExternalLink size={10} />
                          </Link>
                          <span className="text-neutral-300">|</span>
                          <a
                            href={`mailto:${cart.email}`}
                            className="text-xs text-neutral-500 hover:text-neutral-700 inline-flex items-center gap-1"
                          >
                            Email <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-neutral-600">{cart.items?.length || 0} items</div>
                      <div className="text-xs text-neutral-400 max-w-xs truncate">
                        {cart.items?.slice(0, 2).map((item: any) => item.name).join(", ")}
                        {cart.items?.length > 2 && "..."}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-neutral-900">{formatCurrency(getCartTotal(cart.items))}</div>
                    </td>
                    <td className="px-4 py-4">
                      {cart.abandoned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <CheckCircle size={10} /> Contacted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-neutral-600">{getTimeSinceActivity(cart.lastActivity)}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => toggleExpand(cart._id)}
                          className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
                          title="View items"
                        >
                          {expandedIds.has(cart._id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <button
                          onClick={() => setViewModal(cart)}
                          className="p-2 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="View cart details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEmailModal({ cart, discountPercent: 10 })}
                          disabled={sendingEmail === cart._id || !cart.email}
                          className="p-2 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-40"
                          title="Send discount email"
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          onClick={() => markContacted(cart)}
                          disabled={cart.abandoned || markingId === cart._id}
                          className="p-2 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-40"
                          title="Mark as contacted"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => deleteCart(cart)}
                          disabled={deletingId === cart._id}
                          className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40"
                          title="Delete cart"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedIds.has(cart._id) && (
                    <tr className="bg-neutral-50/50">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(cart.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-white rounded-lg border border-neutral-200 p-3">
                              {item.image ? (
                                <div className="relative h-12 w-12 shrink-0">
                                  <ProductImage
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="48px"
                                    className="rounded-md object-cover border border-neutral-200"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <div className="h-12 w-12 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-400">
                                  <Package size={18} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/product/${item.id || item.productId}`}
                                  target="_blank"
                                  className="text-sm font-medium text-neutral-900 hover:text-emerald-600 truncate block"
                                >
                                  {item.name || item.id || "Unknown item"}
                                </Link>
                                <div className="text-xs text-neutral-500">
                                  {item.quantity || 1} × {formatCurrency(item.price || 0)}
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-neutral-700">
                                {formatCurrency((item.price || 0) * (item.quantity || 1))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900">
                {emailModal.bulk ? `Send Discount to ${selectedIds.size} Carts` : "Send Discount Email"}
              </h3>
              <button onClick={() => setEmailModal(null)} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg hover:bg-neutral-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {emailModal.cart && (
                <div className="rounded-lg bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-600">
                    Send a discount email to <strong>{emailModal.cart.email}</strong> for their abandoned cart ({formatCurrency(getCartTotal(emailModal.cart.items))})
                  </p>
                </div>
              )}
              {emailModal.bulk && (
                <div className="rounded-lg bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-600">
                    Send discount emails to all {selectedIds.size} selected carts.
                  </p>
                </div>
              )}
              {!emailModal.cart && !emailModal.bulk && (
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                  <p className="text-sm text-purple-700">
                    Automatically send discount emails to all pending abandoned carts matching the current filter ({hours}h window).
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Discount Percentage</label>
                <select
                  value={emailModal.discountPercent}
                  onChange={(e) => setEmailModal({ ...emailModal, discountPercent: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
                >
                  <option value={5}>5% off</option>
                  <option value={10}>10% off</option>
                  <option value={15}>15% off</option>
                  <option value={20}>20% off</option>
                  <option value={25}>25% off</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEmailModal(null)}
                  className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (emailModal.bulk) sendBulkDiscount(emailModal.discountPercent);
                    else if (emailModal.cart) sendDiscountEmail(emailModal.cart, emailModal.discountPercent);
                    else autoSend(emailModal.discountPercent);
                  }}
                  disabled={sendingEmail === "bulk" || (emailModal.cart && sendingEmail === emailModal.cart._id) || autoSending}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sendingEmail === "bulk" || (emailModal.cart && sendingEmail === emailModal.cart._id) || autoSending
                    ? "Sending..."
                    : emailModal.bulk
                    ? `Send to ${selectedIds.size} carts`
                    : emailModal.cart
                    ? "Send Email"
                    : "Auto-send all"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900">Cart Details</h3>
              <button onClick={() => setViewModal(null)} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg hover:bg-neutral-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-xs text-neutral-500">Customer</div>
                  <div className="text-sm font-medium text-neutral-900">{viewModal.email || viewModal.userId}</div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-xs text-neutral-500">Total</div>
                  <div className="text-sm font-medium text-neutral-900">{formatCurrency(getCartTotal(viewModal.items))}</div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-xs text-neutral-500">Last Activity</div>
                  <div className="text-sm font-medium text-neutral-900">{getTimeSinceActivity(viewModal.lastActivity)}</div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-xs text-neutral-500">Status</div>
                  <div className="text-sm font-medium text-neutral-900">{viewModal.abandoned ? "Contacted" : "Pending"}</div>
                </div>
              </div>
              <h4 className="text-sm font-semibold text-neutral-800">Items ({viewModal.items?.length || 0})</h4>
              <div className="space-y-2">
                {(viewModal.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-white rounded-lg border border-neutral-200 p-3">
                    {item.image ? (
                      <div className="relative h-14 w-14 shrink-0">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="rounded-md object-cover border border-neutral-200"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-400">
                        <Package size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.id || item.productId}`}
                        target="_blank"
                        className="text-sm font-medium text-neutral-900 hover:text-emerald-600 truncate block"
                      >
                        {item.name || item.id || "Unknown item"}
                      </Link>
                      <div className="text-xs text-neutral-500">
                        SKU: {item.sku || item.id || "—"}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-600">
                      {item.quantity || 1} × {formatCurrency(item.price || 0)}
                    </div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

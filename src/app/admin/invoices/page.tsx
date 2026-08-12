"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Loader2,
  Package,
  Printer,
  RefreshCw,
  Trash2,
  Truck,
  X,
} from "lucide-react";

interface Invoice {
  _id?: string;
  id: string;
  type?: string;
  status: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  items: {
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  pricing: {
    currency: string;
    subtotal: number;
    discountTotal: number;
    total: number;
  };
  notes?: string;
  payment?: {
    method?: string;
    status?: string;
  };
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
}

const statusBadge = (status: string) => {
  const base = "inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold";
  switch (status) {
    case "paid":
    case "shipped":
      return `${base} bg-emerald-100 text-emerald-700`;
    case "unpaid":
      return `${base} bg-amber-100 text-amber-700`;
    default:
      return `${base} bg-neutral-100 text-neutral-600`;
  }
};

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const list = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/invoices");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.orders) throw new Error(data?.error || "Failed to load");
      setInvoices(data.orders);
    } catch (err: any) {
      setError(err?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    list();
  }, []);

  const runAction = async (id: string, action: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.order) throw new Error(data?.error || "Action failed");
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? (data.order as Invoice) : inv))
      );
      if (selected?.id === id) {
        setSelected(data.order as Invoice);
      }
    } catch (err: any) {
      setError(err?.message || "Action failed");
    } finally {
      setActionId(null);
    }
  };

  const removeInvoice = async (id: string) => {
    if (!confirm(`Delete invoice ${id}?`)) return;
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totals = useMemo(() => {
    if (!selected) return null;
    const subtotal = selected.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountTotal = selected.pricing?.discountTotal || 0;
    const total = subtotal - discountTotal;
    return { subtotal, discountTotal, total };
  }, [selected]);

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="container mx-auto max-w-6xl print:hidden">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Invoices</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={list}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => router.push("/admin/invoice")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-extrabold text-white hover:bg-primary-dark"
            >
              + New Invoice
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-panel">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 font-semibold text-neutral-700">Invoice #</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">Customer</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">Total</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">Status</th>
                <th className="px-4 py-3 font-semibold text-neutral-700">Created</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No invoices yet.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{inv.id}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {inv.customer?.fullName}
                    {inv.customer?.email && (
                      <div className="text-xs text-neutral-500">{inv.customer.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    ${(inv.pricing?.total || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(inv.status)}>{inv.status.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(inv.createdAt).toLocaleDateString("en-AU")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelected(inv)}
                        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                        title="View / Print"
                      >
                        <Eye size={16} />
                      </button>
                      {inv.status !== "paid" && inv.status !== "shipped" && (
                        <button
                          onClick={() => runAction(inv.id, "paid")}
                          disabled={actionId === inv.id}
                          className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                          title="Mark as paid"
                        >
                          {actionId === inv.id ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                        </button>
                      )}
                      {inv.status === "paid" && (
                        <button
                          onClick={() => runAction(inv.id, "shipped")}
                          disabled={actionId === inv.id}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          title="Mark as shipped"
                        >
                          {actionId === inv.id ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                        </button>
                      )}
                      <button
                        onClick={() => removeInvoice(inv.id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">Invoice {selected.id}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-neutral-800"
                >
                  <Printer size={16} />
                  Print
                </button>
                <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-neutral-200">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-4 flex items-center gap-2">
                {selected.status === "unpaid" && (
                  <button
                    onClick={() => runAction(selected.id, "paid")}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
                  >
                    <Package size={16} />
                    Mark as Paid
                  </button>
                )}
                {selected.status === "paid" && (
                  <button
                    onClick={() => runAction(selected.id, "shipped")}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-700"
                  >
                    <Truck size={16} />
                    Mark as Shipped
                  </button>
                )}
                {selected.status !== "unpaid" && (
                  <button
                    onClick={() => runAction(selected.id, "reopen")}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Reopen
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-panel print:rounded-none print:border-0 print:shadow-none" id="invoice-preview">
                <div className="mb-8 flex items-start justify-between border-b border-neutral-200 pb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900">INVOICE</h3>
                    <p className="mt-1 text-sm text-neutral-500">#{selected.id}</p>
                  </div>
                  <div className="text-right text-sm text-neutral-600">
                    <img
                      src="/images/logo.png"
                      alt="All Remotes"
                      className="mb-2 ml-auto h-12 w-auto object-contain"
                    />
                    <p className="font-semibold">ALL REMOTES PTY LTD</p>
                    <p className="text-xs text-neutral-500">ABN: 23 679 611 351</p>
                    <p className="text-xs text-neutral-500">32 Bell Street, Yarra Glen, Victoria 3775</p>
                    <p className="text-xs text-neutral-500">info@allremotes.com.au</p>
                    <p className="text-xs text-neutral-500">allremotes.com.au</p>
                    <p>{new Date(selected.createdAt).toLocaleDateString("en-AU")}</p>
                    <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-700">
                      {selected.status.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="mb-8 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Bill to</p>
                    <p className="mt-1 font-semibold text-neutral-900">{selected.customer.fullName}</p>
                    {selected.customer.email && <p className="text-sm text-neutral-600">{selected.customer.email}</p>}
                    {selected.customer.phone && <p className="text-sm text-neutral-600">{selected.customer.phone}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Ship to</p>
                    <div className="mt-1 text-sm text-neutral-600">
                      <p>{selected.shipping.address}</p>
                      <p>
                        {[selected.shipping.city, selected.shipping.state, selected.shipping.zipCode]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                      <p>{selected.shipping.country}</p>
                      {selected.shipping.phone && <p>{selected.shipping.phone}</p>}
                    </div>
                  </div>
                </div>

                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="pb-2 font-semibold text-neutral-900">Item</th>
                      <th className="pb-2 text-right font-semibold text-neutral-900">Qty</th>
                      <th className="pb-2 text-right font-semibold text-neutral-900">Price</th>
                      <th className="pb-2 text-right font-semibold text-neutral-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selected.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3">
                          <p className="font-medium text-neutral-900">{item.name}</p>
                          {item.sku && <p className="text-xs text-neutral-500">SKU: {item.sku}</p>}
                        </td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        <td className="py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 text-right font-semibold">${item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6 flex flex-col items-end border-t border-neutral-200 pt-6">
                  <div className="w-full max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal</span>
                      <span>${(totals?.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {(totals?.discountTotal || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-${(totals?.discountTotal || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-neutral-200 pt-2 text-lg font-bold text-neutral-900">
                      <span>Total</span>
                      <span>${(totals?.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {selected.notes && (
                  <div className="mt-8 text-sm text-neutral-600">
                    <p className="font-semibold text-neutral-900">Notes</p>
                    <p>{selected.notes}</p>
                  </div>
                )}

                <div className="mt-8 border-t border-neutral-200 pt-6 text-sm">
                  <p className="font-semibold text-neutral-900">Terms</p>
                  <p className="mt-1 text-neutral-600">All prices include GST.</p>
                  <p className="text-neutral-600">Australia-wide shipping only.</p>
                </div>

                <div className="mt-8 border-t border-neutral-200 pt-6 text-sm">
                  <p className="font-semibold text-neutral-900">Payment Details</p>
                  <p className="mt-1 text-neutral-600">Please transfer to:</p>
                  <div className="mt-2 space-y-0.5 text-neutral-700">
                    <p><span className="font-medium">Account name:</span> Allremotes pty ltd</p>
                    <p><span className="font-medium">BSB:</span> 033-372</p>
                    <p><span className="font-medium">Account number:</span> 759094</p>
                    <p className="mt-2 text-neutral-500">For future orders, visit allremotes.com.au or email info@allremotes.com.au</p>
                  </div>
                </div>

                {selected.status === "paid" && (
                  <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-center text-emerald-800">
                    <p className="text-lg font-bold">PAID</p>
                    {selected.paidAt && <p className="text-xs">{new Date(selected.paidAt).toLocaleDateString("en-AU")}</p>}
                  </div>
                )}
                {selected.status === "shipped" && (
                  <div className="mt-4 rounded-lg bg-blue-50 p-4 text-center text-blue-800">
                    <p className="text-lg font-bold">SHIPPED</p>
                    {selected.shippedAt && <p className="text-xs">{new Date(selected.shippedAt).toLocaleDateString("en-AU")}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

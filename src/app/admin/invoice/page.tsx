"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../../../context/StoreContext";
import { FileText, Plus, Printer, Trash2 } from "lucide-react";

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  rk_sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface InvoiceData {
  id: string;
  type: string;
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
  items: InvoiceItem[];
  pricing: {
    currency: string;
    subtotal: number;
    discountTotal: number;
    total: number;
  };
  notes: string;
  createdAt: string;
}

function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export default function AdminInvoicePage() {
  const { getProducts, refreshProductsFromServer } = useStore();

  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [shipping, setShipping] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "AU",
    phone: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "",
      productId: "",
      name: "",
      sku: "",
      rk_sku: "",
      category: "",
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
    },
  ]);

  const [notes, setNotes] = useState("");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);

  useEffect(() => {
    refreshProductsFromServer().catch(() => {});
  }, [refreshProductsFromServer]);

  const products = useMemo(() => (getProducts() || []).filter(Boolean), [getProducts]);

  const updateItem = (index: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => {
      const next = [...prev];
      const row = { ...next[index], ...patch };
      const qty = Math.max(1, Math.floor(Number(row.quantity) || 1));
      const price = roundMoney(row.unitPrice);
      row.quantity = qty;
      row.unitPrice = price;
      row.lineTotal = roundMoney(qty * price);
      next[index] = row;
      return next;
    });
  };

  const onSelectProduct = (index: number, productId: string) => {
    const product = products.find((p: any) => String(p?.id) === productId);
    if (!product) return;
    updateItem(index, {
      productId,
      id: product.id,
      name: product.name || "",
      sku: product.sku || "",
      rk_sku: product.rk_sku || "",
      category: product.category || "",
      unitPrice: roundMoney(product.price ?? 0),
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: "",
        productId: "",
        name: "",
        sku: "",
        rk_sku: "",
        category: "",
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const loadOrder = async () => {
    const id = orderNumber.trim();
    if (!id) return;
    setLoadingOrder(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.order) throw new Error(data?.error || "Order not found");
      const o = data.order;
      setCustomer({
        fullName: o.customer?.fullName || "",
        email: o.customer?.email || "",
        phone: o.customer?.phone || "",
      });
      setShipping({
        address: o.shipping?.address || "",
        city: o.shipping?.city || "",
        state: o.shipping?.state || "",
        zipCode: o.shipping?.zipCode || "",
        country: o.shipping?.country || "AU",
        phone: o.shipping?.phone || "",
      });
      const loaded = (o.items || []).map((item: any) => {
        const product = products.find((p: any) => p?.id === item?.id || p?.sku === item?.sku);
        const qty = Math.max(1, Number(item?.quantity) || 1);
        const price = roundMoney(Number(item?.unitPrice) || 0);
        return {
          id: product?.id || item?.id || "",
          productId: product?.id || "",
          name: item?.name || "",
          sku: item?.sku || "",
          rk_sku: item?.rk_sku || "",
          category: item?.category || "",
          quantity: qty,
          unitPrice: price,
          lineTotal: roundMoney(qty * price),
        };
      });
      if (loaded.length === 0) throw new Error("No items found in order");
      setItems(loaded);
      setNotes(`Invoice generated from order ${orderNumber}` + (o.notes ? `. ${o.notes}` : ""));
    } catch (err: any) {
      setError(err?.message || "Failed to load order");
    } finally {
      setLoadingOrder(false);
    }
  };

  const totals = useMemo(() => {
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
    return { subtotal, total: subtotal };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInvoice(null);

    if (!customer.fullName.trim()) {
      setError("Customer name is required");
      return;
    }
    if (items.some((i) => !i.name.trim())) {
      setError("Every line item needs a name");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer,
        shipping,
        items,
        pricing: {
          currency: "AUD",
          subtotal: totals.subtotal,
          discountTotal: 0,
          total: totals.total,
        },
        notes,
      };

      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.order) {
        throw new Error(data?.error || data?.details || "Failed to create invoice");
      }

      setInvoice(data.order as InvoiceData);
    } catch (err: any) {
      setError(err?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-6 print:bg-white print:p-0">
      <div className="container mx-auto max-w-5xl print:hidden">
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900 flex items-center gap-2">
          <FileText size={24} className="text-primary" />
          Create Unpaid Invoice
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Generate from order number</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                placeholder="Order number, e.g. ARSO-000001"
              />
              <button
                type="button"
                onClick={loadOrder}
                disabled={loadingOrder || !orderNumber.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {loadingOrder ? "Loading..." : "Load order"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Customer</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-700">Name</label>
                <input
                  required
                  value={customer.fullName}
                  onChange={(e) => setCustomer((c) => ({ ...c, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-700">Email</label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-700">Phone</label>
                <input
                  value={customer.phone}
                  onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                  placeholder="Phone number"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Shipping Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-neutral-700">Address</label>
                <input
                  value={shipping.address}
                  onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-700">City</label>
                <input
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-700">State</label>
                <input
                  value={shipping.state}
                  onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-700">Postcode</label>
                <input
                  value={shipping.zipCode}
                  onChange={(e) => setShipping((s) => ({ ...s, zipCode: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                  placeholder="Postcode"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-neutral-700">Country</label>
                <input
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                  placeholder="Country"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-extrabold text-white hover:bg-primary-dark"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid items-end gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-12"
                >
                  <div className="sm:col-span-5">
                    <label className="mb-1 block text-sm font-semibold text-neutral-700">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => onSelectProduct(index, e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                    >
                      <option value="">Select a product</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name} {p.sku ? `(${p.sku})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-neutral-700">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-neutral-700">Price</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-neutral-500">Line total</label>
                    <div className="px-1 py-2.5 text-sm font-semibold text-neutral-900">
                      ${item.lineTotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-4 border-t border-neutral-200 pt-4">
              <span className="text-sm font-semibold text-neutral-600">Total:</span>
              <span className="text-xl font-bold text-primary">${totals.total.toFixed(2)} AUD</span>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel">
            <label className="mb-1 block text-sm font-semibold text-neutral-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-primary focus:outline-none"
              rows={3}
              placeholder="Optional invoice notes"
            />
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark disabled:opacity-60"
            >
              <FileText size={18} />
              {loading ? "Creating..." : "Generate Unpaid Invoice"}
            </button>
          </div>
        </form>
      </div>

      {invoice && (
        <div className="container mx-auto max-w-3xl print:max-w-none">
          <div className="mb-6 flex items-center justify-between print:hidden">
            <h2 className="text-xl font-semibold text-neutral-900">Invoice Preview</h2>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-neutral-800"
            >
              <Printer size={18} />
              Print / Save PDF
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-panel print:rounded-none print:border-0 print:shadow-none">
            <div className="mb-8 flex items-start justify-between border-b border-neutral-200 pb-6">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900">INVOICE</h3>
                <p className="mt-1 text-sm text-neutral-500">#{invoice.id}</p>
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
                <p>{new Date(invoice.createdAt).toLocaleDateString("en-AU")}</p>
                <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-700">
                  {invoice.status.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="mb-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Bill to</p>
                <p className="mt-1 font-semibold text-neutral-900">{invoice.customer.fullName}</p>
                {invoice.customer.email && <p className="text-sm text-neutral-600">{invoice.customer.email}</p>}
                {invoice.customer.phone && <p className="text-sm text-neutral-600">{invoice.customer.phone}</p>}
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Ship to</p>
                <div className="mt-1 text-sm text-neutral-600">
                  <p>{invoice.shipping.address}</p>
                  <p>{[invoice.shipping.city, invoice.shipping.state, invoice.shipping.zipCode].filter(Boolean).join(" ")}</p>
                  <p>{invoice.shipping.country}</p>
                  {invoice.shipping.phone && <p>{invoice.shipping.phone}</p>}
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
                {invoice.items.map((item, i) => (
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
                  <span>${invoice.pricing.subtotal.toFixed(2)}</span>
                </div>
                {invoice.pricing.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-${invoice.pricing.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-lg font-bold text-neutral-900">
                  <span>Total</span>
                  <span>${invoice.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-8 text-sm text-neutral-600">
                <p className="font-semibold text-neutral-900">Notes</p>
                <p>{invoice.notes}</p>
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
          </div>
        </div>
      )}
    </main>
  );
}

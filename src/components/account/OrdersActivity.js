"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { btn, tw } from "./tw";
import { cn } from "../../lib/utils";
import SupportChat from "./SupportChat";

const RETURN_WINDOW_DAYS = 365;

const RETURN_REASONS = [
  { value: "faulty", label: "Faulty / Defective Product" },
  { value: "stopped_working", label: "Stopped Working (No Physical Damage)" },
];

function getReturnWindowStart(order) {
  // 12-month warranty counts from shipped date only; fall back to order creation date
  return order.shippedAt || order.shippedDate || order.createdAt;
}

function isWithinReturnWindow(order) {
  const referenceDate = getReturnWindowStart(order);
  if (!referenceDate) return false;
  const diffDays = Math.floor((Date.now() - new Date(referenceDate)) / (1000 * 60 * 60 * 24));
  return diffDays <= RETURN_WINDOW_DAYS;
}

function getDaysRemaining(order) {
  const referenceDate = getReturnWindowStart(order);
  if (!referenceDate) return 0;
  const diffDays = Math.floor((Date.now() - new Date(referenceDate)) / (1000 * 60 * 60 * 24));
  return Math.max(0, RETURN_WINDOW_DAYS - diffDays);
}

function canRequestReturn(order) {
  const status = String(order.status || "").toLowerCase();
  return (status === "delivered" || status === "shipped" || status === "customer_received") && isWithinReturnWindow(order);
}

const OrdersActivity = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const email = useMemo(() => (user?.email || "").trim(), [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!email) return;
      setLoading(true);
      setError("");
      try {
        const resp = await fetch(`/api/orders?email=${encodeURIComponent(email)}`, { cache: "no-store" });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || "Failed to load orders");
        if (cancelled) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setOrders([]);
        setError(err?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const getStatusClass = (status) => {
    const normalized = String(status || "pending").toLowerCase();
    if (normalized === "pending" || normalized === "open") return tw.badgePending;
    if (normalized === "processing") return tw.badgeProcessing;
    if (normalized === "shipped") return tw.badgeShipped;
    if (normalized === "delivered" || normalized === "resolved") return tw.badgeDelivered;
    if (normalized === "cancelled" || normalized === "closed") return tw.badgeCancelled;
    return "";
  };

  const handleReturnClick = (order) => {
    setReturnModalOrder(order);
  };

  const handleCancelOrder = async (order) => {
    if (!confirm(`Are you sure you want to cancel order ${order.id}?`)) return;

    try {
      const resp = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!resp.ok) throw new Error('Failed to cancel order');

      // Update local state
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      alert(err?.message || 'Failed to cancel order');
    }
  };

  const handleMarkReceived = async (order) => {
    if (!confirm(`Mark order ${order.id} as received?`)) return;

    try {
      const resp = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: 'customer_received', customerEmail: email })
      });

      if (!resp.ok) throw new Error('Failed to mark order as received');

      // Update local state
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'customer_received', customerReceivedAt: new Date().toISOString() } : o));
    } catch (err) {
      alert(err?.message || 'Failed to mark order as received');
    }
  };

  const canCancelOrder = (order) => {
    const status = String(order.status || "").toLowerCase();
    // Cannot cancel once shipped or beyond
    return status === "" || status === "pending" || status === "processing" || status === "open";
  };

  const canMarkReceived = (order) => {
    const status = String(order.status || "").toLowerCase();
    return status === "shipped" || status === "delivered"; // hide once already marked
  };

  return (
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Orders & Shopping Activity</h2>
      
      <div className={tw.sectionContent}>
        {error && <div className={`${tw.error} mb-1`}>{error}</div>}
        {loading ? (
          <div className={tw.emptyState}>
            <p>Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className={tw.emptyState}>
            <p>No orders yet</p>
            <Link href="/products/all" className={btn.gradient}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className={tw.gridList}>
            {orders.map(order => {
              const canReturn = canRequestReturn(order);
              const daysRemaining = getDaysRemaining(order);
              const status = String(order.status || "").toLowerCase();
              const isDeliveredOrShipped = status === "delivered" || status === "shipped" || status === "customer_received";
              const canCancel = canCancelOrder(order);
              const canMark = canMarkReceived(order);
              
              return (
                <div key={order.id} className={tw.card}>
                  <div className={tw.cardHeader}>
                    <div>
                      <h3 className={tw.strongText}>Order {order.id}</h3>
                      <p className={tw.muted}>Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <span
                      className={cn(
                        tw.badgeStatus,
                        getStatusClass(order.status || "pending"),
                      )}
                    >
                      {order.status || "Pending"}
                    </span>
                  </div>
                  
                  <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}</p>
                    <ul className="grid gap-1 text-sm text-neutral-700">
                      {(order.items || []).slice(0, 6).map((item, idx) => (
                        <li key={idx}>{item?.name || 'Item'}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
                    <div className="text-sm text-neutral-700">
                      <span>Total: </span>
                      <strong className="text-base font-extrabold text-neutral-900">AU${Number(order?.pricing?.total || 0).toFixed(2)}</strong>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 max-sm:justify-start">
                      <button
                        type="button"
                        className={btn.outlineSm}
                        onClick={() => setExpandedId((id) => (id === order.id ? null : order.id))}
                      >
                        {expandedId === order.id ? "Hide Details" : "View Details"}
                      </button>
                      <button className={btn.outlineDangerSm} disabled title="Invoice downloads coming soon">
                        Download Invoice
                      </button>
                      {canCancel && (
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800"
                          onClick={() => handleCancelOrder(order)}
                          title="Cancel this order"
                        >
                          Cancel Order
                        </button>
                      )}
                      {canMark && (
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-800"
                          onClick={() => handleMarkReceived(order)}
                          title="Mark this order as received"
                        >
                          Mark as Received
                        </button>
                      )}
                      {isDeliveredOrShipped && canReturn && (
                        <button
                          className={btn.secondarySm}
                          onClick={() => handleReturnClick(order)}
                          title={`${daysRemaining} days remaining to request return`}
                        >
                          Request Return
                        </button>
                      )}
                    </div>
                  </div>

                  {isDeliveredOrShipped && (
                    canReturn ? (
                      <div className="mt-2 text-xs text-accent-dark">
                        Warranty expiring in <span className="font-semibold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-neutral-400">
                        Warranty window closed (12 months from shipment)
                      </div>
                    )
                  )}

                  {expandedId === order.id && (
                    <div className="mt-3 space-y-3">
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                        <div className="grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
                          <div><strong>Status:</strong> {order.status}</div>
                          <div><strong>Ship to:</strong> {order?.shipping?.address}, {order?.shipping?.city} {order?.shipping?.state} {order?.shipping?.zipCode}</div>
                          <div><strong>Subtotal:</strong> AU${Number(order?.pricing?.subtotal || 0).toFixed(2)}</div>
                          {order?.pricing?.discountTotal ? (
                            <div><strong>Discount:</strong> -AU${Number(order?.pricing?.discountTotal || 0).toFixed(2)}</div>
                          ) : null}
                          <div><strong>Total:</strong> AU${Number(order?.pricing?.total || 0).toFixed(2)}</div>
                          {(order.shippedAt || order.shippedDate) && (
                            <div><strong>Shipped:</strong> {new Date(order.shippedAt || order.shippedDate).toLocaleDateString()}</div>
                          )}
                          {(order.deliveredAt || order.deliveredDate) && (
                            <div><strong>Delivered:</strong> {new Date(order.deliveredAt || order.deliveredDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                      {canReturn ? (
                        <SupportChat orderId={order.id} />
                      ) : isDeliveredOrShipped ? (
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
                          <p className="text-sm font-medium text-neutral-500">Support chat closed</p>
                          <p className="mt-1 text-xs text-neutral-400">The support window for this order has expired.</p>
                          <p className="mt-1 text-xs text-neutral-400">Email us at <a href="mailto:shane@allremotes.com.au" className="text-accent-dark hover:underline">shane@allremotes.com.au</a></p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {returnModalOrder && (
        <ReturnRequestModal
          order={returnModalOrder}
          user={user}
          onClose={() => setReturnModalOrder(null)}
        />
      )}

    </div>
  );
};

const MAX_PHOTOS = 5;

function ReturnRequestModal({ order, user, onClose }) {
  const [selectedItems, setSelectedItems] = useState(
    (order.items || []).map((item, idx) => ({ ...item, selected: true, returnQty: item.quantity || 1, idx }))
  );
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const toggleItem = (idx) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.idx === idx ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateQty = (idx, qty) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.idx === idx ? { ...item, returnQty: Math.max(1, Math.min(qty, item.quantity || 1)) } : item))
    );
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => prev.length < MAX_PHOTOS ? [...prev, ev.target.result] : prev);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const itemsToReturn = selectedItems.filter((item) => item.selected);
    if (itemsToReturn.length === 0) {
      setError("Please select at least one item");
      return;
    }
    if (!reason) {
      setError("Please select a reason");
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderDate: order.createdAt,
          customerEmail: user?.email || order?.customer?.email || "",
          customerName: user?.name || order?.customer?.fullName || order?.customer?.name || "",
          items: itemsToReturn.map((item) => ({
            productId: item.id || item.productId || "",
            productName: item.name || item.productName || "",
            quantity: item.returnQty,
            price: item.price || 0,
          })),
          reason,
          reasonDetails,
          photos,
          shippedDate: order.shippedAt || order.shippedDate,
        }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to submit warranty claim");

      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Failed to submit warranty claim");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
            <h3 className="text-xl font-bold text-neutral-900">Warranty Claim Submitted</h3>
            <p className="mt-2 text-sm text-neutral-600">
              We&apos;ll review your claim within <strong>1–2 business days</strong> and email you at{" "}
              <strong>{user?.email}</strong> with next steps.
            </p>
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-left">
              <p className="text-xs text-amber-800 font-semibold mb-1">What happens next?</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>We review your request in 1–2 business days</li>
                <li>If approved, you ship the item back at your expense</li>
                <li>We inspect within 10–15 business days of receiving it</li>
                <li>Resolution: exchange or refund at our discretion</li>
              </ul>
            </div>
            <button onClick={onClose} className={`${btn.gradient} mt-6`}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <h3 className="text-xl font-bold text-neutral-900">Warranty / Return Claim</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-2xl">×</button>
        </div>

        <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-800">
            <strong>12-Month Warranty:</strong> We accept claims for faulty or stopped-working products within 12 months of shipment.
            Items with physical damage are not covered. Resolution is an exchange or refund at our discretion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-700">Order: {order.id}</p>
            <p className="text-xs text-neutral-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Select Items</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.idx} className={`flex items-center gap-3 rounded-xl border p-3 ${item.selected ? 'border-accent bg-accent/5' : 'border-neutral-200 bg-white'}`}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(item.idx)}
                    className="h-5 w-5 rounded border-neutral-300 text-accent focus:ring-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{item.name || item.productName || 'Item'}</p>
                    <p className="text-xs text-neutral-500">Qty ordered: {item.quantity}</p>
                  </div>
                  {item.selected && item.quantity > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-500">Qty claiming:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity || 1}
                        value={item.returnQty}
                        onChange={(e) => updateQty(item.idx, parseInt(e.target.value) || 1)}
                        className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-accent focus:ring-accent"
              required
            >
              <option value="">Select a reason...</option>
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Description *</label>
            <textarea
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Describe the issue in detail — when it started, what happens, any error codes..."
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-accent focus:ring-accent min-h-[90px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Photos <span className="text-neutral-400 font-normal">(up to {MAX_PHOTOS})</span>
            </label>
            <div className="space-y-2">
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt={`photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-neutral-200" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < MAX_PHOTOS && (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500 hover:border-accent hover:text-accent transition">
                  <span>+ Add photo{photos.length > 0 ? ` (${photos.length}/${MAX_PHOTOS})` : ''}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                </label>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800">
              <strong>Return shipping is at your expense.</strong> Once approved, we&apos;ll email you the return address.
              After we receive the item, inspection takes 10–15 business days.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className={btn.outline}>Cancel</button>
            <button type="submit" disabled={submitting} className={btn.gradient}>
              {submitting ? "Submitting..." : "Submit Warranty Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default OrdersActivity;

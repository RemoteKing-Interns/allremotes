"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { btn, tw } from "./tw";
import { cn } from "../../lib/utils";

const RETURN_WINDOW_DAYS = 30;

const RETURN_REASONS = [
  { value: "faulty", label: "Faulty / Defective Product" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "not_as_described", label: "Not As Described" },
  { value: "changed_mind", label: "Changed My Mind" },
  { value: "other", label: "Other" },
];

const ITEM_CONDITIONS = [
  { value: "unopened", label: "Unopened / Sealed" },
  { value: "opened_unused", label: "Opened but Unused" },
  { value: "used", label: "Used" },
  { value: "damaged", label: "Damaged" },
];

function isWithinReturnWindow(order) {
  const shippedDate = order.shippedAt || order.shippedDate;
  const deliveredDate = order.deliveredAt || order.deliveredDate;
  const referenceDate = deliveredDate || shippedDate || order.createdAt;
  
  if (!referenceDate) return false;
  
  const refDate = new Date(referenceDate);
  const now = new Date();
  const diffDays = Math.floor((now - refDate) / (1000 * 60 * 60 * 24));
  
  return diffDays <= RETURN_WINDOW_DAYS;
}

function getDaysRemaining(order) {
  const shippedDate = order.shippedAt || order.shippedDate;
  const deliveredDate = order.deliveredAt || order.deliveredDate;
  const referenceDate = deliveredDate || shippedDate || order.createdAt;
  
  if (!referenceDate) return 0;
  
  const refDate = new Date(referenceDate);
  const now = new Date();
  const diffDays = Math.floor((now - refDate) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, RETURN_WINDOW_DAYS - diffDays);
}

function canRequestReturn(order) {
  const status = String(order.status || "").toLowerCase();
  return (status === "delivered" || status === "shipped") && isWithinReturnWindow(order);
}

const OrdersActivity = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [contactModalOrder, setContactModalOrder] = useState(null);

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
    if (canRequestReturn(order)) {
      setReturnModalOrder(order);
    } else {
      setContactModalOrder(order);
    }
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
              const isDeliveredOrShipped = status === "delivered" || status === "shipped";
              
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
                      {order.status}
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
                      {isDeliveredOrShipped && (
                        canReturn ? (
                          <button 
                            className={btn.secondarySm}
                            onClick={() => handleReturnClick(order)}
                            title={`${daysRemaining} days remaining to request return`}
                          >
                            Request Return
                          </button>
                        ) : (
                          <button 
                            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-700"
                            onClick={() => handleReturnClick(order)}
                            title="Return window expired - Contact us for assistance"
                          >
                            Contact for Return
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {isDeliveredOrShipped && canReturn && (
                    <div className="mt-2 text-xs text-accent-dark">
                      <span className="font-semibold">{daysRemaining} days</span> remaining to request a return
                    </div>
                  )}

                  {expandedId === order.id && (
                    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
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

      {contactModalOrder && (
        <ContactForReturnModal
          order={contactModalOrder}
          user={user}
          onClose={() => setContactModalOrder(null)}
        />
      )}
    </div>
  );
};

function ReturnRequestModal({ order, user, onClose }) {
  const [selectedItems, setSelectedItems] = useState(
    (order.items || []).map((item, idx) => ({ ...item, selected: true, returnQty: item.quantity || 1, idx }))
  );
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [condition, setCondition] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const itemsToReturn = selectedItems.filter((item) => item.selected);
    if (itemsToReturn.length === 0) {
      setError("Please select at least one item to return");
      return;
    }
    if (!reason) {
      setError("Please select a reason for return");
      return;
    }
    if (!condition) {
      setError("Please select the condition of the items");
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
          customerName: user?.name || order?.customer?.name || "",
          items: itemsToReturn.map((item) => ({
            productId: item.id || item.productId || "",
            productName: item.name || item.productName || "",
            quantity: item.returnQty,
            price: item.price || 0,
          })),
          reason,
          reasonDetails,
          condition,
          shippedDate: order.shippedAt || order.shippedDate,
          deliveredDate: order.deliveredAt || order.deliveredDate,
        }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to submit return request");

      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Failed to submit return request");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-neutral-900">Return Request Submitted</h3>
            <p className="mt-2 text-sm text-neutral-600">
              We've received your return request and will review it within 1-2 business days. 
              You'll receive an email at <strong>{user?.email}</strong> with further instructions.
            </p>
            <button onClick={onClose} className={`${btn.gradient} mt-6`}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <h3 className="text-xl font-bold text-neutral-900">Request Return</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-700">Order: {order.id}</p>
            <p className="text-xs text-neutral-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Select Items to Return</label>
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
                    <p className="text-sm font-medium text-neutral-900 truncate">{item.name || 'Item'}</p>
                    <p className="text-xs text-neutral-500">AU${Number(item.price || 0).toFixed(2)}</p>
                  </div>
                  {item.selected && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-500">Qty:</label>
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
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Reason for Return *</label>
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
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Additional Details</label>
            <textarea
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Please provide any additional details about your return..."
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-accent focus:ring-accent min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Item Condition *</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-accent focus:ring-accent"
              required
            >
              <option value="">Select condition...</option>
              {ITEM_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className={btn.outline}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btn.gradient}>
              {submitting ? "Submitting..." : "Submit Return Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactForReturnModal({ order, user, onClose }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const resp = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderDate: order.createdAt,
          customerEmail: user?.email || order?.customer?.email || "",
          customerName: user?.name || order?.customer?.name || "",
          items: (order.items || []).map((item) => ({
            productId: item.id || item.productId || "",
            productName: item.name || item.productName || "",
            quantity: item.quantity || 1,
            price: item.price || 0,
          })),
          reason: "other",
          reasonDetails: `[RETURN WINDOW EXPIRED - CONTACT REQUEST]\n\n${message}`,
          condition: "unknown",
          shippedDate: order.shippedAt || order.shippedDate,
          deliveredDate: order.deliveredAt || order.deliveredDate,
        }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to submit contact request");

      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
              ✉
            </div>
            <h3 className="text-xl font-bold text-neutral-900">Message Sent</h3>
            <p className="mt-2 text-sm text-neutral-600">
              We've received your request and will review it within 1-2 business days. 
              You'll receive a response at <strong>{user?.email}</strong>.
            </p>
            <button onClick={onClose} className={`${btn.gradient} mt-6`}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <h3 className="text-xl font-bold text-neutral-900">Contact Us About Return</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-2xl">×</button>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> The 30-day return window for this order has expired. 
            However, you can still contact us and we'll review your request on a case-by-case basis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-700">Order: {order.id}</p>
            <p className="text-xs text-neutral-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Your Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe why you'd like to return this order and any relevant details..."
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-accent focus:ring-accent min-h-[120px]"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className={btn.outline}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btn.gradient}>
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-neutral-500 text-center">
          Or email us directly at <a href="mailto:shane@allremotes.com.au" className="text-accent-dark hover:underline">shane@allremotes.com.au</a>
        </p>
      </div>
    </div>
  );
}

export default OrdersActivity;

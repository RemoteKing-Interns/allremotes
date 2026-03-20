"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { btn, tw } from "./tw";
import { cn } from "../../lib/utils";

const OrdersActivity = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

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
            {orders.map(order => (
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
                    {order.status === 'delivered' && (
                      <button className={btn.secondarySm} disabled title="Returns coming soon">Return</button>
                    )}
                  </div>
                </div>

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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersActivity;

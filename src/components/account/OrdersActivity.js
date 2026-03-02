"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'var(--primary-teal)';
      case 'shipped':
        return 'var(--teal-light)';
      case 'processing':
        return 'var(--primary-red)';
      default:
        return 'var(--gray-dark)';
    }
  };

  return (
    <div className="account-section">
      <h2>Orders & Shopping Activity</h2>
      
      <div className="section-content">
        {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
        {loading ? (
          <div className="empty-state">
            <p>Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet</p>
            <Link href="/products/all" className="btn btn-gradient">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Order {order.id}</h3>
                    <p className="order-date">Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <span 
                    className="order-status"
                    style={{ 
                      background: getStatusColor(order.status),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}
                  >
                    {order.status}
                  </span>
                </div>
                
                <div className="order-items">
                  <p className="order-items-count">{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}</p>
                  <ul>
                    {(order.items || []).slice(0, 6).map((item, idx) => (
                      <li key={idx}>{item?.name || 'Item'}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="order-footer">
                  <div className="order-total">
                    <span>Total: </span>
                    <strong>AU${Number(order?.pricing?.total || 0).toFixed(2)}</strong>
                  </div>
                  <div className="order-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => setExpandedId((id) => (id === order.id ? null : order.id))}
                    >
                      {expandedId === order.id ? "Hide Details" : "View Details"}
                    </button>
                    <button className="btn btn-outline-red btn-small" disabled title="Invoice downloads coming soon">
                      Download Invoice
                    </button>
                    {order.status === 'delivered' && (
                      <button className="btn btn-secondary btn-small" disabled title="Returns coming soon">Return</button>
                    )}
                  </div>
                </div>

                {expandedId === order.id && (
                  <div style={{ marginTop: 14, fontSize: 14, color: "#444" }}>
                    <div style={{ display: "grid", gap: 6 }}>
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

"use client";

import React, { useState } from "react";
import Link from "next/link";

const OrdersActivity = () => {
  const [orders] = useState([
    {
      id: 'ORD-001',
      date: '2026-01-25',
      status: 'delivered',
      items: 2,
      total: 64.98,
      itemsList: ['Universal Car Remote Key Fob', 'Universal Garage Door Remote']
    },
    {
      id: 'ORD-002',
      date: '2026-01-20',
      status: 'shipped',
      items: 1,
      total: 49.99,
      itemsList: ['Premium Car Remote Control']
    },
    {
      id: 'ORD-003',
      date: '2026-01-15',
      status: 'processing',
      items: 3,
      total: 134.97,
      itemsList: ['Smart Car Key Fob', 'Smart Garage Remote', 'Rolling Code Garage Remote']
    },
  ]);

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
        {orders.length === 0 ? (
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
                    <p className="order-date">Placed on {new Date(order.date).toLocaleDateString()}</p>
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
                  <p className="order-items-count">{order.items} item{order.items > 1 ? 's' : ''}</p>
                  <ul>
                    {order.itemsList.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="order-footer">
                  <div className="order-total">
                    <span>Total: </span>
                    <strong>${order.total.toFixed(2)}</strong>
                  </div>
                  <div className="order-actions">
                    <button className="btn btn-outline btn-small">View Details</button>
                    <button className="btn btn-outline-red btn-small">Download Invoice</button>
                    {order.status === 'delivered' && (
                      <button className="btn btn-secondary btn-small">Return</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersActivity;

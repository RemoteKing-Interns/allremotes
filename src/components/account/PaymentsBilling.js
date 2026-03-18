"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const PaymentsBilling = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const userKey = useMemo(() => user?.id || user?.email || null, [user]);
  const cardsKey = useMemo(() => (userKey ? `allremotes_payment_methods_${userKey}` : null), [userKey]);
  const billingKey = useMemo(() => (userKey ? `allremotes_billing_addresses_${userKey}` : null), [userKey]);

  const [cardForm, setCardForm] = useState({ number: '', expiry: '', brand: 'Visa', makeDefault: true });
  const [billingForm, setBillingForm] = useState({ name: '', street: '', city: '', state: '', zip: '', country: 'United States', isDefault: true });

  const persistCards = (list) => {
    if (!cardsKey) return;
    try { localStorage.setItem(cardsKey, JSON.stringify(list || [])); } catch {}
  };
  const persistBilling = (list) => {
    if (!billingKey) return;
    try { localStorage.setItem(billingKey, JSON.stringify(list || [])); } catch {}
  };

  useEffect(() => {
    if (!cardsKey) return;
    try {
      const raw = localStorage.getItem(cardsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setPaymentMethods(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPaymentMethods([]);
    }
  }, [cardsKey]);

  useEffect(() => {
    if (!billingKey) return;
    try {
      const raw = localStorage.getItem(billingKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setBillingAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setBillingAddresses([]);
    }
  }, [billingKey]);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    async function loadOrders() {
      setOrdersLoading(true);
      try {
        const resp = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`, { cache: 'no-store' });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || 'Failed to load orders');
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }
    loadOrders();
    return () => { cancelled = true; };
  }, [user?.email]);

  const handleAddCard = (e) => {
    e.preventDefault();
    const digits = String(cardForm.number || '').replace(/\D/g, '');
    if (digits.length < 4) return;
    const last4 = digits.slice(-4);
    const created = {
      id: Date.now(),
      type: 'card',
      brand: cardForm.brand,
      last4,
      expiry: String(cardForm.expiry || '').trim(),
      isDefault: Boolean(cardForm.makeDefault) || paymentMethods.length === 0,
    };
    const next = [
      ...(cardForm.makeDefault ? paymentMethods.map((m) => ({ ...m, isDefault: false })) : paymentMethods),
      created,
    ];
    setPaymentMethods(next);
    persistCards(next);
    setCardForm({ number: '', expiry: '', brand: 'Visa', makeDefault: false });
    setShowAddCard(false);
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    const created = { id: Date.now(), ...billingForm };
    const next = [
      ...(billingForm.isDefault ? billingAddresses.map((a) => ({ ...a, isDefault: false })) : billingAddresses),
      created,
    ];
    setBillingAddresses(next);
    persistBilling(next);
    setBillingForm({ name: '', street: '', city: '', state: '', zip: '', country: 'United States', isDefault: false });
    setShowAddAddress(false);
  };

  const removeCard = (id) => {
    const next = paymentMethods.filter((m) => m.id !== id);
    setPaymentMethods(next);
    persistCards(next);
  };

  const setDefaultCard = (id) => {
    const next = paymentMethods.map((m) => ({ ...m, isDefault: m.id === id }));
    setPaymentMethods(next);
    persistCards(next);
  };

  const removeBilling = (id) => {
    const next = billingAddresses.filter((a) => a.id !== id);
    setBillingAddresses(next);
    persistBilling(next);
  };

  const setDefaultBilling = (id) => {
    const next = billingAddresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setBillingAddresses(next);
    persistBilling(next);
  };

  return (
    <div className="account-section">
      <h2>Payments & Billing</h2>
      
      <div className="section-content">
        <div className="payment-methods-section">
          <div className="section-header">
            <h3>Saved Payment Methods</h3>
            <button 
              className="btn btn-gradient btn-small"
              onClick={() => setShowAddCard(!showAddCard)}
            >
              {showAddCard ? 'Cancel' : '+ Add Card'}
            </button>
          </div>

          {showAddCard && (
            <form onSubmit={handleAddCard} className="account-form">
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="text" placeholder="123" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Brand</label>
                  <select
                    value={cardForm.brand}
                    onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group checkbox-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={Boolean(cardForm.makeDefault)}
                      onChange={(e) => setCardForm({ ...cardForm, makeDefault: e.target.checked })}
                    />
                    Set as default
                  </label>
                </div>
              </div>
              <button type="submit" className="btn btn-secondary">Add Card</button>
            </form>
          )}

          <div className="payment-methods-list">
            {paymentMethods.length === 0 ? (
              <div className="empty-state">
                <p>No saved payment methods</p>
              </div>
            ) : paymentMethods.map(method => (
              <div key={method.id} className="payment-method-card">
                <div className="method-info">
                  <div className="method-icon">
                    {String(method.brand || 'Card').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="method-brand">{method.brand} •••• {method.last4}</p>
                    <p className="method-expiry">Expires {method.expiry}</p>
                  </div>
                </div>
                <div className="method-actions">
                  {method.isDefault && <span className="default-badge">Default</span>}
                  {!method.isDefault && (
                    <button type="button" className="btn btn-outline btn-small" onClick={() => setDefaultCard(method.id)}>
                      Set Default
                    </button>
                  )}
                  <button type="button" className="btn btn-outline-red btn-small" onClick={() => removeCard(method.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="billing-addresses-section">
          <div className="section-header">
            <h3>Billing Addresses</h3>
            <button 
              className="btn btn-gradient btn-small"
              onClick={() => setShowAddAddress(!showAddAddress)}
            >
              {showAddAddress ? 'Cancel' : '+ Add Address'}
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="account-form">
              <div className="form-group">
                <label>Address Label</label>
                <input
                  type="text"
                  placeholder="Home, Work, etc."
                  value={billingForm.name}
                  onChange={(e) => setBillingForm({ ...billingForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  value={billingForm.street}
                  onChange={(e) => setBillingForm({ ...billingForm, street: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={billingForm.city}
                    onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={billingForm.state}
                    onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    value={billingForm.zip}
                    onChange={(e) => setBillingForm({ ...billingForm, zip: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Country</label>
                <select
                  value={billingForm.country}
                  onChange={(e) => setBillingForm({ ...billingForm, country: e.target.value })}
                  required
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>United Kingdom</option>
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(billingForm.isDefault)}
                    onChange={(e) => setBillingForm({ ...billingForm, isDefault: e.target.checked })}
                  />
                  Set as default billing address
                </label>
              </div>
              <button type="submit" className="btn btn-secondary">Add Address</button>
            </form>
          )}

          <div className="addresses-list">
            {billingAddresses.length === 0 ? (
              <div className="empty-state">
                <p>No billing addresses</p>
              </div>
            ) : billingAddresses.map(address => (
              <div key={address.id} className="address-card">
                <div>
                  <h4>{address.name}</h4>
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state} {address.zip}</p>
                  <p>{address.country}</p>
                </div>
                <div className="address-actions">
                  {address.isDefault && <span className="default-badge">Default</span>}
                  {!address.isDefault && (
                    <button type="button" className="btn btn-outline btn-small" onClick={() => setDefaultBilling(address.id)}>
                      Set Default
                    </button>
                  )}
                  <button type="button" className="btn btn-outline-red btn-small" onClick={() => removeBilling(address.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="transaction-history">
          <h3>Transaction History</h3>
          <div className="transactions-list">
            {ordersLoading ? (
              <div className="transaction-item">
                <div>
                  <p className="transaction-description">Loading…</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <p>No transactions yet</p>
              </div>
            ) : (
              orders.slice(0, 20).map((o) => (
                <div key={o.id} className="transaction-item">
                  <div>
                    <p className="transaction-description">Order {o.id}</p>
                    <p className="transaction-date">{new Date(o.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <div className="transaction-amount">-AU${Number(o?.pricing?.total || 0).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsBilling;

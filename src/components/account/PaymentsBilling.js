"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { btn, tw } from './tw';

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
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Payments & Billing</h2>
      
      <div className={tw.sectionContent}>
        <div className="grid gap-3">
          <div className={tw.sectionHeader}>
            <h3 className={tw.sectionH3}>Saved Payment Methods</h3>
            <button 
              className={btn.gradientSm}
              onClick={() => setShowAddCard(!showAddCard)}
            >
              {showAddCard ? 'Cancel' : '+ Add Card'}
            </button>
          </div>

          {showAddCard && (
            <form onSubmit={handleAddCard} className={tw.form}>
              <div className={tw.formGroup}>
                <label className={tw.label}>Card Number</label>
                <input
                  className={tw.input}
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                  required
                />
              </div>
              <div className={tw.formRow2}>
                <div className={tw.formGroup}>
                  <label className={tw.label}>Expiry Date</label>
                  <input
                    className={tw.input}
                    type="text"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    required
                  />
                </div>
                <div className={tw.formGroup}>
                  <label className={tw.label}>CVV</label>
                  <input className={tw.input} type="text" placeholder="123" required />
                </div>
              </div>
              <div className={tw.formRow2}>
                <div className={tw.formGroup}>
                  <label className={tw.label}>Brand</label>
                  <select
                    className={tw.input}
                    value={cardForm.brand}
                    onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className={tw.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={Boolean(cardForm.makeDefault)}
                      onChange={(e) => setCardForm({ ...cardForm, makeDefault: e.target.checked })}
                    />
                    Set as default
                  </label>
                </div>
              </div>
              <button type="submit" className={btn.secondary}>Add Card</button>
            </form>
          )}

          <div className={tw.gridList}>
            {paymentMethods.length === 0 ? (
              <div className={tw.emptyState}>
                <p>No saved payment methods</p>
              </div>
            ) : paymentMethods.map(method => (
              <div key={method.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm max-sm:flex-col max-sm:items-start">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-xs font-bold text-neutral-700">
                    {String(method.brand || 'Card').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{method.brand} •••• {method.last4}</p>
                    <p className="text-xs text-neutral-500">Expires {method.expiry}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {method.isDefault && <span className={tw.badgeDefault}>Default</span>}
                  {!method.isDefault && (
                    <button type="button" className={btn.outlineSm} onClick={() => setDefaultCard(method.id)}>
                      Set Default
                    </button>
                  )}
                  <button type="button" className={btn.outlineDangerSm} onClick={() => removeCard(method.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <div className={tw.sectionHeader}>
            <h3 className={tw.sectionH3}>Billing Addresses</h3>
            <button 
              className={btn.gradientSm}
              onClick={() => setShowAddAddress(!showAddAddress)}
            >
              {showAddAddress ? 'Cancel' : '+ Add Address'}
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className={tw.form}>
              <div className={tw.formGroup}>
                <label className={tw.label}>Address Label</label>
                <input
                  className={tw.input}
                  type="text"
                  placeholder="Home, Work, etc."
                  value={billingForm.name}
                  onChange={(e) => setBillingForm({ ...billingForm, name: e.target.value })}
                  required
                />
              </div>
              <div className={tw.formGroup}>
                <label className={tw.label}>Street Address</label>
                <input
                  className={tw.input}
                  type="text"
                  value={billingForm.street}
                  onChange={(e) => setBillingForm({ ...billingForm, street: e.target.value })}
                  required
                />
              </div>
              <div className={tw.formRow3}>
                <div className={tw.formGroup}>
                  <label className={tw.label}>City</label>
                  <input
                    className={tw.input}
                    type="text"
                    value={billingForm.city}
                    onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className={tw.formGroup}>
                  <label className={tw.label}>State</label>
                  <input
                    className={tw.input}
                    type="text"
                    value={billingForm.state}
                    onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value })}
                    required
                  />
                </div>
                <div className={tw.formGroup}>
                  <label className={tw.label}>ZIP Code</label>
                  <input
                    className={tw.input}
                    type="text"
                    value={billingForm.zip}
                    onChange={(e) => setBillingForm({ ...billingForm, zip: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className={tw.formGroup}>
                <label className={tw.label}>Country</label>
                <select
                  className={tw.input}
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
              <div className={tw.formGroup}>
                <label className={tw.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={Boolean(billingForm.isDefault)}
                    onChange={(e) => setBillingForm({ ...billingForm, isDefault: e.target.checked })}
                  />
                  Set as default billing address
                </label>
              </div>
              <button type="submit" className={btn.secondary}>Add Address</button>
            </form>
          )}

          <div className={tw.gridList}>
            {billingAddresses.length === 0 ? (
              <div className={tw.emptyState}>
                <p>No billing addresses</p>
              </div>
            ) : billingAddresses.map(address => (
              <div key={address.id} className={tw.card}>
                <div>
                  <h4 className={tw.strongText}>{address.name}</h4>
                  <p className="text-sm text-neutral-700">{address.street}</p>
                  <p className="text-sm text-neutral-700">{address.city}, {address.state} {address.zip}</p>
                  <p className="text-sm text-neutral-700">{address.country}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {address.isDefault && <span className={tw.badgeDefault}>Default</span>}
                  {!address.isDefault && (
                    <button type="button" className={btn.outlineSm} onClick={() => setDefaultBilling(address.id)}>
                      Set Default
                    </button>
                  )}
                  <button type="button" className={btn.outlineDangerSm} onClick={() => removeBilling(address.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Transaction History</h3>
          <div className={tw.gridList}>
            {ordersLoading ? (
              <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Loading…</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className={tw.emptyState}>
                <p>No transactions yet</p>
              </div>
            ) : (
              orders.slice(0, 20).map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 max-sm:flex-col max-sm:items-start">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Order {o.id}</p>
                    <p className="text-xs text-neutral-500">{new Date(o.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <div className="text-sm font-bold text-neutral-900">-AU${Number(o?.pricing?.total || 0).toFixed(2)}</div>
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

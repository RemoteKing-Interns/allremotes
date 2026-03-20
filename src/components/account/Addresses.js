"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { btn, tw } from './tw';

const Addresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    name: user?.name || '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: '',
    isDefault: false
  });

  const userKey = useMemo(() => user?.id || user?.email || null, [user]);
  const storageKey = useMemo(
    () => (userKey ? `allremotes_addresses_${userKey}` : null),
    [userKey],
  );

  const persist = (list) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(list || []));
    } catch {}
  };

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAddresses([]);
    }
  }, [storageKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const base = {
      ...formData,
      id: editingId || Date.now(),
    };

    const next = editingId
      ? addresses.map((a) => (a.id === editingId ? base : a))
      : [...addresses, base];

    const withDefaultNormalized = base.isDefault
      ? next.map((a) => ({ ...a, isDefault: a.id === base.id }))
      : next;

    setAddresses(withDefaultNormalized);
    persist(withDefaultNormalized);
    setFormData({
      label: '',
      name: user?.name || '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      phone: '',
      isDefault: false
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const setDefaultAddress = (id) => {
    const next = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    setAddresses(next);
    persist(next);
  };

  const startEdit = (addr) => {
    setEditingId(addr.id);
    setFormData({
      label: addr.label || '',
      name: addr.name || (user?.name || ''),
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.zip || '',
      country: addr.country || 'United States',
      phone: addr.phone || '',
      isDefault: Boolean(addr.isDefault),
    });
    setShowAddForm(true);
  };

  const removeAddress = (id) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    persist(next);
    if (editingId === id) {
      setEditingId(null);
      setShowAddForm(false);
    }
  };

  return (
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Addresses</h2>
      
      <div className={tw.sectionContent}>
        <div className={tw.sectionHeader}>
          <h3 className={tw.sectionH3}>Shipping Addresses</h3>
          <button 
            className={btn.gradientSm}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Address'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className={tw.form}>
            <div className={tw.formGroup}>
              <label className={tw.label}>Address Label</label>
              <input
                className={tw.input}
                type="text"
                placeholder="Home, Work, etc."
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                required
              />
            </div>
            <div className={tw.formGroup}>
              <label className={tw.label}>Full Name</label>
              <input
                className={tw.input}
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className={tw.formGroup}>
              <label className={tw.label}>Street Address</label>
              <input
                className={tw.input}
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                required
              />
            </div>
            <div className={tw.formRow3}>
              <div className={tw.formGroup}>
                <label className={tw.label}>City</label>
                <input
                  className={tw.input}
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
              <div className={tw.formGroup}>
                <label className={tw.label}>State</label>
                <input
                  className={tw.input}
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  required
                />
              </div>
              <div className={tw.formGroup}>
                <label className={tw.label}>ZIP Code</label>
                <input
                  className={tw.input}
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({...formData, zip: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className={tw.formGroup}>
              <label className={tw.label}>Country</label>
              <select
                className={tw.input}
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                required
              >
                <option>United States</option>
                <option>Canada</option>
                <option>Australia</option>
                <option>United Kingdom</option>
              </select>
            </div>
            <div className={tw.formGroup}>
              <label className={tw.label}>Phone Number</label>
              <input
                className={tw.input}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className={tw.formGroup}>
              <label className={tw.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                />
                Set as default delivery address
              </label>
            </div>
            <button type="submit" className={btn.secondary}>
              {editingId ? 'Update Address' : 'Save Address'}
            </button>
          </form>
        )}

        {addresses.length === 0 ? (
          <div className={tw.emptyState}>
            <p>No saved addresses</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map(address => (
            <div key={address.id} className={tw.card}>
              <div className="flex items-center justify-between gap-2">
                <h4 className={tw.strongText}>{address.label}</h4>
                {address.isDefault && <span className={tw.badgeDefault}>Default</span>}
              </div>
              <div className="mt-2 grid gap-0.5 text-sm text-neutral-700">
                <p><strong>{address.name}</strong></p>
                <p>{address.street}</p>
                <p>{address.city}, {address.state} {address.zip}</p>
                <p>{address.country}</p>
                {address.phone && <p>{address.phone}</p>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!address.isDefault && (
                  <button 
                    className={btn.outlineSm}
                    onClick={() => setDefaultAddress(address.id)}
                  >
                    Set as Default
                  </button>
                )}
                <button className={btn.outlineSm} type="button" onClick={() => startEdit(address)}>
                  Edit
                </button>
                <button className={btn.outlineDangerSm} type="button" onClick={() => removeAddress(address.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Addresses;

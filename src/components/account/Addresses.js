"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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
    <div className="account-section">
      <h2>Addresses</h2>
      
      <div className="section-content">
        <div className="section-header">
          <h3>Shipping Addresses</h3>
          <button 
            className="btn btn-gradient btn-small"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Address'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="account-form">
            <div className="form-group">
              <label>Address Label</label>
              <input
                type="text"
                placeholder="Home, Work, etc."
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({...formData, zip: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Country</label>
              <select
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
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                />
                Set as default delivery address
              </label>
            </div>
            <button type="submit" className="btn btn-secondary">
              {editingId ? 'Update Address' : 'Save Address'}
            </button>
          </form>
        )}

        {addresses.length === 0 ? (
          <div className="empty-state">
            <p>No saved addresses</p>
          </div>
        ) : (
          <div className="addresses-grid">
          {addresses.map(address => (
            <div key={address.id} className="address-card">
              <div className="address-header">
                <h4>{address.label}</h4>
                {address.isDefault && <span className="default-badge">Default</span>}
              </div>
              <div className="address-details">
                <p><strong>{address.name}</strong></p>
                <p>{address.street}</p>
                <p>{address.city}, {address.state} {address.zip}</p>
                <p>{address.country}</p>
                {address.phone && <p>{address.phone}</p>}
              </div>
              <div className="address-actions">
                {!address.isDefault && (
                  <button 
                    className="btn btn-outline btn-small"
                    onClick={() => setDefaultAddress(address.id)}
                  >
                    Set as Default
                  </button>
                )}
                <button className="btn btn-outline btn-small" type="button" onClick={() => startEdit(address)}>
                  Edit
                </button>
                <button className="btn btn-outline-red btn-small" type="button" onClick={() => removeAddress(address.id)}>
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

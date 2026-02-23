"use client";

import React, { useState } from 'react';

const Addresses = () => {
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: 'Home',
      name: 'John Doe',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
      phone: '+1 (555) 123-4567',
      isDefault: true
    },
    {
      id: 2,
      label: 'Work',
      name: 'John Doe',
      street: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      zip: '10002',
      country: 'United States',
      phone: '+1 (555) 987-6543',
      isDefault: false
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: '',
    isDefault: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAddress = {
      id: Date.now(),
      ...formData
    };
    setAddresses([...addresses, newAddress]);
    setFormData({
      label: '',
      name: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      phone: '',
      isDefault: false
    });
    setShowAddForm(false);
  };

  const setDefaultAddress = (id) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
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
            <button type="submit" className="btn btn-secondary">Save Address</button>
          </form>
        )}

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
                <button className="btn btn-outline btn-small">Edit</button>
                <button className="btn btn-outline-red btn-small">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Addresses;

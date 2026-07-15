"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { btn, tw } from './tw';
import { combineAddressUnit } from '../../lib/utils';
import { MapPin, Loader2 } from 'lucide-react';

// Geoapify API key from environment
const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';

const Addresses = () => {
  const { user, updateUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    name: user?.name || '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'Australia',
    phone: '',
    isDefault: false
  });

  // Load addresses from user data
  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
    }
    setLoading(false);
  }, [user]);

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const streetInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Fetch address suggestions from Geoapify
  const fetchAddressSuggestions = useCallback(async (query) => {
    if (!query || query.length < 3 || !GEOAPIFY_API_KEY) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Bias results toward Australia (latitude, longitude)
      const bias = 'bias=proximity:133.7751,-25.2744';
      // Filter to specific countries (AU = Australia)
      const filter = 'filter=countrycode:au';
      
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&${bias}&${filter}&limit=20&apiKey=${GEOAPIFY_API_KEY}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      setAddressSuggestions(
        features.map((feature) => {
          const props = feature.properties || {};
          const house = props.housenumber || '';
          if (house && props.formatted) {
            props.display = combineAddressUnit(query, house, props.formatted);
          }
          return feature;
        })
      );
    } catch (error) {
      console.error('Address autocomplete error:', error);
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle street address input with debounce
  const handleStreetChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, street: value });
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 300);
    
    setShowSuggestions(true);
  };

  // Select an address from suggestions
  const selectAddress = (feature) => {
    const props = feature.properties;
    
    // Format street address: street number + street name
    let street = '';
    if (props.housenumber && props.street) {
      street = `${props.housenumber} ${props.street}`.trim();
    } else if (props.street) {
      street = props.street;
    } else if (props.address_line1) {
      street = props.address_line1;
    } else if (props.formatted) {
      // Extract street from formatted address (remove city, state, postcode)
      const parts = props.formatted.split(',');
      street = parts[0]?.trim() || '';
    }

    // Preserve unit/apartment prefixes (e.g., U20, Unit 20, 20/3) from the user's input
    street = combineAddressUnit(formData.street || '', props.housenumber || '', street);
    
    // Australian address format:
    // - suburb: the suburb/locality (e.g., "Surry Hills")
    // - city: often same as suburb in AU, or larger city name
    // - state: state code (NSW, VIC, QLD, etc.)
    // - post_code: 4-digit postcode
    const suburb = props.suburb || props.district || '';
    const city = suburb || props.city || '';
    const state = props.state_code || props.state || '';
    const postcode = props.postcode || '';
    const country = props.country_code?.toUpperCase() === 'AU' ? 'AU' : (props.country || 'AU');
    
    // Preserve deliveryInstructions when selecting from autocomplete
    setFormData({
      ...formData,
      street: street,
      // For Australia: store suburb in city field if no separate city
      city: city,
      state: state,
      zip: postcode,
      country: country,
      suburb: suburb,
      fullAddress: props.formatted || '',
      // Keep existing deliveryInstructions
    });
    
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (streetInputRef.current && !streetInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const base = {
      ...formData,
      id: editingId || Date.now().toString(),
    };

    const next = editingId
      ? addresses.map((a) => (a.id === editingId ? base : a))
      : [...addresses, base];

    const withDefaultNormalized = base.isDefault
      ? next.map((a) => ({ ...a, isDefault: a.id === base.id }))
      : next;

    // Save to API
    const result = await updateUser({ addresses: withDefaultNormalized });
    if (result?.success) {
      setAddresses(withDefaultNormalized);
    }
    
    setFormData({
      label: '',
      name: user?.name || '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'Australia',
      phone: '',
      deliveryInstructions: '',
      isDefault: false
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const setDefaultAddress = async (id) => {
    const next = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    const result = await updateUser({ addresses: next });
    if (result?.success) {
      setAddresses(next);
    }
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
      country: addr.country || 'Australia',
      phone: addr.phone || '',
      isDefault: Boolean(addr.isDefault),
    });
    setShowAddForm(true);
  };

  const removeAddress = async (id) => {
    const next = addresses.filter((a) => a.id !== id);
    const result = await updateUser({ addresses: next });
    if (result?.success) {
      setAddresses(next);
    }
    if (editingId === id) {
      setEditingId(null);
      setShowAddForm(false);
    }
  };

  if (loading) {
    return (
      <div className={tw.section}>
        <h2 className={tw.sectionTitle}>Addresses</h2>
        <div className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

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
            <div className={tw.formGroup} ref={streetInputRef}>
              <label className={tw.label}>Street Address</label>
              <div className="relative">
                <input
                  className={tw.input}
                  type="text"
                  value={formData.street}
                  onChange={handleStreetChange}
                  onFocus={() => formData.street.length >= 3 && setShowSuggestions(true)}
                  placeholder="Start typing to search addresses..."
                  required
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={18} className="animate-spin text-neutral-400" />
                  </div>
                )}
                
                {/* Address Suggestions Dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
                    {addressSuggestions.map((feature, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectAddress(feature)}
                        className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                      >
                        <MapPin size={18} className="mt-0.5 flex-shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {feature.properties.display || feature.properties.formatted}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {feature.properties.city || feature.properties.suburb}, {feature.properties.state_code}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Type at least 3 characters to search for Australian addresses
              </p>
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
            {/* Country is always Australia - no selection needed */}
            <input type="hidden" value="Australia" />
            <div className={tw.formGroup}>
              <label className={tw.label}>Phone Number</label>
              <input
                className={tw.input}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="04XX XXX XXX"
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

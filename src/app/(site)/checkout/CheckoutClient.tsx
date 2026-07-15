"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { useStore } from "../../../context/StoreContext";
import { combineAddressUnit } from "../../../lib/utils";
import StripeCheckoutButton from "../../../components/StripeCheckoutButton";
import ShippingCalculator from "../../../components/ShippingCalculator";
import OrderSuccessAnimation from "../../../components/checkout/OrderSuccessAnimation";

const Checkout = () => {
  const {
    cart,
    hasDiscount,
    discountRate,
    getCartTotal,
    getCartOriginalTotal,
    getCartDiscountTotal,
    getItemPriceBreakdown,
    getItemLineTotal,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const { getSettings } = useStore();
  const settings = getSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === '1';
  const geoapifyApiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  const geoapifyCountryFilter = 'au';
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placeError, setPlaceError] = useState<string>("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cod'>('stripe');
  const [stripePaymentComplete, setStripePaymentComplete] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const blurTimeoutRef = useRef(null);
  const originalTotal = getCartOriginalTotal();
  const discountTotal = getCartDiscountTotal();
  const discountedTotal = getCartTotal();

  const shouldRedirectToLogin = !user && !isGuest;
  const shouldRedirectToCart = cart.length === 0 && !orderPlaced;

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const normalizedAddressQuery = useMemo(() => formData.address.trim(), [formData.address]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const params = new URLSearchParams();
      params.append('code', couponCode.trim());
      if (user?.email) params.append('customerEmail', user.email);
      if (user?.id) params.append('customerUserId', user.id);

      const resp = await fetch(`/api/coupons?${params.toString()}`, { cache: 'no-store' });
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data?.valid) {
        setCouponError(data?.error || 'Invalid coupon code');
        setCouponDiscount(0);
        return;
      }

      const coupon = data.coupon;
      if (coupon.discountPercent) {
        setCouponDiscount((discountedTotal * coupon.discountPercent) / 100);
      } else if (coupon.discountAmount) {
        setCouponDiscount(coupon.discountAmount);
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
      setCouponDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const finalTotal = discountedTotal + shippingCost - couponDiscount;

  useEffect(() => {
    if (!geoapifyApiKey) return;
    if (normalizedAddressQuery.length < 3) {
      setAddressSuggestions([]);
      setIsAddressLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setIsAddressLoading(true);
        const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
        url.searchParams.set('text', normalizedAddressQuery);
        url.searchParams.set('limit', '20');
        url.searchParams.set('format', 'json');
        url.searchParams.set('lang', 'en');
        url.searchParams.set('apiKey', geoapifyApiKey);
        if (geoapifyCountryFilter) {
          url.searchParams.set('filter', `countrycode:${geoapifyCountryFilter}`);
        }
        // Bias toward the centre of Australia to improve ranking of AU results
        url.searchParams.set('bias', 'proximity:133.7751,-25.2744');

        const response = await fetch(url.toString(), {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal
        });
        if (!response.ok) {
          setAddressSuggestions([]);
          return;
        }
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        const suggestions = results
          .map((r, idx) => {
            const house = r.housenumber ?? '';
            return {
              id: String(r.place_id ?? r.rank?.popularity ?? r.formatted ?? idx),
              formatted: combineAddressUnit(normalizedAddressQuery, house, r.formatted ?? ''),
              addressLine1: combineAddressUnit(normalizedAddressQuery, house, r.address_line1 ?? ''),
              addressLine2: r.address_line2 ?? '',
              housenumber: house,
              city: r.suburb || r.city || r.town || r.village || '',
              suburb: r.suburb ?? '',
              state: r.state_code || r.state || '',
              postcode: r.postcode ?? '',
              country: r.country ?? ''
            };
          })
          .filter((s) => s.formatted || s.addressLine1);

        setAddressSuggestions(suggestions);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setAddressSuggestions([]);
        }
      } finally {
        setIsAddressLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [geoapifyApiKey, geoapifyCountryFilter, normalizedAddressQuery]);

  useEffect(() => {
    if (shouldRedirectToLogin) router.replace("/login");
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (shouldRedirectToCart) router.replace("/cart");
  }, [router, shouldRedirectToCart]);

  // Auto-select default address on mount
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setFormData({
          ...formData,
          address: defaultAddr.street,
          city: defaultAddr.city,
          state: defaultAddr.state,
          zipCode: defaultAddr.zip,
          phone: defaultAddr.phone || ''
        });
      }
    }
  }, [user]);

  if (shouldRedirectToLogin || shouldRedirectToCart) return null;

  const handleChange = (e) => {
    if (e.target.name === 'address') {
      setActiveSuggestionIndex(-1);
      setShowAddressSuggestions(true);
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleShippingSelect = (shippingOption) => {
    setSelectedShipping(shippingOption);
    setShippingCost(shippingOption.price);
  };

  const applyAddressSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      address: combineAddressUnit(
        prev.address || '',
        suggestion.housenumber || '',
        suggestion.addressLine1 || suggestion.formatted || prev.address
      ),
      city: suggestion.city || suggestion.suburb || prev.city,
      state: suggestion.state || prev.state,
      zipCode: suggestion.postcode || prev.zipCode
    }));
    setShowAddressSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleAddressKeyDown = (e) => {
    if (!showAddressSuggestions) return;
    if (addressSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((i) => Math.min(i + 1, addressSuggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      applyAddressSuggestion(addressSuggestions[activeSuggestionIndex]);
      return;
    }
    if (e.key === 'Escape') {
      setShowAddressSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleStripePaymentSuccess = async (paymentIntent) => {
    setPlaceError("");
    setLoading(true);
    setStripePaymentComplete(true);
    
    try {
      const customer = {
        fullName: user ? user.name : formData.fullName,
        email: user ? user.email : formData.email,
      };

      const pricing = {
        currency: "AUD",
        subtotal: originalTotal,
        discountTotal,
        total: discountedTotal,
        hasMemberDiscount: Boolean(hasDiscount),
        memberDiscountRate: Number(discountRate || 0),
      };

      const items = cart.map((item) => {
        const unit = getItemPriceBreakdown(item).finalPrice;
        const line = getItemLineTotal(item);
        return {
          id: item.id,
          name: item.name,
          sku: item.sku || "",
          rk_sku: item.rk_sku || "",
          category: item.category,
          quantity: item.quantity,
          unitPrice: unit,
          lineTotal: line,
        };
      });

      const shipping = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: "AU",
        phone: formData.phone,
      };

      const orderData = {
        customer,
        items,
        pricing,
        shipping,
        payment: {
          method: 'stripe',
          paymentIntentId: paymentIntent.id,
          status: 'succeeded'
        }
      };

      const resp = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error || "Failed to place order");
      }

      setPlacedOrderId(data?.id || null);
      setShowAnimation(true);
      clearCart();
    } catch (err: any) {
      setPlaceError(err?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const handleStripePaymentError = (error) => {
    setPlaceError(error.message || "Payment failed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPlaceError("");
    setLoading(true);

    try {
      const customer = {
        fullName: user ? user.name : formData.fullName,
        email: user ? user.email : formData.email,
      };

      const pricing = {
        currency: "AUD",
        subtotal: originalTotal,
        discountTotal,
        total: discountedTotal,
        hasMemberDiscount: Boolean(hasDiscount),
        memberDiscountRate: Number(discountRate || 0),
        couponDiscount: couponDiscount,
      };

      const items = cart.map((item) => {
        const unit = getItemPriceBreakdown(item).finalPrice;
        const line = getItemLineTotal(item);
        return {
          id: item.id,
          name: item.name,
          sku: item.sku || "",
          rk_sku: item.rk_sku || "",
          category: item.category,
          quantity: item.quantity,
          unitPrice: unit,
          lineTotal: line,
        };
      });

      const shipping = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: "AU",
        phone: formData.phone,
      };

      const orderData = {
        customer,
        items,
        pricing,
        shipping,
        payment: {
          method: 'direct',
          status: 'confirmed'
        },
        couponCode: couponDiscount > 0 ? couponCode.trim() : null,
      };

      const resp = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error || "Failed to place order");
      }

      // Send confirmation emails
      await sendOrderEmails(data?.id, orderData);

      setPlacedOrderId(data?.id || null);
      setShowAnimation(true);
      clearCart();
    } catch (err: any) {
      setPlaceError(err?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const sendOrderEmails = async (orderId: string, orderData: any) => {
    try {
      await fetch("/api/orders/send-emails", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerEmail: orderData.customer.email,
          orderDetails: orderData
        }),
      });
    } catch (e) {
      console.error("Failed to send order emails:", e);
    }
  };

  if (showAnimation) {
    return (
      <div className="checkout-page">
        <div className="container">
          <OrderSuccessAnimation 
            orderId={placedOrderId || undefined}
            onComplete={() => setOrderPlaced(true)}
          />
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="order-success">
            <div className="success-icon">✓</div>
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your purchase{user ? `, ${user.name}` : ''}!</p>
            <p>Your order has been confirmed and will be shipped soon.</p>
            {placedOrderId && (
              <p className="order-success-id">
                Order ID: <strong>{placedOrderId}</strong>
              </p>
            )}
            <button
              onClick={() => router.push("/")}
              className="btn btn-primary btn-large order-success-action"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <div className="checkout-header-copy">
            <h1>Checkout</h1>
          </div>
          <div className="checkout-highlights">
            <div className="checkout-highlight">
              <strong>Free</strong>
              <span>standard shipping</span>
            </div>
            <div className="checkout-highlight">
              <strong>Secure</strong>
              <span>order confirmation</span>
            </div>
          </div>
        </div>
        {placeError && <div className="error-message checkout-feedback">{placeError}</div>}
        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h2>Shipping Information</h2>
              
              {/* Saved Address Selection - Shows Default/Selected with options to change */}
              {user?.addresses && user.addresses.length > 0 && !showNewAddressForm && (
                <div className="selected-address-display">
                  <div className="selected-address-card">
                    <div className="selected-address-header">
                      <span className="deliver-to-label">Deliver to:</span>
                      {(() => {
                        const selectedAddr = user.addresses.find(a => a.id === selectedAddressId);
                        return selectedAddr ? (
                          <div className="selected-address-details">
                            <p className="address-line">{selectedAddr.street}</p>
                            <p className="address-line">{selectedAddr.city}, {selectedAddr.state} {selectedAddr.zip}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="address-actions">
                      <button 
                        type="button"
                        className="btn-link"
                        onClick={() => setShowAddressSelector(!showAddressSelector)}
                      >
                        {showAddressSelector ? 'Hide options' : 'Select a different address'}
                      </button>
                      <span className="divider">|</span>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => {
                          setShowNewAddressForm(true);
                          setSelectedAddressId(null);
                          setFormData({
                            ...formData,
                            address: '',
                            city: '',
                            state: '',
                            zipCode: '',
                            phone: ''
                          });
                        }}
                      >
                        Enter address manually
                      </button>
                    </div>
                  </div>
                  
                  {/* Address Selector Dropdown */}
                  {showAddressSelector && (
                    <div className="address-selector-dropdown">
                      <p className="selector-label">Select an address:</p>
                      {user.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`address-option ${selectedAddressId === addr.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setFormData({
                              ...formData,
                              address: addr.street,
                              city: addr.city,
                              state: addr.state,
                              zipCode: addr.zip,
                              phone: addr.phone || ''
                            });
                            setShowAddressSelector(false);
                          }}
                        >
                          <div className="address-option-header">
                            <span className="address-label">{addr.label || 'Address'}</span>
                            {addr.isDefault && <span className="default-badge">Default</span>}
                          </div>
                          <p className="address-option-details">
                            {addr.street}, {addr.city}, {addr.state} {addr.zip}
                          </p>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="enter-manually-btn"
                        onClick={() => {
                          setShowNewAddressForm(true);
                          setSelectedAddressId(null);
                          setShowAddressSelector(false);
                          setFormData({
                            ...formData,
                            address: '',
                            city: '',
                            state: '',
                            zipCode: '',
                            phone: ''
                          });
                        }}
                      >
                        + Enter a new address manually
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Manual Address Form */}
              {(showNewAddressForm || !user?.addresses?.length) && (
                <div className="manual-address-section">
                  {user?.addresses?.length > 0 && (
                    <div className="back-to-saved">
                      <button 
                        type="button"
                        className="btn-link"
                        onClick={() => {
                          setShowNewAddressForm(false);
                          const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
                          if (defaultAddr) {
                            setSelectedAddressId(defaultAddr.id);
                            setFormData({
                              ...formData,
                              address: defaultAddr.street,
                              city: defaultAddr.city,
                              state: defaultAddr.state,
                              zipCode: defaultAddr.zip,
                              phone: defaultAddr.phone || ''
                            });
                          }
                        }}
                      >
                        ← Back to saved addresses
                      </button>
                    </div>
                  )}
              
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={user ? user.name : formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={Boolean(user)}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={user ? user.email : formData.email}
                  onChange={handleChange}
                  required
                  disabled={Boolean(user)}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <div className="address-autocomplete">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onKeyDown={handleAddressKeyDown}
                    onFocus={() => setShowAddressSuggestions(true)}
                    onBlur={() => {
                      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                      blurTimeoutRef.current = setTimeout(() => {
                        setShowAddressSuggestions(false);
                        setActiveSuggestionIndex(-1);
                      }, 150);
                    }}
                    required
                    placeholder="Start typing your address"
                    autoComplete="street-address"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showAddressSuggestions && (isAddressLoading || addressSuggestions.length > 0)}
                    aria-controls="address-suggestions"
                    aria-activedescendant={
                      activeSuggestionIndex >= 0 ? `address-suggestion-${activeSuggestionIndex}` : undefined
                    }
                  />
                  {geoapifyApiKey && showAddressSuggestions && (isAddressLoading || addressSuggestions.length > 0) && (
                    <div id="address-suggestions" className="address-suggestions" role="listbox">
                      {isAddressLoading && (
                        <div className="address-suggestion address-suggestion--meta">
                          Searching…
                        </div>
                      )}
                      {!isAddressLoading &&
                        addressSuggestions.map((s, idx) => (
                          <button
                            key={s.id}
                            id={`address-suggestion-${idx}`}
                            type="button"
                            className={`address-suggestion${idx === activeSuggestionIndex ? ' address-suggestion--active' : ''}`}
                            role="option"
                            aria-selected={idx === activeSuggestionIndex}
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => applyAddressSuggestion(s)}
                          >
                            {s.formatted || s.addressLine1}
                          </button>
                        ))}
                    </div>
                  )}
                  {!geoapifyApiKey && (
                    <div className="address-helper">
                      Address autocomplete is disabled (missing `NEXT_PUBLIC_GEOAPIFY_API_KEY`).
                    </div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    autoComplete="address-level2"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    autoComplete="address-level1"
                  />
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    autoComplete="postal-code"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="04XX XXX XXX"
                  autoComplete="tel"
                />
              </div>

            </div>
          )}
          </div>

          <div className="form-section">
            <h2>Shipping Options</h2>
              <ShippingCalculator
                address={formData}
                onShippingSelect={handleShippingSelect}
                selectedShipping={selectedShipping}
                items={cart}
                cartTotal={discountedTotal}
              />
            </div>

            <div className="form-section">
              <h2>Place Order</h2>
              <div className="order-summary">
                <p>Review your order and click below to confirm.</p>
                <div className="order-total-line">
                  <span>Total Amount:</span>
                  <strong>AU${discountedTotal.toFixed(2)}</strong>
                </div>
                <p className="mt-2 text-sm text-neutral-500">{settings.gstStatement}</p>
              </div>

              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="font-semibold text-neutral-900">{settings.businessName}</p>
                <p className="mt-1">{settings.businessAddress}</p>
                <p className="mt-1">ABN: {settings.abn} &middot; {settings.siteEmail}</p>
                <p className="mt-2 text-neutral-600">
                  We accept Mastercard, Visa, eftpos, AMEX, JCB, Apple Pay and Google Pay.
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Eligible multi-network debit cards may be routed through the eftpos network.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {['mastercard', 'visa', 'eftpos', 'amex', 'jcb', 'apple-pay', 'google-pay'].map((icon) => (
                    <img
                      key={icon}
                      src={`/icons/payments/${icon}.png`}
                      alt={icon}
                      className="h-8 w-auto rounded"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large place-order-btn mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>Place Order - AU${discountedTotal.toFixed(2)}</>
                )}
              </button>
            </div>
          </form>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <p className="order-summary-note">
              Review your line items and final price before confirming the order.
            </p>
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.id} className="summary-item">
                  <span className="summary-item-name">{item.name} x{item.quantity}</span>
                  {(() => {
                    const pricing = getItemPriceBreakdown(item);
                    const originalLine = pricing.originalPrice * item.quantity;
                    const lineTotal = getItemLineTotal(item);
                    return (
                      <span className="summary-item-price">
                        {pricing.hasDiscount && (
                          <span className="summary-item-price-old">AU${originalLine.toFixed(2)}</span>
                        )}
                        <span className="summary-item-price-new">AU${lineTotal.toFixed(2)}</span>
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
            {hasDiscount && (
              <div className="summary-subtotal">
                <span>Subtotal</span>
                <span>AU${originalTotal.toFixed(2)}</span>
              </div>
            )}
            {hasDiscount && (
              <div className="summary-discount">
                <span>Member Discount ({Math.round(discountRate * 100)}%)</span>
                <span>-AU${discountTotal.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-coupon">
              <div className="coupon-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="coupon-input"
                />
                <button
                  type="button"
                  onClick={validateCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="coupon-apply-btn"
                >
                  {validatingCoupon ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <div className="coupon-error">{couponError}</div>
              )}
              {couponDiscount > 0 && (
                <div className="coupon-success">
                  Coupon applied! -AU${couponDiscount.toFixed(2)}
                </div>
              )}
            </div>

            {couponDiscount > 0 && (
              <div className="summary-discount">
                <span>Coupon Discount</span>
                <span>-AU${couponDiscount.toFixed(2)}</span>
              </div>
            )}
            
            {selectedShipping && (
              <div className="summary-shipping">
                <span>Shipping ({selectedShipping.name})</span>
                <span>AU${shippingCost.toFixed(2)}</span>
              </div>
            )}
            
            <div className="summary-total">
              <span>Total</span>
              <span>AU${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

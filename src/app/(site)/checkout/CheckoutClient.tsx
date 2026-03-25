"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import StripeCheckoutButton from "../../../components/StripeCheckoutButton";
import ShippingCalculator from "../../../components/ShippingCalculator";

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
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
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
        url.searchParams.set('limit', '5');
        url.searchParams.set('format', 'json');
        url.searchParams.set('apiKey', geoapifyApiKey);
        if (geoapifyCountryFilter) {
          url.searchParams.set('filter', `countrycode:${geoapifyCountryFilter}`);
        }

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
          .map((r, idx) => ({
            id: String(r.place_id ?? r.rank?.popularity ?? r.formatted ?? idx),
            formatted: r.formatted ?? '',
            addressLine1: r.address_line1 ?? '',
            addressLine2: r.address_line2 ?? '',
            city: r.city ?? r.town ?? r.village ?? r.suburb ?? '',
            state: r.state ?? '',
            postcode: r.postcode ?? '',
            country: r.country ?? ''
          }))
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

  // Calculate total with shipping
  const finalTotal = discountedTotal + shippingCost;

  const applyAddressSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      address: suggestion.addressLine1 || suggestion.formatted || prev.address,
      city: suggestion.city || prev.city,
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
      setOrderPlaced(true);
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
      };

      const items = cart.map((item) => {
        const unit = getItemPriceBreakdown(item).finalPrice;
        const line = getItemLineTotal(item);
        return {
          id: item.id,
          name: item.name,
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
      };

      const orderData = {
        customer, 
        items, 
        pricing, 
        shipping,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cod' ? 'pending' : 'pending'
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
      setOrderPlaced(true);
      clearCart();
    } catch (err: any) {
      setPlaceError(err?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

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
            <span className="checkout-kicker">Secure checkout</span>
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
            </div>

            <div className="form-section">
<<<<<<< Updated upstream
              <h2>Payment Information</h2>
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  required
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  required
                  placeholder="Name on card"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    required
                    placeholder="123"
                    maxLength={3}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large checkout-submit"
              disabled={loading}
            >
              {loading ? 'Processing...' : `Place Order - AU$${discountedTotal.toFixed(2)}`}
            </button>
=======
              <h2>Shipping Options</h2>
              <ShippingCalculator
                address={formData}
                onShippingSelect={handleShippingSelect}
                selectedShipping={selectedShipping}
              />
            </div>

            <div className="form-section">
              <h2>Payment Method</h2>
              <div className="payment-methods">
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'cod')}
                  />
                  <span className="payment-method-label">
                    <span className="payment-method-name">Credit/Debit Card</span>
                    <span className="payment-method-desc">Secure payment via Stripe</span>
                  </span>
                </label>
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'cod')}
                  />
                  <span className="payment-method-label">
                    <span className="payment-method-name">Cash on Delivery</span>
                    <span className="payment-method-desc">Pay when you receive</span>
                  </span>
                </label>
              </div>

              {paymentMethod === 'stripe' && (
                <div className="stripe-payment-section">
                  <h3>Secure Payment via Stripe</h3>
                  <p>Click the button below to be redirected to Stripe's secure payment page.</p>
                  <StripeCheckoutButton
                    amount={finalTotal}
                    items={cart.map(item => ({
                      id: item.id,
                      name: item.name,
                      category: item.category,
                      price: getItemPriceBreakdown(item).finalPrice,
                      quantity: item.quantity
                    }))}
                    customerEmail={user?.email || formData.email}
                    onSuccess={handleStripePaymentSuccess}
                    onError={handleStripePaymentError}
                  />
                </div>
              )}

              {paymentMethod === 'cod' && (
                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={loading || stripePaymentComplete}
                >
                  {loading
                    ? "Processing..."
                    : `Place Order - AU$${finalTotal.toFixed(2)}`}
                </button>
              )}
            </div>
>>>>>>> Stashed changes
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

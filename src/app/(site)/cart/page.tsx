"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";

const Cart = () => {
  const {
    cart,
    hasDiscount,
    discountRate,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartOriginalTotal,
    getCartDiscountTotal,
    getItemPriceBreakdown,
    getItemLineTotal,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const isModalOpen = Boolean(selectedItem);
  const isAnyModalOpen = isModalOpen || showCheckoutModal;
  const totalItems = cart.reduce((count, item) => count + Number(item.quantity || 0), 0);

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedItem(null);
        setShowCheckoutModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  if (cart.length === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="container py-10 sm:py-12">
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(251,248,245,0.88))] p-8 shadow-panel backdrop-blur sm:p-12">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
              Checkout ready
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Shopping Cart
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              Your cart is empty. Browse the catalog and add a remote to get started.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-4 py-2 text-xs font-extrabold text-neutral-700">
                0 items
              </span>
              <span className="inline-flex items-center rounded-full bg-accent/10 px-4 py-2 text-xs font-extrabold text-accent-dark">
                Free standard shipping
              </span>
            </div>

            <Link
              href="/products/all"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      setShowCheckoutModal(true);
      return;
    }
    router.push("/checkout");
  };

  const originalTotal = getCartOriginalTotal();
  const discountedTotal = getCartTotal();
  const discountTotal = getCartDiscountTotal();

  return (
    <div className="animate-fadeIn">
      <div className="container py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
              Checkout ready
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Shopping Cart
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              Confirm quantities, review line totals, and move through checkout with a clear order summary.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 shadow-xs">
              <strong className="block text-2xl font-extrabold tracking-tight text-neutral-900">{totalItems}</strong>
              <span className="mt-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                {totalItems === 1 ? "item selected" : "items selected"}
              </span>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 shadow-xs">
              <strong className="block text-2xl font-extrabold tracking-tight text-neutral-900">
                {hasDiscount ? `${Math.round(discountRate * 100)}%` : "Free"}
              </strong>
              <span className="mt-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                {hasDiscount ? "member pricing active" : "standard shipping"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="grid gap-4">
            {cart.map(item => (
              <div key={item.id} className="rounded-2xl border border-neutral-200 bg-white/85 p-5 shadow-panel backdrop-blur">
                <div className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 rounded-2xl border border-neutral-200 bg-neutral-50 object-contain p-3"
                    onError={(e) => {
                      e.currentTarget.src = "/images/mainlogo.png";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-neutral-900 line-clamp-2">{item.name}</h3>
                    <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                      {item.category === 'car' ? 'Automotive Remote' : 'Garage & Gate Remote'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {(() => {
                        const pricing = getItemPriceBreakdown(item);
                        return (
                          <div className="flex items-baseline gap-2">
                            {pricing.hasDiscount && (
                              <span className="text-xs font-semibold text-neutral-400 line-through">
                                AU${pricing.originalPrice.toFixed(2)}
                              </span>
                            )}
                            <span className="text-lg font-extrabold tracking-tight text-neutral-900">
                              AU${pricing.finalPrice.toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-700 shadow-xs hover:bg-neutral-100"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="rounded-full bg-primary/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-primary-dark hover:bg-primary/15"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-10 w-10 text-lg font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
                          disabled={Number(item.quantity) <= 1}
                        >
                          −
                        </button>
                        <span className="inline-flex h-10 w-12 items-center justify-center border-x border-neutral-200 text-sm font-extrabold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-10 w-10 text-lg font-semibold text-neutral-800 hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>

                      {(() => {
                        const pricing = getItemPriceBreakdown(item);
                        const originalLine = pricing.originalPrice * item.quantity;
                        const lineTotal = getItemLineTotal(item);
                        return (
                          <div className="text-right">
                            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">Line total</div>
                            <div className="mt-1 flex items-baseline justify-end gap-2">
                              {pricing.hasDiscount && (
                                <span className="text-xs font-semibold text-neutral-400 line-through">
                                  AU${originalLine.toFixed(2)}
                                </span>
                              )}
                              <span className="text-lg font-extrabold tracking-tight text-neutral-900">
                                AU${lineTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white/85 p-6 shadow-panel backdrop-blur lg:sticky lg:top-28">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Order Summary</h2>
            <p className="mt-2 text-sm leading-7 text-neutral-600">
              Secure checkout, order confirmation, and shipping updates are included with every order.
            </p>

            <div className="mt-6 grid gap-3 text-sm">
              <div className="flex items-center justify-between font-semibold text-neutral-700">
                <span>Subtotal</span>
                <span>AU${originalTotal.toFixed(2)}</span>
              </div>
              {hasDiscount && (
                <div className="flex items-center justify-between font-semibold text-primary-dark">
                  <span>Member Discount ({Math.round(discountRate * 100)}%)</span>
                  <span>-AU${discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-semibold text-neutral-700">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-extrabold text-neutral-900">
                <span>Total</span>
                <span>AU${discountedTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="mt-6 w-full rounded-full bg-primary px-6 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="mt-3 w-full rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-extrabold text-neutral-800 shadow-xs hover:bg-neutral-100"
            >
              Clear Cart
            </button>
            <Link href="/products/all" className="mt-4 block text-center text-sm font-semibold text-accent-dark hover:text-accent">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-strong"
            role="dialog"
            aria-modal="true"
            aria-label="Product details"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-neutral-600">Item details</div>
              <button type="button" className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-200" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start sm:p-6">
              <img
                src={selectedItem?.image}
                alt={selectedItem?.name || 'Product'}
                className="h-32 w-32 rounded-2xl border border-neutral-200 bg-neutral-50 object-contain p-3"
                onError={(e) => {
                  e.currentTarget.src = "/images/mainlogo.png";
                }}
              />
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">{selectedItem?.brand || 'Remote Pro'}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">{selectedItem?.name}</h3>
                {selectedItem?.description && (
                  <p className="mt-2 text-sm leading-7 text-neutral-600">{selectedItem.description}</p>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">Price</div>
                    <div className="mt-2">
                      {(() => {
                        const pricing = getItemPriceBreakdown(selectedItem || {});
                        return pricing.hasDiscount ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-neutral-400 line-through">AU${pricing.originalPrice.toFixed(2)}</span>
                            <strong className="text-lg font-extrabold text-neutral-900">AU${pricing.finalPrice.toFixed(2)}</strong>
                          </div>
                        ) : (
                          <strong className="text-lg font-extrabold text-neutral-900">AU${pricing.finalPrice.toFixed(2)}</strong>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">Quantity</div>
                    <strong className="mt-2 block text-lg font-extrabold text-neutral-900">{selectedItem?.quantity}</strong>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">Total</div>
                    <div className="mt-2">
                      {(() => {
                        const lineTotal = getItemLineTotal(selectedItem || {});
                        const pricing = getItemPriceBreakdown(selectedItem || {});
                        const originalLine = pricing.originalPrice * (selectedItem?.quantity || 1);
                        return pricing.hasDiscount ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-neutral-400 line-through">AU${originalLine.toFixed(2)}</span>
                            <strong className="text-lg font-extrabold text-neutral-900">AU${lineTotal.toFixed(2)}</strong>
                          </div>
                        ) : (
                          <strong className="text-lg font-extrabold text-neutral-900">AU${lineTotal.toFixed(2)}</strong>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-extrabold text-neutral-800 shadow-xs hover:bg-neutral-100" onClick={() => setSelectedItem(null)}>
                    Continue Shopping
                  </button>
                  <button type="button" className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark" onClick={handleCheckout}>
                    Go to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setShowCheckoutModal(false)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-strong"
            role="dialog"
            aria-modal="true"
            aria-label="Checkout options"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-neutral-600">Checkout</div>
              <button type="button" className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-200" onClick={() => setShowCheckoutModal(false)}>
                Close
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold tracking-tight text-neutral-900">Continue to Checkout</h3>
              <p className="mt-2 text-sm leading-7 text-neutral-600">Select how you want to checkout.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-extrabold text-neutral-800 shadow-xs hover:bg-neutral-100"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    router.push("/login");
                  }}
                >
                  Login & Checkout
                </button>
                <button
                  type="button"
                  className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    router.push("/checkout?guest=1");
                  }}
                >
                  Guest Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

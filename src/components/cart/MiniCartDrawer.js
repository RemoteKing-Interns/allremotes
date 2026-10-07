"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { generateProductSlugUrl } from "../../lib/product-slugs";
import ProductImage from "../images/ProductImage";
import { useCart } from "../../context/CartContext";

/**
 * Slide-out mini cart. Opens from the header cart icon so customers can
 * confirm their add-to-cart without a full page navigation.
 */
const MiniCartDrawer = ({ open, onClose }) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getCartOriginalTotal,
    getCartDiscountTotal,
    getCartTotal,
    getItemLineTotal,
    hasDiscount,
    discountRate,
  } = useCart();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const originalTotal = getCartOriginalTotal();
  const discountTotal = getCartDiscountTotal();
  const total = getCartTotal();
  const itemCount = cart.reduce((count, item) => count + Number(item.quantity || 0), 0);

  const getProductHref = (item) =>
    generateProductSlugUrl(String(item.id), String(item.name || ""), item.sku || item.rk_sku);

  // Portal to body — the sticky header uses backdrop-blur, which would trap
  // position:fixed descendants inside the header box.
  return createPortal(
    <div
      className="fixed inset-0 z-[1600] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      <div
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-strong"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Your Cart {itemCount > 0 && <span className="text-sm font-medium text-neutral-500">({itemCount} {itemCount === 1 ? "item" : "items"})</span>}
          </h2>
          <button
            type="button"
            className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-sm text-neutral-500">Your cart is empty.</p>
            <Link
              href="/products/all"
              onClick={onClose}
              className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-5">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <Link href={getProductHref(item)} onClick={onClose} className="shrink-0" aria-label={`View ${item.name}`}>
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg object-contain"
                      fallbackSrc="/images/mainlogo.png"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={getProductHref(item)}
                      onClick={onClose}
                      className="line-clamp-2 text-sm font-semibold text-neutral-900 hover:text-accent-dark"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center overflow-hidden rounded-lg border border-neutral-200">
                        <button
                          type="button"
                          className="h-7 w-7 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(item.id, Math.max(1, Number(item.quantity) - 1))}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-extrabold text-neutral-900">{item.quantity}</span>
                        <button
                          type="button"
                          className="h-7 w-7 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-extrabold text-neutral-900">
                        AU${Number(getItemLineTotal(item) || 0).toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mt-1 text-xs text-neutral-400 underline hover:text-neutral-700"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-neutral-200 px-5 py-4">
              <div className="grid gap-1.5 text-sm">
                <div className="flex items-center justify-between font-semibold text-neutral-700">
                  <span>Subtotal</span>
                  <span>AU${originalTotal.toFixed(2)}</span>
                </div>
                {hasDiscount && discountTotal > 0 && (
                  <div className="flex items-center justify-between font-semibold text-primary-dark">
                    <span>Member Discount ({Math.round((discountRate || 0) * 100)}%)</span>
                    <span>-AU${discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-extrabold text-neutral-900">
                  <span>Total</span>
                  <span>AU${total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-neutral-500">Free untracked shipping Australia-wide · tracked &amp; express at checkout</p>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="mt-4 block rounded-full bg-primary px-6 py-3.5 text-center text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="mt-2 block text-center text-sm font-semibold text-accent-dark hover:text-accent"
              >
                View Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default MiniCartDrawer;

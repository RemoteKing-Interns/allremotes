"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import ProductCard from "../../../components/ProductCard";

function readWishlist(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function writeWishlist(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userKey = user?.id || user?.email || "guest";
  const wishlistKey = `allremotes_wishlist_${userKey}`;

  // Load wishlist IDs from localStorage
  useEffect(() => {
    const ids = readWishlist(wishlistKey);
    setWishlistIds(ids);
  }, [wishlistKey]);

  // Fetch all products then filter to wishlisted ones
  useEffect(() => {
    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const matched = data.filter((p) => wishlistIds.includes(String(p.id)));
        setProducts(matched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  const removeFromWishlist = (productId: string) => {
    const next = wishlistIds.filter((id) => id !== productId);
    writeWishlist(wishlistKey, next);
    setWishlistIds(next);
  };

  const clearWishlist = () => {
    writeWishlist(wishlistKey, []);
    setWishlistIds([]);
    setProducts([]);
  };

  const moveToCart = (product: any) => {
    addToCart(product);
    removeFromWishlist(String(product.id));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container py-10 sm:py-14">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Heart size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 sm:text-3xl">
                My Wishlist
              </h1>
              {!loading && (
                <p className="text-sm text-neutral-500">
                  {products.length === 0
                    ? "No saved items"
                    : `${products.length} saved item${products.length !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          </div>
          {products.length > 0 && (
            <button
              onClick={clearWishlist}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-neutral-200" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-24 text-center">
            <Heart size={48} className="mb-4 text-neutral-300" strokeWidth={1} />
            <h2 className="mb-2 text-lg font-bold text-neutral-700">
              Your wishlist is empty
            </h2>
            <p className="mb-6 text-sm text-neutral-500">
              Save items you love by clicking the heart icon on any product.
            </p>
            <Link
              href="/products/all"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-dark"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Wishlist grid */}
        {!loading && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} showWishlistButton={true} />
                  {/* Move to cart overlay button */}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => moveToCart(product)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                    >
                      <ShoppingCart size={13} />
                      Move to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(String(product.id))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Move all to cart */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => {
                  products.forEach((p) => addToCart(p));
                  clearWishlist();
                }}
                className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-dark"
              >
                <ShoppingCart size={16} />
                Move All to Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

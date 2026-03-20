"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from '../../context/StoreContext';
import ProductCard from '../ProductCard';
import { useAuth } from "../../context/AuthContext";
import { btn, tw } from "./tw";

const PreferencesSaved = () => {
  const { user } = useAuth();
  const { getProducts } = useStore();
  const products = getProducts() || [];

  const userKey = useMemo(() => user?.id || user?.email || null, [user]);
  const wishlistKey = useMemo(() => (userKey ? `allremotes_wishlist_${userKey}` : null), [userKey]);
  const recentlyKey = useMemo(() => (userKey ? `allremotes_recently_viewed_${userKey}` : null), [userKey]);
  const searchesKey = useMemo(() => (userKey ? `allremotes_saved_searches_${userKey}` : null), [userKey]);

  const [wishlistIds, setWishlistIds] = useState([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [newSearch, setNewSearch] = useState("");

  const wishlist = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return wishlistIds.map((id) => byId.get(String(id))).filter(Boolean);
  }, [products, wishlistIds]);

  const recentlyViewed = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return recentlyViewedIds.map((id) => byId.get(String(id))).filter(Boolean);
  }, [products, recentlyViewedIds]);

  const persist = (key, value) => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  useEffect(() => {
    if (!wishlistKey) return;
    try {
      const raw = localStorage.getItem(wishlistKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setWishlistIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setWishlistIds([]);
    }
  }, [wishlistKey]);

  useEffect(() => {
    if (!recentlyKey) return;
    try {
      const raw = localStorage.getItem(recentlyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setRecentlyViewedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecentlyViewedIds([]);
    }
  }, [recentlyKey]);

  useEffect(() => {
    if (!searchesKey) return;
    try {
      const raw = localStorage.getItem(searchesKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedSearches(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedSearches([]);
    }
  }, [searchesKey]);

  const removeWishlist = (id) => {
    const next = wishlistIds.filter((x) => String(x) !== String(id));
    setWishlistIds(next);
    persist(wishlistKey, next);
  };

  const removeRecently = (id) => {
    const next = recentlyViewedIds.filter((x) => String(x) !== String(id));
    setRecentlyViewedIds(next);
    persist(recentlyKey, next);
  };

  const addSearch = () => {
    const q = newSearch.trim();
    if (!q) return;
    const next = Array.from(new Set([q, ...savedSearches]));
    setSavedSearches(next);
    persist(searchesKey, next);
    setNewSearch("");
  };

  const removeSearch = (q) => {
    const next = savedSearches.filter((x) => String(x) !== String(q));
    setSavedSearches(next);
    persist(searchesKey, next);
  };

  const countMatches = (q) => {
    const query = String(q || "").toLowerCase();
    if (!query) return 0;
    return products.filter((p) => {
      const hay = `${p?.name || ""} ${p?.description || ""} ${p?.brand || ""} ${p?.sku || ""}`.toLowerCase();
      return hay.includes(query);
    }).length;
  };

  return (
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Preferences & Saved Items</h2>
      
      <div className={tw.sectionContent}>
        <div className="grid gap-3">
            <div className={tw.sectionHeader}>
              <h3 className={tw.sectionH3}>Wishlist / Favorites</h3>
            <Link href="/products/all" className={btn.gradientSm}>
              Browse More
            </Link>
          </div>
          
          {wishlist.length === 0 ? (
            <div className={tw.emptyState}>
              <p>Your wishlist is empty</p>
              <Link href="/products/all" className={btn.gradient}>
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,280px))] items-start justify-start gap-3.5">
              {wishlist.map(product => (
                <div key={product.id} className="grid gap-2 rounded-2xl">
                  <ProductCard product={product} />
                  <button
                    type="button"
                    className={`${btn.outlineDangerSm} mt-0 w-auto justify-self-end`}
                    onClick={() => removeWishlist(product.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Recently Viewed Items</h3>
          
          {recentlyViewed.length === 0 ? (
            <div className={tw.emptyState}>
              <p>No recently viewed items</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,280px))] items-start justify-start gap-3.5">
              {recentlyViewed.map(product => (
                <div key={product.id} className="grid gap-2 rounded-2xl">
                  <ProductCard product={product} />
                  <button
                    type="button"
                    className={`${btn.outlineDangerSm} mt-0 w-auto justify-self-end`}
                    onClick={() => removeRecently(product.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={tw.divider}></div>

        <div className="grid gap-3">
          <h3 className={tw.sectionH3}>Saved Searches</h3>

          <div className={tw.formSpaced}>
            <div className={tw.formRowSearch}>
              <div className={tw.formGroup}>
                <label className={tw.label}>Search query</label>
                <input className={tw.input} value={newSearch} onChange={(e) => setNewSearch(e.target.value)} placeholder="e.g. garage remote" />
              </div>
              <div className="flex items-end">
                <button type="button" className={btn.secondary} onClick={addSearch} disabled={!newSearch.trim()}>
                  Save Search
                </button>
              </div>
            </div>
          </div>
          
          {savedSearches.length === 0 ? (
            <div className={tw.emptyState}>
              <p>No saved searches</p>
            </div>
          ) : (
            <div className={tw.gridList}>
              {savedSearches.map((query) => (
                <div key={query} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 max-sm:flex-col max-sm:items-start">
                  <div>
                    <Link href={`/products/all?search=${encodeURIComponent(query)}`} className="text-sm font-semibold text-accent-dark hover:underline">
                      "{query}"
                    </Link>
                    <p className="text-xs text-neutral-500">{countMatches(query)} products found</p>
                  </div>
                  <button type="button" className={btn.outlineDangerSm} onClick={() => removeSearch(query)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferencesSaved;

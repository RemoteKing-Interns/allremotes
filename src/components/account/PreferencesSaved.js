"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from '../../context/StoreContext';
import ProductCard from '../ProductCard';
import { useAuth } from "../../context/AuthContext";

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
    <div className="account-section">
      <h2>Preferences & Saved Items</h2>
      
      <div className="section-content">
        <div className="wishlist-section">
            <div className="section-header">
              <h3>Wishlist / Favorites</h3>
            <Link href="/products/all" className="btn btn-gradient btn-small">
              Browse More
            </Link>
          </div>
          
          {wishlist.length === 0 ? (
            <div className="empty-state">
              <p>Your wishlist is empty</p>
              <Link href="/products/all" className="btn btn-gradient">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="products-grid-mini">
              {wishlist.map(product => (
                <div key={product.id} style={{ position: "relative" }}>
                  <ProductCard product={product} />
                  <button
                    type="button"
                    className="btn btn-outline-red btn-small"
                    style={{ position: "absolute", top: 10, right: 10 }}
                    onClick={() => removeWishlist(product.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-divider"></div>

        <div className="recently-viewed-section">
          <h3>Recently Viewed Items</h3>
          
          {recentlyViewed.length === 0 ? (
            <div className="empty-state">
              <p>No recently viewed items</p>
            </div>
          ) : (
            <div className="products-grid-mini">
              {recentlyViewed.map(product => (
                <div key={product.id} style={{ position: "relative" }}>
                  <ProductCard product={product} />
                  <button
                    type="button"
                    className="btn btn-outline-red btn-small"
                    style={{ position: "absolute", top: 10, right: 10 }}
                    onClick={() => removeRecently(product.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-divider"></div>

        <div className="saved-searches-section">
          <h3>Saved Searches</h3>

          <div className="account-form" style={{ marginBottom: 14 }}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Search query</label>
                <input value={newSearch} onChange={(e) => setNewSearch(e.target.value)} placeholder="e.g. garage remote" />
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={addSearch} disabled={!newSearch.trim()}>
                  Save Search
                </button>
              </div>
            </div>
          </div>
          
          {savedSearches.length === 0 ? (
            <div className="empty-state">
              <p>No saved searches</p>
            </div>
          ) : (
            <div className="searches-list">
              {savedSearches.map((query) => (
                <div key={query} className="search-item">
                  <div>
                    <Link href={`/products/all?search=${encodeURIComponent(query)}`} className="search-query">
                      "{query}"
                    </Link>
                    <p className="search-count">{countMatches(query)} products found</p>
                  </div>
                  <button type="button" className="btn btn-outline-red btn-small" onClick={() => removeSearch(query)}>
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

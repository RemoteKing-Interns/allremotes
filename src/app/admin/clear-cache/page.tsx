"use client";

import { useState } from "react";
import Link from "next/link";

export default function ClearCachePage() {
  const [cleared, setCleared] = useState(false);

  const clearAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('allremotes_navigation');
      localStorage.removeItem('allremotes_home_content');
      localStorage.removeItem('allremotes_products');
      localStorage.removeItem('allremotes_reviews');
      localStorage.removeItem('allremotes_promotions');
      localStorage.removeItem('allremotes_settings');
      setCleared(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ color: "#2e6b6f", textDecoration: "none", fontSize: 14 }}>← Back to Admin</Link>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", marginBottom: 16 }}>Clear Browser Cache</h1>
      <p style={{ color: "#6b7280", marginBottom: 32, fontSize: 16 }}>
        This will clear all localStorage data and reload the page. Use this to fix hydration errors or sync with database.
      </p>

      {!cleared ? (
        <button
          onClick={clearAll}
          style={{
            background: "#dc2626",
            color: "#fff",
            border: "none",
            padding: "14px 32px",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🗑️ Clear All Cache & Reload
        </button>
      ) : (
        <div style={{ padding: "16px 24px", background: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: 8, color: "#065f46", fontSize: 16, fontWeight: 600 }}>
          ✅ Cache cleared! Redirecting to homepage...
        </div>
      )}

      <div style={{ marginTop: 48, padding: 20, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, textAlign: "left" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#991b1b" }}>⚠️ Warning</h3>
        <p style={{ fontSize: 14, color: "#991b1b", margin: 0 }}>
          This will clear all cached content including navigation, products, and settings. The page will reload and fetch fresh data from the database.
        </p>
      </div>
    </div>
  );
}

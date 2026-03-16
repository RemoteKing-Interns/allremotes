"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "../../../context/StoreContext";

export default function TopInfoBarPage() {
  const { getPromotions, setPromotions } = useStore();
  const promotions = getPromotions();
  const [items, setItems] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (promotions?.topInfoBar) {
      setItems(promotions.topInfoBar.items || []);
      setEnabled(promotions.topInfoBar.enabled !== false);
    }
  }, [promotions]);

  const addItem = () => {
    setItems([...items, ""]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const saveToDb = async () => {
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const updatedPromotions = {
        ...promotions,
        topInfoBar: {
          enabled,
          items: items.filter(item => item.trim() !== ""),
        },
      };

      const res = await fetch("/api/content/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPromotions),
      });

      if (!res.ok) throw new Error("Failed to save to database");
      
      setPromotions(updatedPromotions);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ color: "#2e6b6f", textDecoration: "none", fontSize: 14 }}>← Back to Admin</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>Top Info Bar Management</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>
        Configure the top info bar text items that appear in the header. These items scroll across the top of the site.
      </p>

      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Enable Top Info Bar
          </label>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            When enabled, the info bar will be displayed at the top of the website
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", margin: 0 }}>Info Items</h3>
            <button
              onClick={addItem}
              style={{
                background: "#2e6b6f",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add Item
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#6b7280", minWidth: "60px" }}>Item {index + 1}:</span>
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder="Enter text (e.g., FREE SHIPPING)"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <button
                onClick={() => removeItem(index)}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280", fontSize: 14 }}>
              No info items added. Click "Add Item" to create your first info bar item.
            </div>
          )}
        </div>

        <button
          onClick={saveToDb}
          disabled={loading}
          style={{
            background: loading ? "#9ca3af" : "#2e6b6f",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Saving..." : "💾 Save Changes"}
        </button>

        {saved && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: 8, color: "#065f46", fontSize: 14, fontWeight: 600 }}>
            ✅ Top info bar settings saved successfully!
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14 }}>
            ❌ {error}
          </div>
        )}
      </div>

      <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1e40af" }}>📋 Usage Tips</h3>
        <ul style={{ fontSize: 14, color: "#3b82f6", margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>Keep items short and concise (2-4 words work best)</li>
          <li style={{ marginBottom: 8 }}>Use business-relevant information: warranties, shipping, security, etc.</li>
          <li style={{ marginBottom: 8 }}>The items will scroll continuously across the top of your site</li>
          <li style={{ marginBottom: 8 }}>Consider your brand voice - keep it professional and trustworthy</li>
        </ul>
      </div>

      <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#d97706" }}>👁️ Preview</h3>
        <p style={{ fontSize: 14, color: "#92400e", marginBottom: 16 }}>
          Current items will appear as:
        </p>
        <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #dc2626 100%)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", textAlign: "center" }}>
          {enabled && items.length > 0 ? items.join(" | ") : "INFO BAR DISABLED"}
        </div>
      </div>
    </div>
  );
}

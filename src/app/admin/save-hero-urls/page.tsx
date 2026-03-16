"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SaveHeroUrlsPage() {
  const [urls, setUrls] = useState<string[]>(["", "", "", "", ""]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bucketUrl = "https://allremotes.s3.ap-southeast-2.amazonaws.com/images/";

  useEffect(() => {
    // Auto-fill with expected URLs
    const expected = [
      `${bucketUrl}hero1.png`,
      `${bucketUrl}hero2.png`,
      `${bucketUrl}hero3.png`,
      `${bucketUrl}hero4.png`,
      `${bucketUrl}hero5.png`,
    ];
    setUrls(expected);
  }, []);

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const saveToDb = async () => {
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/content/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroImages: urls.filter(url => url.trim() !== ""),
        }),
      });

      if (!res.ok) throw new Error("Failed to save to database");
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ color: "#2e6b6f", textDecoration: "none", fontSize: 14 }}>← Back to Admin</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>Save Hero Image URLs to Database</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>
        Enter the S3 URLs for your 5 hero images. They will be saved to MongoDB and displayed on the homepage.
      </p>

      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
          Expected format: <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4 }}>https://allremotes.s3.ap-southeast-2.amazonaws.com/images/hero1.png</code>
        </p>

        {urls.map((url, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              Hero {i + 1} URL:
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              placeholder="https://allremotes.s3.ap-southeast-2.amazonaws.com/images/hero1.png"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "monospace",
              }}
            />
            {url && (
              <div style={{ marginTop: 8, height: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 4 }}>
                <img
                  src={url}
                  alt={`Hero ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        ))}

        <button
          onClick={saveToDb}
          disabled={loading}
          style={{
            background: loading ? "#9ca3af" : "#2e6b6f",
            color: "#fff", border: "none", padding: "12px 28px",
            borderRadius: 8, fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8,
          }}
        >
          {loading ? "Saving..." : "💾 Save to Database"}
        </button>

        {saved && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: 8, color: "#065f46", fontSize: 14, fontWeight: 600 }}>
            ✅ Hero image URLs saved to MongoDB! Homepage will now use these images.
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14 }}>
            ❌ {error}
          </div>
        )}
      </div>

      <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1e40af" }}>📋 Quick Copy</h3>
        <p style={{ fontSize: 14, color: "#3b82f6", marginBottom: 12 }}>
          If your images are at the standard location, just copy these URLs:
        </p>
        <div style={{ background: "#fff", border: "1px solid #dbeafe", borderRadius: 8, padding: 12, fontSize: 12, fontFamily: "monospace", color: "#1e40af" }}>
          {bucketUrl}hero1.png<br />
          {bucketUrl}hero2.png<br />
          {bucketUrl}hero3.png<br />
          {bucketUrl}hero4.png<br />
          {bucketUrl}hero5.png
        </div>
      </div>
    </div>
  );
}

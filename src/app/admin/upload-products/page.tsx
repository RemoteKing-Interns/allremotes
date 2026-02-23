"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useStore } from "../../../context/StoreContext";

const ADMIN_EMAIL = 'admin@allremotes.com';

export default function AdminUploadProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const { refreshProductsFromServer } = useStore();

  const isAdmin = user?.role === 'admin' || user?.email === ADMIN_EMAIL;

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [debugDetails, setDebugDetails] = useState('');

  const apiBase = useMemo(() => {
    const fromEnv = String(process.env.NEXT_PUBLIC_API_BASE || "").trim();
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const isLocalHost = host === "localhost" || host === "127.0.0.1";
      const pointsToLocal = /localhost|127\.0\.0\.1/.test(fromEnv);
      if (!isLocalHost && pointsToLocal) return "";
    }
    return fromEnv;
  }, []);

  const templateHref = useMemo(() => `${apiBase}/api/admin/upload-products/template.csv`, [apiBase]);

  if (!user) {
    return (
      <div className="admin-page">
        <div className="container" style={{ padding: 60, textAlign: 'center' }}>
          <h1>Admin</h1>
          <p>Please sign in first.</p>
          <Link href="/admin" className="btn btn-primary" style={{ marginTop: 16 }}>
            Go to admin login
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="container" style={{ padding: 60, textAlign: 'center' }}>
          <h1>Access denied</h1>
          <p>You need admin rights to view this page.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 20 }}>
            Go home
          </Link>
        </div>
      </div>
    );
  }

  async function upload() {
    setError('');
    setResult(null);
    setDebugDetails('');

    if (!file) {
      setError('Please choose a .csv file first.');
      return;
    }
    if (!String(file.name || '').toLowerCase().endsWith('.csv')) {
      setError('Only .csv files are allowed.');
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append('csv', file, file.name);

      const res = await fetch(`${apiBase}/api/admin/upload-products`, {
        method: 'POST',
        body: form,
        // Avoid sending cookies (e.g. large cart cookies) that can trigger HTTP 431.
        credentials: 'omit',
      });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.toLowerCase().includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : null;
      if (!res.ok) {
        // When the backend isn't running, CRA often returns an HTML error page or a proxy failure.
        // Show enough details so you can diagnose quickly.
        if (res.status === 431) {
          setError('Upload failed (HTTP 431) — request headers too large.');
          setDebugDetails('Fix: clear cookies for this site (especially cart_*), then retry the upload.');
          return;
        }
        if (data) {
          const msg = [data.error, data.details].filter(Boolean).join(' — ') || `Upload failed (HTTP ${res.status})`;
          setError(msg);
          if (data.foundHeaders) setDebugDetails(`foundHeaders: ${JSON.stringify(data.foundHeaders)}`);
        } else {
          const text = await res.text().catch(() => '');
          setError(`Upload failed (HTTP ${res.status})`);
          setDebugDetails(text ? text.slice(0, 600) : `Response content-type: ${contentType || '(none)'}`);
        }
        return;
      }

      setResult(data || {});

      // Optional quality-of-life: refresh website products from products.json after a successful upload.
      await refreshProductsFromServer();
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg);
      if (String(msg).toLowerCase().includes('failed to fetch')) {
        setDebugDetails('API not reachable. If your API is hosted separately, set `NEXT_PUBLIC_API_BASE` (and redeploy).');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <h2>Admin</h2>
          <nav className="admin-nav">
            <button
              type="button"
              className="admin-nav-item"
              onClick={() => router.push("/admin")}
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <div className="admin-nav-item active" style={{ cursor: 'default' }}>
              <span>📥</span>
              <span>Upload CSV</span>
            </div>
          </nav>
          <div style={{ padding: 20, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Link
              href="/"
              style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}
            >
              ← View site
            </Link>
          </div>
        </aside>

        <main className="admin-main">
          <div className="admin-header-row">
            <h1>Upload Products (CSV)</h1>
            <a className="btn btn-secondary" href={templateHref}>Download template CSV</a>
          </div>

          <div className="admin-card">
            <h3>Upload</h3>
            <p style={{ marginTop: 0 }}>
              This imports into the server datastore (MongoDB if configured, otherwise <code>products.json</code>) and upserts by <strong>Product Code</strong>.
            </p>

            {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
            {debugDetails && (
              <div style={{ marginBottom: 16, fontSize: 13, opacity: 0.9 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Details</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{debugDetails}</pre>
              </div>
            )}

            <div className="admin-form">
              <div className="form-group">
                <label>CSV file</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <button type="button" className="btn btn-primary" onClick={upload} disabled={busy}>
                {busy ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>

          {result && (
            <div className="admin-card">
              <h3>Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div className="admin-card" style={{ marginBottom: 0 }}>
                  <strong style={{ fontSize: 26, color: 'var(--primary-teal)' }}>{result.totalRows ?? 0}</strong>
                  <div>Rows processed</div>
                </div>
                <div className="admin-card" style={{ marginBottom: 0 }}>
                  <strong style={{ fontSize: 26, color: 'var(--primary-teal)' }}>{result.created ?? 0}</strong>
                  <div>Created</div>
                </div>
                <div className="admin-card" style={{ marginBottom: 0 }}>
                  <strong style={{ fontSize: 26, color: 'var(--primary-teal)' }}>{result.updated ?? 0}</strong>
                  <div>Updated</div>
                </div>
                <div className="admin-card" style={{ marginBottom: 0 }}>
                  <strong style={{ fontSize: 26, color: 'var(--primary-red)' }}>{result.failed ?? 0}</strong>
                  <div>Failed</div>
                </div>
              </div>

              {Array.isArray(result.failures) && result.failures.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Failed rows</h4>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Product Code</th>
                          <th>Description</th>
                          <th>Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.failures.map((f) => (
                          <tr key={`${f.rowNumber}-${f.key || ''}`}>
                            <td>{f.rowNumber}</td>
                            <td>{f.sku ?? f.brand}</td>
                            <td>{f.name}</td>
                            <td>{(f.errors || []).join('; ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

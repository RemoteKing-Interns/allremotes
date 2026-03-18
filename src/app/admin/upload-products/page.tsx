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
        <div className="admin-center-shell">
          <div className="admin-access-state">
            <h1>Admin</h1>
            <p>Please sign in first.</p>
            <Link href="/admin" className="btn btn-primary">
              Go to admin login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-center-shell">
          <div className="admin-access-state">
            <h1>Access denied</h1>
            <p>You need admin rights to view this page.</p>
            <Link href="/" className="btn btn-primary">
              Go home
            </Link>
          </div>
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
          <div className="admin-brand">
            <img src="/images/mainlogo.png" alt="ALLREMOTES" className="admin-brand-logo" />
            <div className="admin-brand-copy">
              <strong>Operations Console</strong>
              <span>Website, catalog, and content management</span>
            </div>
          </div>
          <nav className="admin-nav">
            <button
              type="button"
              className="admin-nav-item"
              onClick={() => router.push("/admin")}
            >
              <span className="admin-nav-icon">BK</span>
              <span>Back</span>
            </button>
            <div className="admin-nav-item active">
              <span className="admin-nav-icon">UP</span>
              <span>Upload CSV</span>
            </div>
          </nav>
          <div className="admin-sidebar-footer">
            <Link href="/" className="admin-sidebar-link">
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
            <p className="admin-muted-copy">
              This imports into the server datastore (MongoDB if configured, otherwise <code>products.json</code>) and upserts by <strong>Product Code</strong>.
            </p>

            {error && <div className="error-message admin-feedback">{error}</div>}
            {debugDetails && (
              <div className="admin-debug">
                <div className="admin-debug-title">Details</div>
                <pre>{debugDetails}</pre>
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
              <div className="admin-results-grid">
                <div className="admin-card admin-result-card">
                  <strong className="admin-result-number">{result.totalRows ?? 0}</strong>
                  <div>Rows processed</div>
                </div>
                <div className="admin-card admin-result-card">
                  <strong className="admin-result-number">{result.created ?? 0}</strong>
                  <div>Created</div>
                </div>
                <div className="admin-card admin-result-card">
                  <strong className="admin-result-number">{result.updated ?? 0}</strong>
                  <div>Updated</div>
                </div>
                <div className="admin-card admin-result-card">
                  <strong className="admin-result-number admin-result-number--error">{result.failed ?? 0}</strong>
                  <div>Failed</div>
                </div>
              </div>

              {Array.isArray(result.failures) && result.failures.length > 0 && (
                <div className="admin-form-space-top">
                  <h4>Failed rows</h4>
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

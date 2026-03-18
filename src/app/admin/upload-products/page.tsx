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
      <div className="animate-fadeIn">
        <div className="container py-10 sm:py-14">
          <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white/85 p-8 text-center shadow-panel backdrop-blur">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Admin</h1>
            <p className="mt-3 text-sm leading-7 text-neutral-600">Please sign in first.</p>
            <Link href="/admin" className="mt-6 inline-flex rounded-full bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark">
              Go to admin login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="animate-fadeIn">
        <div className="container py-10 sm:py-14">
          <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white/85 p-8 text-center shadow-panel backdrop-blur">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Access denied</h1>
            <p className="mt-3 text-sm leading-7 text-neutral-600">You need admin rights to view this page.</p>
            <Link href="/" className="mt-6 inline-flex rounded-full bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark">
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
    <div className="animate-fadeIn">
      <div className="container py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-neutral-200 bg-white/85 p-5 shadow-panel backdrop-blur lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <img src="/images/mainlogo.png" alt="ALLREMOTES" className="h-9 w-auto" />
              <div className="min-w-0">
                <strong className="block text-sm font-semibold text-neutral-900">Operations Console</strong>
                <span className="block text-xs font-semibold text-neutral-500">Catalog and content</span>
              </div>
            </div>
            <nav className="mt-5 grid gap-1">
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                onClick={() => router.push("/admin")}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-xs font-extrabold text-neutral-700 shadow-xs">BK</span>
                <span>Back</span>
              </button>
              <div className="flex items-center gap-3 rounded-2xl bg-accent/10 px-3 py-2.5 text-sm font-semibold text-accent-dark">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-xs font-extrabold text-neutral-700 shadow-xs">UP</span>
                <span>Upload CSV</span>
              </div>
            </nav>
            <div className="mt-5 border-t border-neutral-200 pt-4">
              <Link href="/" className="text-sm font-semibold text-accent-dark hover:text-accent">
                ← View site
              </Link>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Upload Products (CSV)</h1>
              <a className="inline-flex rounded-full bg-accent px-5 py-3 text-sm font-extrabold text-white shadow-soft hover:bg-accent-dark" href={templateHref}>
                Download template CSV
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/85 p-6 shadow-panel backdrop-blur sm:p-8">
              <h3 className="text-lg font-semibold text-neutral-900">Upload</h3>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                This imports into the server datastore (MongoDB if configured, otherwise <code>products.json</code>) and upserts by <strong>Product Code</strong>.
              </p>

              {error && <div className="error-message mt-5">{error}</div>}
              {debugDetails && (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-600">Details</div>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-neutral-700">{debugDetails}</pre>
                </div>
              )}

              <div className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-neutral-800">CSV file</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-neutral-800 hover:file:bg-neutral-200"
                  />
                </div>
                <button type="button" className="w-full rounded-full bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark disabled:opacity-60" onClick={upload} disabled={busy}>
                  {busy ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>

            {result && (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/85 p-6 shadow-panel backdrop-blur sm:p-8">
                <h3 className="text-lg font-semibold text-neutral-900">Results</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Rows processed", value: result.totalRows ?? 0, tone: "neutral" },
                    { label: "Created", value: result.created ?? 0, tone: "accent" },
                    { label: "Updated", value: result.updated ?? 0, tone: "accent" },
                    { label: "Failed", value: result.failed ?? 0, tone: "primary" },
                  ].map((x) => (
                    <div key={x.label} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5">
                      <strong className={`block text-3xl font-extrabold tracking-tight ${x.tone === "primary" ? "text-primary-dark" : x.tone === "accent" ? "text-accent-dark" : "text-neutral-900"}`}>
                        {x.value}
                      </strong>
                      <div className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">{x.label}</div>
                    </div>
                  ))}
                </div>

                {Array.isArray(result.failures) && result.failures.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-extrabold uppercase tracking-[0.14em] text-neutral-600">Failed rows</h4>
                    <div className="mt-3 overflow-auto rounded-2xl border border-neutral-200">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-neutral-100 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-600">
                          <tr>
                            <th className="px-4 py-3">Row</th>
                            <th className="px-4 py-3">Product Code</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Errors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 bg-white">
                          {result.failures.map((f) => (
                            <tr key={`${f.rowNumber}-${f.key || ''}`}>
                              <td className="px-4 py-3 font-semibold text-neutral-900">{f.rowNumber}</td>
                              <td className="px-4 py-3 text-neutral-700">{f.sku ?? f.brand}</td>
                              <td className="px-4 py-3 text-neutral-700">{f.name}</td>
                              <td className="px-4 py-3 text-primary-dark">{(f.errors || []).join('; ')}</td>
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
    </div>
  );
}

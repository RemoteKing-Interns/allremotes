"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";

const ADMIN_EMAIL = 'admin@allremotes.com';

const Admin = () => {
  const { user, login } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin' || user?.email === ADMIN_EMAIL;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const result = login(loginEmail, loginPassword);
    if (result.success) return;
    setLoginError(result.error || 'Invalid credentials');
  };

  useEffect(() => {
    if (!user && !loginEmail) return;
    if (user && user.role !== 'admin' && user.email !== ADMIN_EMAIL) {
      router.replace("/");
    }
  }, [user, router, loginEmail]);

  if (!user) {
    return (
      <div className="animate-fadeIn">
        <div className="container py-10 sm:py-14">
          <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-panel backdrop-blur sm:p-8">
              <img src="/images/mainlogo.png" alt="ALLREMOTES" className="h-10 w-auto" />
              <div className="mt-6">
                <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-primary-dark">
                  Staff only
                </span>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900">
                  Admin
                </h1>
                <p className="mt-3 text-sm leading-7 text-neutral-600">
                  Sign in with your admin account to manage the website.
                </p>
              </div>

              {loginError && <div className="error-message mt-6">{loginError}</div>}

              <form onSubmit={handleAdminLogin} className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="admin-email" className="text-sm font-semibold text-neutral-800">
                    Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@allremotes.com"
                    required
                    className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="admin-password" className="text-sm font-semibold text-neutral-800">
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
                  />
                </div>
                <button type="submit" className="mt-2 w-full rounded-full bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark">
                  Sign in
                </button>
              </form>

              <p className="mt-6 text-sm text-neutral-600">
                <Link href="/" className="font-semibold text-accent-dark hover:text-accent">
                  ← Back to site
                </Link>
              </p>
            </div>

            <aside className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(251,248,245,0.85))] p-6 shadow-panel backdrop-blur sm:p-8">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
                Operations Console
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                Manage catalog, orders, navigation, and site content.
              </h2>
              <div className="mt-6 grid gap-4">
                {[
                  { t: "Products", d: "Create, edit, and delete product entries." },
                  { t: "Orders", d: "Review and update order status." },
                  { t: "Content", d: "Manage hero, features, promotions, and reviews." },
                ].map((x) => (
                  <div key={x.t} className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xs">
                    <strong className="block text-sm font-semibold text-neutral-900">{x.t}</strong>
                    <span className="mt-1 block text-sm leading-6 text-neutral-600">{x.d}</span>
                  </div>
                ))}
              </div>
            </aside>
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
    { id: 'analytics', label: 'Analytics', icon: 'AN' },
    { id: 'users', label: 'Users', icon: 'US' },
    { id: 'products', label: 'Products', icon: 'PD' },
    { id: 'orders', label: 'Orders', icon: 'OD' },
    { id: 'home', label: 'Home content', icon: 'HM' },
    { id: 'promotions', label: 'Promotions', icon: 'PM' },
    { id: 'navigation', label: 'Navigation', icon: 'NV' },
    { id: 'reviews', label: 'Reviews', icon: 'RV' },
    { id: 'settings', label: 'Settings', icon: 'ST' },
  ];

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
              {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id ? "bg-accent/10 text-accent-dark" : "text-neutral-800 hover:bg-neutral-100"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-xs font-extrabold text-neutral-700 shadow-xs">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
              ))}
              <Link className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100" href="/admin/upload-products">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-xs font-extrabold text-neutral-700 shadow-xs">UP</span>
                <span>Upload CSV</span>
              </Link>
            </nav>

            <div className="mt-5 border-t border-neutral-200 pt-4">
              <Link href="/" className="text-sm font-semibold text-accent-dark hover:text-accent">
                ← View site
              </Link>
            </div>
          </aside>

          <main className="min-w-0">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'analytics' && <AdminAnalytics />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'products' && <AdminProducts />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'home' && <AdminHome />}
            {activeTab === 'promotions' && <AdminPromotions />}
            {activeTab === 'navigation' && <AdminNavigation />}
            {activeTab === 'reviews' && <AdminReviews />}
            {activeTab === 'settings' && <AdminSettings />}
          </main>
        </div>
      </div>
    </div>
  );
};

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to load orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setOrders([]);
      setError(err?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setSavingId(id);
    setError("");
    try {
      const resp = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to update order");
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err: any) {
      setError(err?.message || "Failed to update order");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div className="error-message mb-6 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm font-semibold text-primary-dark">{error}</div>}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-500">No orders yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-semibold text-neutral-900 px-4 py-3 border-t border-neutral-100">{o.id}</td>
                    <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{new Date(o.createdAt || Date.now()).toLocaleString()}</td>
                    <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{o?.customer?.email || "—"}</td>
                    <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{Array.isArray(o.items) ? o.items.length : 0}</td>
                    <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">AU${Number(o?.pricing?.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">
                      <select
                        value={o.status || "processing"}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        disabled={savingId === o.id}
                      >
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function AdminDashboard() {
  const { getProducts, getHomeContent, getNavigation, getReviews } = useStore();
  const products = getProducts();
  const home = getHomeContent();
  const nav = getNavigation();
  const reviews = getReviews();
  const productCount = products?.length ?? 0;
  const navKeys = Object.keys(nav || {});
  
  const stats = [
    { label: 'Total Products', value: productCount, icon: 'PD', tone: 'teal' },
    { label: 'Navigation Items', value: navKeys.length, icon: 'NV', tone: 'mixed' },
    { label: 'Reviews', value: reviews?.length ?? 0, icon: 'RV', tone: 'gold' },
    { label: 'Active Promotions', value: 3, icon: 'PM', tone: 'red' },
  ];

  const recentActivity = [
    { action: 'Product added', item: 'New Remote Control', time: '2 hours ago' },
    { action: 'Review updated', item: 'Customer feedback', time: '5 hours ago' },
    { action: 'Price changed', item: 'Premium Remote', time: '1 day ago' },
    { action: 'Navigation updated', item: 'Main menu', time: '2 days ago' },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <div className="text-sm text-neutral-500 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6 rounded-2xl border border-neutral-200 p-5 shadow-sm flex items-center justify-between admin-stat-card--${stat.tone}`}>
            <div>
              <span className="text-2xl font-bold text-neutral-900">{stat.value}</span>
              <div className="text-sm font-medium text-neutral-500 mt-1">{stat.label}</div>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary-dark font-bold">{stat.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h3>
          <div className="mt-4 grid gap-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></div>
                <div className="min-w-0 flex-1">
                  <strong>{activity.action}</strong>
                  <div>{activity.item}</div>
                </div>
                <div className="text-neutral-400 text-xs text-right">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
          <div className="mt-4 grid gap-3">
            <button className="btn btn-primary w-full justify-start">
              Add New Product
            </button>
            <button className="btn btn-secondary w-full justify-start">
              View Analytics
            </button>
            <button className="btn btn-secondary w-full justify-start">
              Site Settings
            </button>
            <button className="btn btn-secondary w-full justify-start">
              Import Products
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Hero Preview</h3>
        <div className="mt-4 flex gap-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex-1 space-y-2 text-sm text-neutral-600">
            <p><strong>Title:</strong> {home?.hero?.title || 'Not set'}</p>
            <p><strong>Subtitle:</strong> {home?.hero?.subtitle || 'Not set'}</p>
            <p><strong>Description:</strong> {home?.hero?.description || 'Not set'}</p>
          </div>
          <div className="flex h-32 w-48 flex-col items-center justify-center rounded-lg bg-white shadow-sm border border-neutral-200 text-sm text-neutral-400">
            <strong>Hero Section</strong>
            <div>Main landing area</div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminProducts() {
  const { getProducts, setProducts, productImagePool } = useStore();
  const [products, setProductsState] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProductsState(getProducts());
  }, [getProducts]);

  const save = () => {
    setProducts(products);
    setSaved(true);
    setEditingId(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const addNew = () => {
    const newId = String(Date.now());
    setProductsState((prev) => [
      ...prev,
      {
        id: newId,
        name: 'New Product',
        category: 'garage',
        price: 0,
        imageIndex: 0,
        image: productImagePool[0],
        description: '',
        inStock: true,
        brand: '',
        condition: 'Brand New',
        returns: 'No returns accepted',
        seller: 'AllRemotes (100% positive)',
      },
    ]);
    setEditingId(newId);
  };

  const update = (id, field, value) => {
    setProductsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const remove = (id) => {
    if (window.confirm('Remove this product?')) {
      setProductsState((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const productForEdit = products.find((p) => p.id === editingId);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Products</h1>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={addNew}>Add product</button>
          <button type="button" className="btn btn-secondary" onClick={save}>Save all changes</button>
        </div>
      </div>
      {saved && <div className="mb-6 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm font-semibold text-accent-dark">Changes saved. The site will show the updated products.</div>}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">
                    <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover border border-neutral-200" />
                  </td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{p.name}</td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{p.category}</td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{p.inStock ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">
                    <div className="actions">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditingId(p.id)}>Edit</button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {productForEdit && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Edit: {productForEdit.name}</h3>
          <div className="grid gap-6 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Name</label>
                <input
                  value={productForEdit.name}
                  onChange={(e) => update(productForEdit.id, 'name', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Category</label>
                <select
                  value={productForEdit.category}
                  onChange={(e) => update(productForEdit.id, 'category', e.target.value)}
                >
                  <option value="garage">Garage</option>
                  <option value="car">Car</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Price (AU$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForEdit.price}
                  onChange={(e) => update(productForEdit.id, 'price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Image</label>
                <select
                  value={productImagePool.indexOf(productForEdit.image) >= 0 ? productImagePool.indexOf(productForEdit.image) : 0}
                  onChange={(e) => update(productForEdit.id, 'image', productImagePool[Number(e.target.value)])}
                >
                  {productImagePool.map((_, i) => (
                    <option key={i} value={i}>Image {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Description</label>
              <textarea
                value={productForEdit.description || ''}
                onChange={(e) => update(productForEdit.id, 'description', e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Brand</label>
                <input
                  value={productForEdit.brand || ''}
                  onChange={(e) => update(productForEdit.id, 'brand', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">In stock</label>
                <select
                  value={productForEdit.inStock ? 'yes' : 'no'}
                  onChange={(e) => update(productForEdit.id, 'inStock', e.target.value === 'yes')}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setEditingId(null)}>Done editing</button>
          </div>
        </div>
      )}
    </>
  );
}

function AdminHome() {
  const { getHomeContent, setHomeContent } = useStore();
  const [content, setContent] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(getHomeContent());
  }, [getHomeContent]);

  const update = (path: string, value: any) => {
    const [section, key] = path.split('.');
    setContent((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  };

  const updateFeature = (index: number, field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      features: (prev.features || []).map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    }));
  };

  const addFeature = () => {
    setContent((prev) => ({
      ...prev,
      features: [
        ...(prev.features || []),
        { icon: "QA", title: "New feature", description: "", path: "", linkText: "" },
      ],
    }));
  };

  const removeFeature = (index: number) => {
    setContent((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const updateWhyBuy = (index: number, field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      whyBuy: (prev.whyBuy || []).map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }));
  };

  const addWhyBuy = () => {
    setContent((prev) => ({
      ...prev,
      whyBuy: [
        ...(prev.whyBuy || []),
        { icon: "QA", title: "New item", description: "" },
      ],
    }));
  };

  const removeWhyBuy = (index: number) => {
    setContent((prev) => ({
      ...prev,
      whyBuy: (prev.whyBuy || []).filter((_, i) => i !== index),
    }));
  };

  const updateHeroImage = (index: number, value: string) => {
    setContent((prev) => ({
      ...prev,
      heroImages: (prev.heroImages || []).map((img, i) => (i === index ? value : img)),
    }));
  };

  const addHeroImage = () => {
    setContent((prev) => ({
      ...prev,
      heroImages: [...(prev.heroImages || []), "/images/hero.jpg"],
    }));
  };

  const removeHeroImage = (index: number) => {
    setContent((prev) => ({
      ...prev,
      heroImages: (prev.heroImages || []).filter((_, i) => i !== index),
    }));
  };

  const save = () => {
    setHomeContent(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!content.hero) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Home content</h1>
        <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
      {saved && <div className="mb-6 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm font-semibold text-accent-dark">Home content saved.</div>}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Hero section</h3>
        <div className="grid gap-6 mt-4">
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-semibold text-neutral-700 block mb-1">Hero banner images (URLs)</label>
            <div className="grid gap-3">
              {(content.heroImages || []).map((img: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    value={img || ""}
                    onChange={(e) => updateHeroImage(i, e.target.value)}
                    placeholder="/images/hero.jpg"
                  />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeHeroImage(i)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={addHeroImage}>
                Add image
              </button>
              <p className="text-sm text-neutral-500 text-sm text-neutral-500-reset text-sm text-neutral-500-small">
                Tip: Use paths like <code>/images/hero.jpg</code> (from <code>public/</code>) or full URLs.
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-neutral-700 block mb-1">Title</label>
            <input value={content.hero?.title || ''} onChange={(e) => {}} className="" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-neutral-700 block mb-1">Subtitle</label>
            <input value={content.hero?.subtitle || ''} onChange={(e) => {}} className="" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-neutral-700 block mb-1">Description</label>
            <textarea value={content.hero?.description || ''} onChange={(e) => {}} className="" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Primary button text</label>
              <input value={content.hero?.primaryCta || ''} onChange={(e) => {}} className="" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Primary button path</label>
              <input value={content.hero?.primaryCtaPath || ''} onChange={(e) => {}} className="" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Secondary button text</label>
              <input value={content.hero?.secondaryCta || ''} onChange={(e) => {}} className="" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Secondary button path</label>
              <input value={content.hero?.secondaryCtaPath || ''} onChange={(e) => {}} className="" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Feature cards</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addFeature}>Add feature</button>
        </div>
        {(content.features || []).map((f, i) => (
          <div key={i} className="grid gap-6 mt-4 grid gap-6 mt-4-space-bottom-lg">
            <div className="flex justify-end mb-4">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeFeature(i)}>
                Delete
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Icon Label</label>
                <input value={f.icon || ''} onChange={(e) => {}} className="" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Title</label>
                <input value={f.title || ''} onChange={(e) => {}} className="" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Description</label>
              <input value={f.description || ''} onChange={(e) => {}} className="" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Link path</label>
                <input value={f.path || ''} onChange={(e) => {}} className="" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Link text</label>
                <input value={f.linkText || ''} onChange={(e) => {}} className="" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Why buy section</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addWhyBuy}>Add item</button>
        </div>
        {(content.whyBuy || []).map((b, i) => (
          <div key={i} className="grid gap-6 mt-4 grid gap-6 mt-4-space-bottom">
            <div className="flex justify-end mb-4">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeWhyBuy(i)}>
                Delete
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Icon</label>
                <input value={b.icon || ''} onChange={(e) => {}} className="" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Title</label>
                <input value={b.title || ''} onChange={(e) => {}} className="" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Description</label>
              <input value={b.description || ''} onChange={(e) => {}} className="" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">CTA section (bottom)</h3>
        <div className="grid gap-6 mt-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-neutral-700 block mb-1">Title</label>
            <input value={content.ctaSection?.title || ''} onChange={(e) => {}} className="" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-neutral-700 block mb-1">Description</label>
            <input value={content.ctaSection?.description || ''} onChange={(e) => {}} className="" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Button text</label>
              <input value={content.ctaSection?.buttonText || ''} onChange={(e) => {}} className="" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Button path</label>
              <input value={content.ctaSection?.buttonPath || ''} onChange={(e) => {}} className="" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminNavigation() {
  const { getNavigationForAdmin, setNavigation, remoteImages } = useStore();
  const [nav, setNav] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = getNavigationForAdmin();
    setNav(JSON.parse(JSON.stringify(data || {})));
  }, [getNavigationForAdmin]);

  const save = () => {
    if (nav) {
      setNavigation(nav);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const updateSection = (sectionKey, field, value) => {
    setNav((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next?.[sectionKey]) return prev;
      next[sectionKey][field] = value;
      return next;
    });
  };

  const updateItem = (sectionKey, colIndex, itemIndex, field, value) => {
    setNav((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const section = next[sectionKey];
      if (!section?.columns?.[colIndex]?.items) return prev;
      const items = section.columns[colIndex].items;
      if (items[itemIndex]) items[itemIndex][field] = value;
      return next;
    });
  };

  if (!nav) return <p>Loading…</p>;

  const sectionKeys = Object.keys(nav);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Navigation</h1>
        <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
      {saved && <div className="mb-6 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm font-semibold text-accent-dark">Navigation saved.</div>}
      <p className="text-sm text-neutral-500 text-sm text-neutral-500-bottom">Toggle “Show” to hide a navigation section or item. Icon = image index (0–29).</p>
      {sectionKeys.map((sectionKey) => (
        <div key={sectionKey} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <div className="nav-section-editor">
            <input
              value={nav[sectionKey]?.title || ''}
              onChange={(e) => updateSection(sectionKey, 'title', e.target.value)}
              placeholder="Section title"
            />
            <input
              value={nav[sectionKey]?.path || ''}
              onChange={(e) => updateSection(sectionKey, 'path', e.target.value)}
              placeholder="Section path"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!nav[sectionKey]?.hidden}
                onChange={(e) => updateSection(sectionKey, 'hidden', !e.target.checked)}
              />
              Show
            </label>
          </div>

          {(nav[sectionKey]?.columns || []).map((col, colIndex) => (
            <div key={colIndex} className="nav-editor-section">
              <h4>{col.title}</h4>
              {(col.items || []).map((item, itemIndex) => (
                <div key={itemIndex} className="nav-editor-item">
                  <input
                    value={item.name || ''}
                    onChange={(e) => updateItem(sectionKey, colIndex, itemIndex, 'name', e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    value={item.path || ''}
                    onChange={(e) => updateItem(sectionKey, colIndex, itemIndex, 'path', e.target.value)}
                    placeholder="Path"
                  />
                  <select
                    value={item.iconIndex ?? 0}
                    onChange={(e) => updateItem(sectionKey, colIndex, itemIndex, 'iconIndex', Number(e.target.value))}
                    aria-label="Icon index"
                  >
                    {Array.from({ length: (remoteImages || []).length }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!item.hidden}
                      onChange={(e) => updateItem(sectionKey, colIndex, itemIndex, 'hidden', !e.target.checked)}
                    />
                    Show
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function AdminReviews() {
  const { getReviews, setReviews } = useStore();
  const [reviews, setReviewsState] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setReviewsState(getReviews() || []);
  }, [getReviews]);

  const update = (index, field, value) => {
    setReviewsState((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addReview = () => {
    setReviewsState((prev) => [
      ...(prev || []),
      { rating: 5, text: "", author: "", verified: true },
    ]);
  };

  const removeReview = (index) => {
    if (window.confirm("Delete this review?")) {
      setReviewsState((prev) => (prev || []).filter((_, i) => i !== index));
    }
  };

  const save = () => {
    setReviews(reviews);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Reviews</h1>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-secondary" onClick={addReview}>Add review</button>
          <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
        </div>
      </div>
      {saved && <div className="mb-6 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm font-semibold text-accent-dark">Reviews saved.</div>}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Customer reviews (homepage)</h3>
        {reviews.map((r, i) => (
          <div key={i} className="review-editor-item">
            <button
              type="button"
              className="btn btn-danger btn-sm admin-self-end"
              onClick={() => removeReview(i)}
            >
              Delete
            </button>
            <select
              value={r.rating || 5}
              onChange={(e) => update(i, 'rating', Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} stars</option>
              ))}
            </select>
            <textarea value={r.text || ''} onChange={(e) => {}} className="" />
            <input value={r.author || ''} onChange={(e) => {}} className="" />
            <select value={r.verified ? 'yes' : 'no'} onChange={(e) => update(i, 'verified', e.target.value === 'yes')} className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:border-primary focus:outline-none transition">
              <option value="yes">Verified</option>
              <option value="no">No</option>
            </select>
          </div>
        ))}
      </div>
    </>
  );
}

function AdminPromotions() {
  const { getPromotions, setPromotions } = useStore();
  const [promotions, setPromotionsState] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPromotionsState(getPromotions());
  }, [getPromotions]);

  const save = () => {
    if (!promotions) return;
    setPromotions(promotions);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const setTopInfoBar = (patch: any) => {
    setPromotionsState((prev: any) => ({
      ...(prev || {}),
      topInfoBar: { ...(prev?.topInfoBar || {}), ...(patch || {}) },
    }));
  };

  const updateTopInfoItem = (index: number, value: string) => {
    setTopInfoBar({
      items: (promotions?.topInfoBar?.items || []).map((t: string, i: number) => (i === index ? value : t)),
    });
  };

  const addTopInfoItem = () => {
    setTopInfoBar({ items: [...(promotions?.topInfoBar?.items || []), "NEW OFFER"] });
  };

  const removeTopInfoItem = (index: number) => {
    setTopInfoBar({ items: (promotions?.topInfoBar?.items || []).filter((_: any, i: number) => i !== index) });
  };

  const setOffers = (patch: any) => {
    setPromotionsState((prev: any) => ({
      ...(prev || {}),
      offers: { ...(prev?.offers || {}), ...(patch || {}) },
    }));
  };

  const categories = promotions?.offers?.categories || [];
  const offers = promotions?.offers?.offers || [];

  const addCategory = () => {
    const id = `category_${Date.now()}`;
    setOffers({ categories: [...categories, { id, name: "New Category" }] });
  };

  const updateCategory = (id: string, value: string) => {
    setOffers({
      categories: categories.map((c: any) => (c.id === id ? { ...c, name: value } : c)),
    });
  };

  const removeCategory = (id: string) => {
    if (!window.confirm("Delete this offer category? Offers in it will be moved to another category.")) return;
    const remaining = categories.filter((c: any) => c.id !== id);
    const fallbackId = remaining[0]?.id || "";
    setOffers({
      categories: remaining,
      offers: offers.map((o: any) => (o.categoryId === id ? { ...o, categoryId: fallbackId } : o)),
    });
  };

  const addOffer = () => {
    const id = `offer_${Date.now()}`;
    const categoryId = categories[0]?.id || "";
    setOffers({
      offers: [
        ...offers,
        {
          id,
          categoryId,
          name: "New Offer",
          enabled: false,
          appliesTo: "all",
          discountPercent: 10,
          startDate: "",
          endDate: "",
        },
      ],
    });
  };

  const updateOffer = (id: string, patch: any) => {
    setOffers({
      offers: offers.map((o: any) => (o.id === id ? { ...o, ...(patch || {}) } : o)),
    });
  };

  const removeOffer = (id: string) => {
    if (!window.confirm("Delete this offer?")) return;
    setOffers({ offers: offers.filter((o: any) => o.id !== id) });
  };

  if (!promotions) return <p>Loading…</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Promotions</h1>
        <button type="button" className="btn btn-primary" onClick={save}>
          Save changes
        </button>
      </div>
      {saved && <div className="mb-6 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm font-semibold text-accent-dark">Promotions saved.</div>}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Top info bar</h3>
        <div className="grid gap-6 mt-4">
          <label className="flex items-center gap-2 text-sm grid gap-6 mt-4-space-bottom">
            <input
              type="checkbox"
              checked={Boolean(promotions?.topInfoBar?.enabled)}
              onChange={(e) => setTopInfoBar({ enabled: e.target.checked })}
            />
            Enabled
          </label>
          <div className="grid gap-3">
            {(promotions?.topInfoBar?.items || []).map((t: string, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <input value={t || ""} onChange={(e) => {}} className="" />
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTopInfoItem(i)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addTopInfoItem}>
              Add item
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Offer categories</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addCategory}>
            Add category
          </button>
        </div>
        <div className="grid gap-6 mt-4 grid gap-6 mt-4-space-top">
          {(categories || []).length === 0 ? (
            <p className="text-sm text-neutral-500 text-sm text-neutral-500-reset">No categories yet.</p>
          ) : (
            <div className="grid gap-3">
              {categories.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3">
                  <input value={c.name || ""} onChange={(e) => {}} className="" />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCategory(c.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Offers</h3>
          <div className="admin-toggle-cluster">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(promotions?.offers?.stackWithMemberDiscount)}
                onChange={(e) => setOffers({ stackWithMemberDiscount: e.target.checked })}
              />
              Stack with member discount
            </label>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addOffer}>
              Add offer
            </button>
          </div>
        </div>

        <p className="text-sm text-neutral-500 text-sm text-neutral-500-reset text-sm text-neutral-500-top">
          Offers apply automatically on the site when enabled.
        </p>

        <div className="grid gap-6 mt-4 grid gap-6 mt-4-space-top">
          {(offers || []).length === 0 ? (
            <p className="text-sm text-neutral-500 text-sm text-neutral-500-reset">No offers yet.</p>
          ) : (
            <div className="admin-stack-regular">
              {offers.map((o: any) => (
                <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6-muted">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-neutral-700 block mb-1">Name</label>
                      <input value={o.name || ""} onChange={(e) => {}} className="" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-neutral-700 block mb-1">Category</label>
                      <select
                        value={o.categoryId || ""}
                        onChange={(e) => updateOffer(o.id, { categoryId: e.target.value })}
                      >
                        {(categories || []).map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-neutral-700 block mb-1">Discount (%)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="95"
                        value={Number(o.discountPercent ?? 0)}
                        onChange={(e) => updateOffer(o.id, { discountPercent: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-neutral-700 block mb-1">Applies to</label>
                      <select
                        value={o.appliesTo || "all"}
                        onChange={(e) => updateOffer(o.id, { appliesTo: e.target.value })}
                      >
                        <option value="all">All products</option>
                        <option value="car">Car remotes</option>
                        <option value="garage">Garage remotes</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-neutral-700 block mb-1">Start date (optional)</label>
                      <input
                        type="date"
                        value={o.startDate || ""}
                        onChange={(e) => updateOffer(o.id, { startDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-neutral-700 block mb-1">End date (optional)</label>
                      <input
                        type="date"
                        value={o.endDate || ""}
                        onChange={(e) => updateOffer(o.id, { endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(o.enabled)}
                        onChange={(e) => updateOffer(o.id, { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOffer(o.id)}>
                      Delete offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// New Admin Components

function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics</h1>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="grid gap-6 mt-4-select h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:border-primary focus:outline-none transition">
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Analytics (not configured)</h3>
        <p className="admin-muted-copy">
          Real analytics for {timeRange} requires an analytics provider + event tracking. This section currently shows no
          hardcoded numbers.
        </p>
        <p className="admin-muted-copy text-sm text-neutral-500-top">
          Recommended: add a tracking provider (GA4/Plausible/PostHog) and capture checkout + product view events.
        </p>
      </div>
    </>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'customer' });

  const persistUsersToLocalStorage = (list) => {
    try {
      const toSave = (list || [])
        .filter((u) => u && u.id !== 'admin')
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role || 'customer',
          status: u.status || 'active',
          createdAt: u.createdAt || new Date().toISOString(),
        }));
      localStorage.setItem('users', JSON.stringify(toSave));
    } catch {}
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('users') || '[]';
      const list = JSON.parse(raw);
      const normalized = Array.isArray(list) ? list : [];
      const adminRow = {
        id: 'admin',
        name: 'Admin',
        email: 'admin@allremotes.com',
        role: 'admin',
        status: 'active',
        joined: '—',
      };
      setUsers([
        adminRow,
        ...normalized.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role || 'customer',
          status: u.status || 'active',
          createdAt: u.createdAt || '',
          joined: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '—',
        })),
      ]);
    } catch {
      setUsers([
        { id: 'admin', name: 'Admin', email: 'admin@allremotes.com', role: 'admin', status: 'active', joined: '—' },
      ]);
    }
  }, []);

  const addUser = () => {
    if (newUser.name && newUser.email && newUser.password) {
      const createdAt = new Date().toISOString();
      const row = {
        id: String(Date.now()),
        ...newUser,
        status: 'active',
        createdAt,
        joined: createdAt.split('T')[0],
      };
      const next = [...users, row];
      setUsers(next);
      persistUsersToLocalStorage(next);
      setNewUser({ name: '', email: '', password: '', role: 'customer' });
      setShowAddUser(false);
    }
  };

  const toggleUserStatus = (userId) => {
    if (userId === 'admin') return;
    const next = users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    );
    setUsers(next);
    persistUsersToLocalStorage(next);
  };

  const deleteUser = (userId) => {
    if (userId === 'admin') return;
    if (window.confirm('Are you sure you want to delete this user?')) {
      const next = users.filter(user => user.id !== userId);
      setUsers(next);
      persistUsersToLocalStorage(next);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">User Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>
          Add User
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <p className="admin-muted-copy">
          Users are stored in this browser's <code>localStorage</code> (demo auth). To make users global + secure,
          replace client-side auth with a backend auth/session system.
        </p>
      </div>

      {showAddUser && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add New User</h3>
          <div className="grid gap-6 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Name</label>
                <input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter user name"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Set a password"
                />
              </div>
              <div className="grid gap-2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="grid gap-2 admin-inline-row">
                <button className="btn btn-primary" onClick={addUser} disabled={!newUser.name || !newUser.email || !newUser.password}>Add User</button>
                <button className="btn btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{user.name}</td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{user.email}</td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">{user.joined}</td>
                  <td className="px-4 py-3 border-t border-neutral-100 px-4 py-3 border-t border-neutral-100">
                    <div className="actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleUserStatus(user.id)}
                        disabled={user.id === 'admin'}
                      >
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(user.id)}
                        disabled={user.id === 'admin'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">User Statistics</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
              <span>Total Users</span>
              <strong>{users.length}</strong>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
              <span>Active Users</span>
              <strong>{users.filter(u => u.status === 'active').length}</strong>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
              <span>Admin Users</span>
              <strong>{users.filter(u => u.role === 'admin').length}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Signups</h3>
          <div className="grid gap-4">
            {users.slice(-3).reverse().map(user => (
              <div key={user.id} className="admin-inline-copy">
                <strong>{user.name}</strong> - {user.email}
                <small>Joined {user.joined}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">User Roles</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
              <span>Customers</span>
              <strong>{users.filter(u => u.role === 'customer').length}</strong>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
              <span>Admins</span>
              <strong>{users.filter(u => u.role === 'admin').length}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminSettings() {
  const { getSettings, setSettings: persistSettings } = useStore();
  const [settings, setSettings] = useState<any>({});

  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    setSettings(getSettings());
  }, [getSettings]);

  const saveSettings = () => {
    persistSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const resetAllData = async () => {
    if (!window.confirm("This will delete ALL local test data (products, content, orders) and clear this browser's saved admin/user/cart data. Continue?")) {
      return;
    }
    setResetError("");
    setResetting(true);
    try {
      const resp = await fetch("/api/admin/reset", { method: "POST" });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error || "Reset failed");
      }

      try {
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (
            k.startsWith("allremotes_") ||
            k.startsWith("cart_") ||
            k === "user" ||
            k === "users"
          ) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      try {
        (document.cookie || "")
          .split(";")
          .map((c) => c.split("=")[0]?.trim())
          .filter((name) => name && name.startsWith("cart_"))
          .forEach((name) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          });
      } catch {}

      window.location.href = "/";
    } catch (err: any) {
      setResetError(err?.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Site Settings</h1>
        <div className="flex gap-3 mb-6 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
          <button className="btn btn-primary" onClick={saveSettings}>
            Save Settings
          </button>
          <button className="btn btn-danger" onClick={resetAllData} disabled={resetting}>
            {resetting ? "Resetting…" : "Reset Test Data"}
          </button>
        </div>
      </div>

      {saved && <div className="mb-6 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm font-semibold text-accent-dark">Settings saved successfully!</div>}
      {resetError && <div className="error-message mb-6 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm font-semibold text-primary-dark">{resetError}</div>}

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">General Settings</h3>
          <div className="grid gap-6 mt-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Site Name</label>
              <input
                value={settings.siteName}
                onChange={(e) => updateSetting('siteName', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Site Email</label>
              <input
                type="email"
                value={settings.siteEmail}
                onChange={(e) => updateSetting('siteEmail', e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Items Per Page</label>
                <input
                  type="number"
                  value={settings.itemsPerPage}
                  onChange={(e) => updateSetting('itemsPerPage', parseInt(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Melbourne">Melbourne</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Feature Toggles</h3>
          <div className="grid gap-6 mt-4">
            <div className="grid gap-2">
              <label className="font-semibold text-neutral-900">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                />
                <span>Maintenance Mode</span>
              </label>
              <div className="text-sm text-neutral-500 mt-1">
                Disable the site for maintenance
              </div>
            </div>
            <div className="grid gap-2">
              <label className="font-semibold text-neutral-900">
                <input
                  type="checkbox"
                  checked={settings.enableRegistration}
                  onChange={(e) => updateSetting('enableRegistration', e.target.checked)}
                />
                <span>Enable User Registration</span>
              </label>
              <div className="text-sm text-neutral-500 mt-1">
                Allow new users to register
              </div>
            </div>
            <div className="grid gap-2">
              <label className="font-semibold text-neutral-900">
                <input
                  type="checkbox"
                  checked={settings.enableReviews}
                  onChange={(e) => updateSetting('enableReviews', e.target.checked)}
                />
                <span>Enable Reviews</span>
              </label>
              <div className="text-sm text-neutral-500 mt-1">
                Allow customers to leave reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">System Information</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          <div>
            <strong>Version:</strong> 1.0.0
          </div>
          <div>
            <strong>Environment:</strong> {process.env.NODE_ENV || 'unknown'}
          </div>
          <div>
            <strong>Database:</strong> MongoDB (if configured) / Local JSON fallback
          </div>
          <div>
            <strong>Persistence:</strong> `/api/content/*` + `/api/products` + `/api/orders`
          </div>
          <div>
            <strong>Reset:</strong> Disabled in prod unless `ALLOW_ADMIN_RESET=1`
          </div>
          <div>
            <strong>Note:</strong> Analytics/users need integration
          </div>
        </div>
      </div>
    </>
  );
}

export default Admin;

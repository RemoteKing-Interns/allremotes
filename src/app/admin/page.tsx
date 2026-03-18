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
      <div className="admin-page">
        <div className="admin-login-wrap">
          <div className="admin-login-box">
            <img src="/images/mainlogo.png" alt="ALLREMOTES" className="admin-login-logo" />
            <h1>Admin</h1>
            <span className="admin-badge">Staff only</span>
            <p className="auth-subtitle admin-login-subtitle">
              Sign in with your admin account to manage the website.
            </p>
            {loginError && <div className="error-message">{loginError}</div>}
            <form onSubmit={handleAdminLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@allremotes.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-large admin-submit">
                Sign in
              </button>
            </form>
            <p className="auth-footer admin-login-footer">
              <Link href="/">← Back to site</Link>
            </p>
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
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="admin-nav-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
            <Link className="admin-nav-item" href="/admin/upload-products">
              <span className="admin-nav-icon">UP</span>
              <span>Upload CSV</span>
            </Link>
          </nav>
          <div className="admin-sidebar-footer">
            <Link href="/" className="admin-sidebar-link">
              ← View site
            </Link>
          </div>
        </aside>
        <main className="admin-main">
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
      <div className="admin-header-row">
        <h1>Orders</h1>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div className="error-message admin-feedback">{error}</div>}

      <div className="admin-card">
        {loading ? (
          <div className="admin-empty-state">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="admin-empty-state">No orders yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="admin-cell-strong">{o.id}</td>
                    <td>{new Date(o.createdAt || Date.now()).toLocaleString()}</td>
                    <td>{o?.customer?.email || "—"}</td>
                    <td>{Array.isArray(o.items) ? o.items.length : 0}</td>
                    <td>AU${Number(o?.pricing?.total || 0).toFixed(2)}</td>
                    <td>
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
      <div className="admin-header-row">
        <h1>Dashboard</h1>
        <div className="admin-time">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      <div className="admin-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`admin-card admin-stat-card admin-stat-card--${stat.tone}`}>
            <div>
              <span className="admin-stat-value">{stat.value}</span>
              <div className="admin-stat-label">{stat.label}</div>
            </div>
            <span className="admin-stat-badge">{stat.icon}</span>
          </div>
        ))}
      </div>

      <div className="admin-panels-grid">
        <div className="admin-card">
          <h3>Recent Activity</h3>
          <div className="admin-activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="admin-activity-item">
                <div className="admin-activity-dot"></div>
                <div className="admin-activity-copy">
                  <strong>{activity.action}</strong>
                  <div>{activity.item}</div>
                </div>
                <div className="admin-activity-meta">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h3>Quick Actions</h3>
          <div className="admin-quick-actions">
            <button className="btn btn-primary admin-action-button">
              Add New Product
            </button>
            <button className="btn btn-secondary admin-action-button">
              View Analytics
            </button>
            <button className="btn btn-secondary admin-action-button">
              Site Settings
            </button>
            <button className="btn btn-secondary admin-action-button">
              Import Products
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3>Hero Preview</h3>
        <div className="admin-hero-preview">
          <div className="admin-hero-copy">
            <p><strong>Title:</strong> {home?.hero?.title || 'Not set'}</p>
            <p><strong>Subtitle:</strong> {home?.hero?.subtitle || 'Not set'}</p>
            <p><strong>Description:</strong> {home?.hero?.description || 'Not set'}</p>
          </div>
          <div className="admin-hero-card">
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
      <div className="admin-header-row">
        <h1>Products</h1>
        <div className="admin-actions-top">
          <button type="button" className="btn btn-primary" onClick={addNew}>Add product</button>
          <button type="button" className="btn btn-secondary" onClick={save}>Save all changes</button>
        </div>
      </div>
      {saved && <div className="admin-success">Changes saved. The site will show the updated products.</div>}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <img src={p.image} alt="" className="admin-thumb" />
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>{p.inStock ? 'Yes' : 'No'}</td>
                  <td>
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
        <div className="admin-card">
          <h3>Edit: {productForEdit.name}</h3>
          <div className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  value={productForEdit.name}
                  onChange={(e) => update(productForEdit.id, 'name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={productForEdit.category}
                  onChange={(e) => update(productForEdit.id, 'category', e.target.value)}
                >
                  <option value="garage">Garage</option>
                  <option value="car">Car</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price (AU$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForEdit.price}
                  onChange={(e) => update(productForEdit.id, 'price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Image</label>
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
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={productForEdit.description || ''}
                onChange={(e) => update(productForEdit.id, 'description', e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Brand</label>
                <input
                  value={productForEdit.brand || ''}
                  onChange={(e) => update(productForEdit.id, 'brand', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>In stock</label>
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
      <div className="admin-header-row">
        <h1>Home content</h1>
        <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
      {saved && <div className="admin-success">Home content saved.</div>}
      <div className="admin-card">
        <h3>Hero section</h3>
        <div className="admin-form">
          <div className="form-group full-width">
            <label>Hero banner images (URLs)</label>
            <div className="admin-stack-tight">
              {(content.heroImages || []).map((img: string, i: number) => (
                <div key={i} className="admin-row-item">
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
              <p className="admin-note admin-note-reset admin-note-small">
                Tip: Use paths like <code>/images/hero.jpg</code> (from <code>public/</code>) or full URLs.
              </p>
            </div>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input value={content.hero?.title || ''} onChange={(e) => update('hero.title', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Subtitle</label>
            <input value={content.hero?.subtitle || ''} onChange={(e) => update('hero.subtitle', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={content.hero?.description || ''} onChange={(e) => update('hero.description', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Primary button text</label>
              <input value={content.hero?.primaryCta || ''} onChange={(e) => update('hero.primaryCta', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Primary button path</label>
              <input value={content.hero?.primaryCtaPath || ''} onChange={(e) => update('hero.primaryCtaPath', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Secondary button text</label>
              <input value={content.hero?.secondaryCta || ''} onChange={(e) => update('hero.secondaryCta', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Secondary button path</label>
              <input value={content.hero?.secondaryCtaPath || ''} onChange={(e) => update('hero.secondaryCtaPath', e.target.value)} />
            </div>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="admin-heading-row">
          <h3>Feature cards</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addFeature}>Add feature</button>
        </div>
        {(content.features || []).map((f, i) => (
          <div key={i} className="admin-form admin-form-space-bottom-lg">
            <div className="admin-inline-row-end">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeFeature(i)}>
                Delete
              </button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Icon Label</label>
                <input value={f.icon || ''} onChange={(e) => updateFeature(i, 'icon', e.target.value)} placeholder="e.g. CR" />
              </div>
              <div className="form-group">
                <label>Title</label>
                <input value={f.title || ''} onChange={(e) => updateFeature(i, 'title', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={f.description || ''} onChange={(e) => updateFeature(i, 'description', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Link path</label>
                <input value={f.path || ''} onChange={(e) => updateFeature(i, 'path', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Link text</label>
                <input value={f.linkText || ''} onChange={(e) => updateFeature(i, 'linkText', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="admin-card">
        <div className="admin-heading-row">
          <h3>Why buy section</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addWhyBuy}>Add item</button>
        </div>
        {(content.whyBuy || []).map((b, i) => (
          <div key={i} className="admin-form admin-form-space-bottom">
            <div className="admin-inline-row-end">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeWhyBuy(i)}>
                Delete
              </button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Icon</label>
                <input value={b.icon || ''} onChange={(e) => updateWhyBuy(i, 'icon', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Title</label>
                <input value={b.title || ''} onChange={(e) => updateWhyBuy(i, 'title', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={b.description || ''} onChange={(e) => updateWhyBuy(i, 'description', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <div className="admin-card">
        <h3>CTA section (bottom)</h3>
        <div className="admin-form">
          <div className="form-group">
            <label>Title</label>
            <input value={content.ctaSection?.title || ''} onChange={(e) => setContent((p) => ({ ...p, ctaSection: { ...p.ctaSection, title: e.target.value } }))} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={content.ctaSection?.description || ''} onChange={(e) => setContent((p) => ({ ...p, ctaSection: { ...p.ctaSection, description: e.target.value } }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Button text</label>
              <input value={content.ctaSection?.buttonText || ''} onChange={(e) => setContent((p) => ({ ...p, ctaSection: { ...p.ctaSection, buttonText: e.target.value } }))} />
            </div>
            <div className="form-group">
              <label>Button path</label>
              <input value={content.ctaSection?.buttonPath || ''} onChange={(e) => setContent((p) => ({ ...p, ctaSection: { ...p.ctaSection, buttonPath: e.target.value } }))} />
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
      <div className="admin-header-row">
        <h1>Navigation</h1>
        <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
      {saved && <div className="admin-success">Navigation saved.</div>}
      <p className="admin-note admin-note-bottom">Toggle “Show” to hide a navigation section or item. Icon = image index (0–29).</p>
      {sectionKeys.map((sectionKey) => (
        <div key={sectionKey} className="admin-card">
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
            <label className="admin-inline-check">
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
                  <label className="admin-inline-check">
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
      <div className="admin-header-row">
        <h1>Reviews</h1>
        <div className="admin-actions-top">
          <button type="button" className="btn btn-secondary" onClick={addReview}>Add review</button>
          <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
        </div>
      </div>
      {saved && <div className="admin-success">Reviews saved.</div>}
      <div className="admin-card">
        <h3>Customer reviews (homepage)</h3>
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
            <textarea value={r.text || ''} onChange={(e) => update(i, 'text', e.target.value)} placeholder="Review text" />
            <input value={r.author || ''} onChange={(e) => update(i, 'author', e.target.value)} placeholder="Author" />
            <select value={r.verified ? 'yes' : 'no'} onChange={(e) => update(i, 'verified', e.target.value === 'yes')}>
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
      <div className="admin-header-row">
        <h1>Promotions</h1>
        <button type="button" className="btn btn-primary" onClick={save}>
          Save changes
        </button>
      </div>
      {saved && <div className="admin-success">Promotions saved.</div>}

      <div className="admin-card">
        <h3>Top info bar</h3>
        <div className="admin-form">
          <label className="admin-inline-check admin-form-space-bottom">
            <input
              type="checkbox"
              checked={Boolean(promotions?.topInfoBar?.enabled)}
              onChange={(e) => setTopInfoBar({ enabled: e.target.checked })}
            />
            Enabled
          </label>
          <div className="admin-stack-tight">
            {(promotions?.topInfoBar?.items || []).map((t: string, i: number) => (
              <div key={i} className="admin-row-item">
                <input value={t || ""} onChange={(e) => updateTopInfoItem(i, e.target.value)} />
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

      <div className="admin-card">
        <div className="admin-heading-row">
          <h3>Offer categories</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addCategory}>
            Add category
          </button>
        </div>
        <div className="admin-form admin-form-space-top">
          {(categories || []).length === 0 ? (
            <p className="admin-note admin-note-reset">No categories yet.</p>
          ) : (
            <div className="admin-stack-tight">
              {categories.map((c: any) => (
                <div key={c.id} className="admin-row-item">
                  <input value={c.name || ""} onChange={(e) => updateCategory(c.id, e.target.value)} />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCategory(c.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-heading-row">
          <h3>Offers</h3>
          <div className="admin-toggle-cluster">
            <label className="admin-inline-check">
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

        <p className="admin-note admin-note-reset admin-note-top">
          Offers apply automatically on the site when enabled.
        </p>

        <div className="admin-form admin-form-space-top">
          {(offers || []).length === 0 ? (
            <p className="admin-note admin-note-reset">No offers yet.</p>
          ) : (
            <div className="admin-stack-regular">
              {offers.map((o: any) => (
                <div key={o.id} className="admin-card admin-card-muted">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input value={o.name || ""} onChange={(e) => updateOffer(o.id, { name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
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

                  <div className="form-row">
                    <div className="form-group">
                      <label>Discount (%)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="95"
                        value={Number(o.discountPercent ?? 0)}
                        onChange={(e) => updateOffer(o.id, { discountPercent: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Applies to</label>
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

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start date (optional)</label>
                      <input
                        type="date"
                        value={o.startDate || ""}
                        onChange={(e) => updateOffer(o.id, { startDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>End date (optional)</label>
                      <input
                        type="date"
                        value={o.endDate || ""}
                        onChange={(e) => updateOffer(o.id, { endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="admin-heading-row">
                    <label className="admin-inline-check">
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
      <div className="admin-header-row">
        <h1>Analytics</h1>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="admin-form-select">
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="admin-card">
        <h3>Analytics (not configured)</h3>
        <p className="admin-muted-copy">
          Real analytics for {timeRange} requires an analytics provider + event tracking. This section currently shows no
          hardcoded numbers.
        </p>
        <p className="admin-muted-copy admin-note-top">
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
      <div className="admin-header-row">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>
          Add User
        </button>
      </div>

      <div className="admin-card">
        <p className="admin-muted-copy">
          Users are stored in this browser's <code>localStorage</code> (demo auth). To make users global + secure,
          replace client-side auth with a backend auth/session system.
        </p>
      </div>

      {showAddUser && (
        <div className="admin-card">
          <h3>Add New User</h3>
          <div className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter user name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Set a password"
                />
              </div>
              <div className="form-group" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group admin-inline-row">
                <button className="btn btn-primary" onClick={addUser} disabled={!newUser.name || !newUser.email || !newUser.password}>Add User</button>
                <button className="btn btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`admin-status-pill ${user.role === 'admin' ? 'admin-status-pill--admin' : 'admin-status-pill--customer'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status-pill ${user.status === 'active' ? 'admin-status-pill--active' : 'admin-status-pill--inactive'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.joined}</td>
                  <td>
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

      <div className="admin-insight-grid">
        <div className="admin-card">
          <h3>User Statistics</h3>
          <div className="admin-simple-stack">
            <div className="admin-simple-row">
              <span>Total Users</span>
              <strong>{users.length}</strong>
            </div>
            <div className="admin-simple-row">
              <span>Active Users</span>
              <strong>{users.filter(u => u.status === 'active').length}</strong>
            </div>
            <div className="admin-simple-row">
              <span>Admin Users</span>
              <strong>{users.filter(u => u.role === 'admin').length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3>Recent Signups</h3>
          <div className="admin-simple-stack">
            {users.slice(-3).reverse().map(user => (
              <div key={user.id} className="admin-inline-copy">
                <strong>{user.name}</strong> - {user.email}
                <small>Joined {user.joined}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h3>User Roles</h3>
          <div className="admin-simple-stack">
            <div className="admin-simple-row">
              <span>Customers</span>
              <strong>{users.filter(u => u.role === 'customer').length}</strong>
            </div>
            <div className="admin-simple-row">
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
      <div className="admin-header-row">
        <h1>Site Settings</h1>
        <div className="admin-toolbar">
          <button className="btn btn-primary" onClick={saveSettings}>
            Save Settings
          </button>
          <button className="btn btn-danger" onClick={resetAllData} disabled={resetting}>
            {resetting ? "Resetting…" : "Reset Test Data"}
          </button>
        </div>
      </div>

      {saved && <div className="admin-success">Settings saved successfully!</div>}
      {resetError && <div className="error-message admin-feedback">{resetError}</div>}

      <div className="admin-panels-grid">
        <div className="admin-card">
          <h3>General Settings</h3>
          <div className="admin-form">
            <div className="form-group">
              <label>Site Name</label>
              <input
                value={settings.siteName}
                onChange={(e) => updateSetting('siteName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Site Email</label>
              <input
                type="email"
                value={settings.siteEmail}
                onChange={(e) => updateSetting('siteEmail', e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Items Per Page</label>
                <input
                  type="number"
                  value={settings.itemsPerPage}
                  onChange={(e) => updateSetting('itemsPerPage', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
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
            <div className="form-group">
              <label>Timezone</label>
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

        <div className="admin-card">
          <h3>Feature Toggles</h3>
          <div className="admin-form">
            <div className="form-group">
              <label className="admin-setting-label">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                />
                <span>Maintenance Mode</span>
              </label>
              <div className="admin-setting-note">
                Disable the site for maintenance
              </div>
            </div>
            <div className="form-group">
              <label className="admin-setting-label">
                <input
                  type="checkbox"
                  checked={settings.enableRegistration}
                  onChange={(e) => updateSetting('enableRegistration', e.target.checked)}
                />
                <span>Enable User Registration</span>
              </label>
              <div className="admin-setting-note">
                Allow new users to register
              </div>
            </div>
            <div className="form-group">
              <label className="admin-setting-label">
                <input
                  type="checkbox"
                  checked={settings.enableReviews}
                  onChange={(e) => updateSetting('enableReviews', e.target.checked)}
                />
                <span>Enable Reviews</span>
              </label>
              <div className="admin-setting-note">
                Allow customers to leave reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3>System Information</h3>
        <div className="admin-results-grid">
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

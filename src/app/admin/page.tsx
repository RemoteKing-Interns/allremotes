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
            <h1>Admin</h1>
            <span className="admin-badge">Staff only</span>
            <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: 24 }}>
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
              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }}>
                Sign in
              </button>
            </form>
            <p className="auth-footer" style={{ marginTop: 20 }}>
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'home', label: 'Home content', icon: '🏠' },
    { id: 'promotions', label: 'Promotions', icon: '🏷️' },
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <h2>Admin</h2>
          <nav className="admin-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
            <Link className="admin-nav-item" href="/admin/upload-products">
              <span>📥</span>
              <span>Upload CSV</span>
            </Link>
          </nav>
          <div style={{ padding: 20, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
              ← View site
            </Link>
          </div>
        </aside>
        <main className="admin-main">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'analytics' && <AdminAnalytics />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'products' && <AdminProducts />}
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

function AdminDashboard() {
  const { getProducts, getHomeContent, getNavigation, getReviews } = useStore();
  const products = getProducts();
  const home = getHomeContent();
  const nav = getNavigation();
  const reviews = getReviews();
  const productCount = products?.length ?? 0;
  const navKeys = Object.keys(nav || {});
  
  const stats = [
    { label: 'Total Products', value: productCount, icon: '📦', color: '#667eea' },
    { label: 'Navigation Items', value: navKeys.length, icon: '🧭', color: '#764ba2' },
    { label: 'Reviews', value: reviews?.length ?? 0, icon: '⭐', color: '#f59e0b' },
    { label: 'Active Promotions', value: 3, icon: '🏷️', color: '#10b981' },
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
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
        {stats.map((stat, index) => (
          <div key={index} className="admin-card" style={{ marginBottom: 0, background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>{stat.label}</div>
              </div>
              <div style={{ fontSize: 32, opacity: 0.8 }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="admin-card">
          <h3>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.map((activity, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#667eea' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{activity.action}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{activity.item}</div>
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <span>➕</span> Add New Product
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <span>📊</span> View Analytics
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <span>⚙️</span> Site Settings
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <span>📥</span> Import Products
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3>Hero Preview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'center' }}>
          <div>
            <p><strong>Title:</strong> {home?.hero?.title || 'Not set'}</p>
            <p><strong>Subtitle:</strong> {home?.hero?.subtitle || 'Not set'}</p>
            <p><strong>Description:</strong> {home?.hero?.description || 'Not set'}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20, borderRadius: 12, color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Hero Section</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Main landing area</div>
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
                    <img src={p.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
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
        { icon: "✓", title: "New feature", description: "", path: "", linkText: "" },
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
        { icon: "✓", title: "New item", description: "" },
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
            <div style={{ display: "grid", gap: 10 }}>
              {(content.heroImages || []).map((img: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
              <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Feature cards</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addFeature}>Add feature</button>
        </div>
        {(content.features || []).map((f, i) => (
          <div key={i} className="admin-form" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeFeature(i)}>
                Delete
              </button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Icon (emoji)</label>
                <input value={f.icon || ''} onChange={(e) => updateFeature(i, 'icon', e.target.value)} placeholder="🚗" />
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Why buy section</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addWhyBuy}>Add item</button>
        </div>
        {(content.whyBuy || []).map((b, i) => (
          <div key={i} className="admin-form" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
      <p style={{ marginBottom: 20 }}>Toggle “Show” to hide a navigation section or item. Icon = image index (0–29).</p>
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
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', fontSize: 14 }}>
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
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', fontSize: 14 }}>
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
              className="btn btn-danger btn-sm"
              style={{ justifySelf: "end" }}
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
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={Boolean(promotions?.topInfoBar?.enabled)}
              onChange={(e) => setTopInfoBar({ enabled: e.target.checked })}
            />
            Enabled
          </label>
          <div style={{ display: "grid", gap: 10 }}>
            {(promotions?.topInfoBar?.items || []).map((t: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Offer categories</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addCategory}>
            Add category
          </button>
        </div>
        <div className="admin-form" style={{ marginTop: 16 }}>
          {(categories || []).length === 0 ? (
            <p style={{ margin: 0, opacity: 0.8 }}>No categories yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {categories.map((c: any) => (
                <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Offers</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
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

        <p style={{ marginTop: 12, marginBottom: 0, opacity: 0.8 }}>
          Offers apply automatically on the site when enabled.
        </p>

        <div className="admin-form" style={{ marginTop: 16 }}>
          {(offers || []).length === 0 ? (
            <p style={{ margin: 0, opacity: 0.8 }}>No offers yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {offers.map((o: any) => (
                <div key={o.id} className="admin-card" style={{ marginBottom: 0, background: "var(--gray-light)" }}>
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

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
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
  
  const analyticsData = {
    visitors: { today: 1247, week: 8432, month: 32156 },
    pageViews: { today: 3421, week: 23456, month: 89234 },
    conversion: { today: 3.2, week: 2.8, month: 3.1 },
    revenue: { today: 1247, week: 8432, month: 32156 }
  };

  const chartData = [
    { day: 'Mon', visitors: 1200, pageViews: 3400 },
    { day: 'Tue', visitors: 1400, pageViews: 3800 },
    { day: 'Wed', visitors: 1100, pageViews: 3200 },
    { day: 'Thu', visitors: 1600, pageViews: 4200 },
    { day: 'Fri', visitors: 1800, pageViews: 4800 },
    { day: 'Sat', visitors: 2100, pageViews: 5200 },
    { day: 'Sun', visitors: 1900, pageViews: 4600 },
  ];

  return (
    <>
      <div className="admin-header-row">
        <h1>Analytics</h1>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="admin-form-select" style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid rgba(0,0,0,0.08)' }}>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#666' }}>Visitors</span>
            <span style={{ fontSize: 20 }}>👥</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#667eea' }}>{analyticsData.visitors[timeRange]?.toLocaleString() || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>↑ 12% from last period</div>
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#666' }}>Page Views</span>
            <span style={{ fontSize: 20 }}>📄</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#764ba2' }}>{analyticsData.pageViews[timeRange]?.toLocaleString() || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>↑ 8% from last period</div>
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#666' }}>Conversion Rate</span>
            <span style={{ fontSize: 20 }}>🎯</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{analyticsData.conversion[timeRange] || 'N/A'}%</div>
          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>↓ 2% from last period</div>
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#666' }}>Revenue</span>
            <span style={{ fontSize: 20 }}>💰</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>${analyticsData.revenue[timeRange]?.toLocaleString() || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>↑ 18% from last period</div>
        </div>
      </div>

      <div className="admin-card">
        <h3>Traffic Overview</h3>
        <div style={{ height: 300, background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#667eea' }}>Analytics Chart</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Interactive charts would be displayed here</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Integration with Chart.js or similar library needed</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="admin-card">
          <h3>Top Pages</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Home', 'Products', 'About', 'Contact', 'Blog'].map((page, index) => (
              <div key={page} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#667eea' }}>#{index + 1}</span>
                  <span>{page}</span>
                </div>
                <span style={{ fontSize: 14, color: '#666' }}>{Math.floor(Math.random() * 5000 + 1000).toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h3>Traffic Sources</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { source: 'Organic Search', percentage: 45, color: '#667eea' },
              { source: 'Direct', percentage: 25, color: '#764ba2' },
              { source: 'Social Media', percentage: 20, color: '#f59e0b' },
              { source: 'Referral', percentage: 10, color: '#10b981' },
            ].map(({ source, percentage, color }) => (
              <div key={source} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, fontSize: 12, fontWeight: 600, color }}>{percentage}%</div>
                <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: 4 }}></div>
                </div>
                <span style={{ fontSize: 14, color: '#666' }}>{source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'customer', joined: '2024-01-15', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin', joined: '2024-01-10', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'customer', joined: '2024-01-20', status: 'inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'customer', joined: '2024-01-25', status: 'active' },
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'customer' });

  const addUser = () => {
    if (newUser.name && newUser.email) {
      setUsers([...users, {
        id: users.length + 1,
        ...newUser,
        joined: new Date().toISOString().split('T')[0],
        status: 'active'
      }]);
      setNewUser({ name: '', email: '', role: 'customer' });
      setShowAddUser(false);
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  return (
    <>
      <div className="admin-header-row">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>
          <span>➕</span> Add User
        </button>
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
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <button className="btn btn-primary" onClick={addUser}>Add User</button>
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
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: user.role === 'admin' ? '#667eea20' : '#10b98120',
                      color: user.role === 'admin' ? '#667eea' : '#10b981'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: user.status === 'active' ? '#10b98120' : '#ef444420',
                      color: user.status === 'active' ? '#10b981' : '#ef4444'
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.joined}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(user.id)}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
        <div className="admin-card">
          <h3>User Statistics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Users</span>
              <strong>{users.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Active Users</span>
              <strong>{users.filter(u => u.status === 'active').length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Admin Users</span>
              <strong>{users.filter(u => u.role === 'admin').length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3>Recent Signups</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.slice(-3).reverse().map(user => (
              <div key={user.id} style={{ fontSize: 14 }}>
                <strong>{user.name}</strong> - {user.email}
                <div style={{ fontSize: 12, color: '#666' }}>Joined {user.joined}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h3>User Roles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Customers</span>
              <strong>{users.filter(u => u.role === 'customer').length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
  const [settings, setSettings] = useState({
    siteName: 'AllRemotes',
    siteEmail: 'contact@allremotes.com',
    maintenanceMode: false,
    enableRegistration: true,
    enableReviews: true,
    itemsPerPage: 12,
    currency: 'USD',
    timezone: 'UTC',
  });

  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <>
      <div className="admin-header-row">
        <h1>Site Settings</h1>
        <button className="btn btn-primary" onClick={saveSettings}>
          <span>💾</span> Save Settings
        </button>
      </div>

      {saved && <div className="admin-success">Settings saved successfully!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
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
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3>Feature Toggles</h3>
          <div className="admin-form">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                />
                <span style={{ flex: 1, minWidth: 0 }}>Maintenance Mode</span>
              </label>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, marginLeft: 32 }}>
                Disable the site for maintenance
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="checkbox"
                  checked={settings.enableRegistration}
                  onChange={(e) => updateSetting('enableRegistration', e.target.checked)}
                />
                <span style={{ flex: 1, minWidth: 0 }}>Enable User Registration</span>
              </label>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, marginLeft: 32 }}>
                Allow new users to register
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="checkbox"
                  checked={settings.enableReviews}
                  onChange={(e) => updateSetting('enableReviews', e.target.checked)}
                />
                <span style={{ flex: 1, minWidth: 0 }}>Enable Reviews</span>
              </label>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, marginLeft: 32 }}>
                Allow customers to leave reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3>System Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <strong>Version:</strong> 1.0.0
          </div>
          <div>
            <strong>Environment:</strong> Development
          </div>
          <div>
            <strong>Database:</strong> MongoDB
          </div>
          <div>
            <strong>Last Backup:</strong> 2 hours ago
          </div>
          <div>
            <strong>Storage Used:</strong> 2.3 GB
          </div>
          <div>
            <strong>Uptime:</strong> 99.9%
          </div>
        </div>
      </div>
    </>
  );
}

export default Admin;

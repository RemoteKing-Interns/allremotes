import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import './Admin.css';

const ADMIN_EMAIL = 'admin@allremotes.com';

const Admin = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
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
      navigate('/');
    }
  }, [user, navigate, loginEmail]);

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
              <Link to="/">← Back to site</Link>
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
          <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Go home</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'home', label: 'Home content', icon: '🏠' },
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
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
            <Link className="admin-nav-item" to="/admin/upload-products">
              <span>📥</span>
              <span>Upload CSV</span>
            </Link>
          </nav>
          <div style={{ padding: 20, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>← View site</Link>
          </div>
        </aside>
        <main className="admin-main">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'home' && <AdminHome />}
          {activeTab === 'navigation' && <AdminNavigation />}
          {activeTab === 'reviews' && <AdminReviews />}
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
  return (
    <>
      <div className="admin-header-row">
        <h1>Dashboard</h1>
      </div>
      <div className="admin-card">
        <h3>Overview</h3>
        <p>Use the sidebar to edit Products, Home content, Navigation, and Reviews. Changes are saved to this browser and appear on the site immediately.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <strong style={{ fontSize: 32, color: 'var(--primary-teal)' }}>{productCount}</strong>
          <div>Products</div>
        </div>
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <strong style={{ fontSize: 32, color: 'var(--primary-teal)' }}>{navKeys.length}</strong>
          <div>Nav sections</div>
        </div>
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <strong style={{ fontSize: 32, color: 'var(--primary-teal)' }}>{reviews?.length ?? 0}</strong>
          <div>Reviews</div>
        </div>
      </div>
      <div className="admin-card">
        <h3>Hero</h3>
        <p><strong>Title:</strong> {home?.hero?.title}</p>
        <p><strong>Subtitle:</strong> {home?.hero?.subtitle}</p>
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
  const [content, setContent] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(getHomeContent());
  }, [getHomeContent]);

  const update = (path, value) => {
    const [section, key] = path.split('.');
    setContent((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  };

  const updateFeature = (index, field, value) => {
    setContent((prev) => ({
      ...prev,
      features: (prev.features || []).map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    }));
  };

  const updateWhyBuy = (index, field, value) => {
    setContent((prev) => ({
      ...prev,
      whyBuy: (prev.whyBuy || []).map((b, i) => (i === index ? { ...b, [field]: value } : b)),
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
        <h3>Feature cards</h3>
        {(content.features || []).map((f, i) => (
          <div key={i} className="admin-form" style={{ marginBottom: 20 }}>
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
        <h3>Why buy section</h3>
        {(content.whyBuy || []).map((b, i) => (
          <div key={i} className="admin-form" style={{ marginBottom: 16 }}>
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

  const sectionKeys = Object.keys(nav).filter((k) => nav[k]?.columns);

  return (
    <>
      <div className="admin-header-row">
        <h1>Navigation</h1>
        <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
      {saved && <div className="admin-success">Navigation saved.</div>}
      <p style={{ marginBottom: 20 }}>Edit menu item names and paths. Icon = image index (0–29).</p>
      {sectionKeys.map((sectionKey) => (
        <div key={sectionKey} className="admin-card">
          <h3>{nav[sectionKey]?.title || sectionKey}</h3>
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
                  >
                    {Array.from({ length: (remoteImages || []).length }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
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

  const save = () => {
    setReviews(reviews);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <div className="admin-header-row">
        <h1>Reviews</h1>
        <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
      {saved && <div className="admin-success">Reviews saved.</div>}
      <div className="admin-card">
        <h3>Customer reviews (homepage)</h3>
        {reviews.map((r, i) => (
          <div key={i} className="review-editor-item">
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

export default Admin;

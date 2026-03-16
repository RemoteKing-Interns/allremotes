"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";

const ADMIN_EMAIL = 'admin@allremotes.com';

const STORAGE_KEYS = {
  home: "allremotes_home_content",
  navigation: "allremotes_navigation",
  reviews: "allremotes_reviews",
  promotions: "allremotes_promotions",
  settings: "allremotes_settings",
};

const isRecord = (value: any): value is Record<string, any> => {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
};

const slugify = (value: string) => {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "general";
};

const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeNavigationFromApi = (data: any) => {
  if (!data) return {};
  if (Array.isArray(data)) {
    const out: Record<string, any> = {};
    data.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const id = String(item.id || "").trim() || `item_${index + 1}`;
      out[id] = {
        title: item.label ?? item.title ?? id,
        path: item.link ?? item.path ?? "",
        hidden: item.visible === false,
        columns: Array.isArray(item.columns) ? item.columns : [],
      };
    });
    return out;
  }
  if (isRecord(data)) return data;
  return {};
};

const serializeNavigationForApi = (nav: any) => {
  if (!nav) return [];
  if (Array.isArray(nav)) return nav;
  if (!isRecord(nav)) return [];
  return Object.entries(nav).map(([id, section]) => ({
    id,
    label: (section as any)?.title ?? id,
    link: (section as any)?.path ?? "",
    iconIndex: (section as any)?.iconIndex ?? 0,
    visible: !(section as any)?.hidden,
    columns: Array.isArray((section as any)?.columns) ? (section as any).columns : [],
  }));
};

const normalizeHomeFromApi = (data: any) => {
  if (!isRecord(data)) return {};
  if (data?.hero?.primaryCta || data?.hero?.primaryCtaPath || data?.ctaSection) return data;

  const hero = isRecord(data.hero) ? data.hero : {};
  const buttons = Array.isArray(hero.buttons) ? hero.buttons : [];
  const primary = buttons[0] || {};
  const secondary = buttons[1] || {};

  return {
    ...data,
    heroImages: Array.isArray(data.heroImages) ? data.heroImages : ["/images/hero.jpg"],
    hero: {
      title: hero.title ?? "",
      subtitle: hero.subtitle ?? "",
      description: hero.description ?? "",
      primaryCta: primary.label ?? "",
      primaryCtaPath: primary.link ?? "",
      secondaryCta: secondary.label ?? "",
      secondaryCtaPath: secondary.link ?? "",
    },
    features: Array.isArray(data.features)
      ? data.features.map((f: any) => ({
          ...f,
          path: f?.path ?? f?.link ?? "",
          linkText: f?.linkText ?? (f?.link ? "Explore ->" : ""),
        }))
      : [],
    whyBuy: Array.isArray(data.whyBuy) ? data.whyBuy : [],
    ctaSection: data.ctaSection ?? {
      title: data.cta?.title ?? "",
      description: data.cta?.description ?? "",
      buttonText: data.cta?.buttonText ?? "",
      buttonPath: data.cta?.buttonLink ?? "",
    },
  };
};

const serializeHomeForApi = (data: any) => {
  if (!isRecord(data)) return data;
  if (Array.isArray(data?.hero?.buttons)) return data;

  const hero = isRecord(data.hero) ? data.hero : {};
  const buttons: Array<{ label: string; link: string }> = [];

  if (hero.primaryCta || hero.primaryCtaPath) {
    buttons.push({ label: hero.primaryCta ?? "", link: hero.primaryCtaPath ?? "" });
  }
  if (hero.secondaryCta || hero.secondaryCtaPath) {
    buttons.push({ label: hero.secondaryCta ?? "", link: hero.secondaryCtaPath ?? "" });
  }

  return {
    hero: {
      title: hero.title ?? "",
      subtitle: hero.subtitle ?? "",
      description: hero.description ?? "",
      buttons,
    },
    features: Array.isArray(data.features)
      ? data.features.map((f: any) => ({
          icon: f?.icon ?? "",
          title: f?.title ?? "",
          description: f?.description ?? "",
          link: f?.link ?? f?.path ?? "",
        }))
      : [],
    whyBuy: Array.isArray(data.whyBuy)
      ? data.whyBuy.map((b: any) => ({
          icon: b?.icon ?? "",
          title: b?.title ?? "",
          description: b?.description ?? "",
        }))
      : [],
    cta: {
      title: data.cta?.title ?? data.ctaSection?.title ?? "",
      description: data.cta?.description ?? data.ctaSection?.description ?? "",
      buttonText: data.cta?.buttonText ?? data.ctaSection?.buttonText ?? "",
      buttonLink: data.cta?.buttonLink ?? data.ctaSection?.buttonPath ?? "",
    },
  };
};

const normalizePromotionsFromApi = (data: any) => {
  if (!isRecord(data)) return null;
  if (data.topInfoBar || data.offers?.categories) return data;

  const infoBar = Array.isArray(data.infoBar) ? data.infoBar : [];
  const offerGroups = Array.isArray(data.offers) ? data.offers : [];
  const categories = offerGroups.map((group: any, index: number) => {
    const name = String(group?.name || `Offer Category ${index + 1}`).trim();
    return { id: group?.id || slugify(name), name };
  });

  const offers: any[] = [];
  offerGroups.forEach((group: any, index: number) => {
    const category = categories[index];
    const discounts = Array.isArray(group?.discounts) ? group.discounts : [];
    discounts.forEach((disc: any, dIndex: number) => {
      const discObj = isRecord(disc) ? disc : {};
      const percent = Number(discObj.discountPercent ?? discObj.percent ?? disc ?? 0);
      offers.push({
        id: discObj.id || `${category?.id || "category"}_${dIndex + 1}`,
        categoryId: category?.id || "",
        name: discObj.name || `${category?.name || "Offer"} Discount`,
        enabled: Boolean(discObj.enabled),
        appliesTo: discObj.appliesTo || "all",
        discountPercent: Number.isFinite(percent) ? percent : 0,
        startDate: discObj.startDate || "",
        endDate: discObj.endDate || "",
      });
    });
  });

  return {
    topInfoBar: {
      enabled: infoBar.length > 0,
      items: infoBar,
    },
    offers: {
      categories,
      offers,
      stackWithMemberDiscount: false,
    },
  };
};

const serializePromotionsForApi = (data: any) => {
  if (!isRecord(data)) return data;
  if (Array.isArray(data.infoBar) && Array.isArray(data.offers)) return data;

  const infoBar = Array.isArray(data?.topInfoBar?.items) ? data.topInfoBar.items : [];
  const categories = Array.isArray(data?.offers?.categories) ? data.offers.categories : [];
  const offers = Array.isArray(data?.offers?.offers) ? data.offers.offers : [];

  if (categories.length === 0 && offers.length > 0) {
    categories.push({ id: "general", name: "General" });
  }

  const groups = categories.map((category: any) => {
    const categoryId = category?.id || slugify(category?.name || "general");
    const name = category?.name || "General";
    return {
      id: categoryId,
      name,
      discounts: offers
        .filter((offer: any) => (offer?.categoryId || "general") === categoryId)
        .map((offer: any) => ({
          id: offer?.id || `${categoryId}_${slugify(offer?.name || "offer")}`,
          name: offer?.name || "Offer",
          enabled: Boolean(offer?.enabled),
          appliesTo: offer?.appliesTo || "all",
          discountPercent: Number(offer?.discountPercent || 0),
          startDate: offer?.startDate || "",
          endDate: offer?.endDate || "",
        })),
    };
  });

  return { infoBar, offers: groups };
};

const normalizeSettingsFromApi = (data: any) => {
  if (!isRecord(data)) return {};
  if (data.siteEmail || !data.contactEmail) return data;
  return { ...data, siteEmail: data.contactEmail };
};

const serializeSettingsForApi = (data: any) => {
  if (!isRecord(data)) return data;
  if (data.contactEmail || data.showOutOfStock != null) return data;
  return {
    siteName: data.siteName ?? "",
    contactEmail: data.siteEmail ?? "",
    currency: data.currency ?? "AUD",
    showOutOfStock: true,
  };
};

const normalizeReviewsFromApi = (data: any) => {
  if (!Array.isArray(data)) return [];
  return data.map((review: any, index: number) => ({
    id: review?.id || makeId(`review_${index}`),
    author: review?.author ?? "",
    rating: Number(review?.rating ?? 5),
    text: review?.text ?? "",
    verified: Boolean(review?.verified),
    date: review?.date ?? new Date().toISOString().split("T")[0],
  }));
};

const serializeReviewsForApi = (reviews: any[]) => {
  return (reviews || []).map((review: any, index: number) => ({
    id: review?.id || makeId(`review_${index}`),
    author: review?.author ?? "",
    rating: Number(review?.rating ?? 5),
    text: review?.text ?? "",
    verified: Boolean(review?.verified),
    date: review?.date ?? new Date().toISOString().split("T")[0],
  }));
};

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
    { id: 'orders', label: 'Orders', icon: '🧾' },
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
          {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
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
      const resp = await fetch("/api/orders", { cache: "no-store" });
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
      const resp = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to update order");
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...(data || {}), status } : o)));
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

      {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-card">
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : orders.length === 0 ? (
          <p>No orders yet.</p>
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
                    <td style={{ fontWeight: 600 }}>{o.id}</td>
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

function AdminDashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { getHomeContent, getPromotions } = useStore();
  const router = useRouter();
  const home = getHomeContent();
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [promotionCount, setPromotionCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const [productsRes, ordersRes, reviewsRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" }),
          fetch("/api/content?section=reviews", { cache: "no-store" }),
        ]);

        const productsData = await productsRes.json().catch(() => null);
        const ordersData = await ordersRes.json().catch(() => null);
        const reviewsData = await reviewsRes.json().catch(() => null);

        if (!cancelled) {
          setProductCount(Array.isArray(productsData) ? productsData.length : 0);
          setOrderCount(Array.isArray(ordersData) ? ordersData.length : 0);
          setReviewCount(Array.isArray(reviewsData?.data) ? reviewsData.data.length : 0);
        }
      } catch {
        if (!cancelled) {
          setProductCount(0);
          setOrderCount(0);
          setReviewCount(0);
        }
      }
    };

    loadCounts();

    const promotions = getPromotions?.();
    const activeOffers = Array.isArray(promotions?.offers?.offers)
      ? promotions.offers.offers.filter((o: any) => o?.enabled).length
      : 0;
    setPromotionCount(activeOffers);

    return () => {
      cancelled = true;
    };
  }, [getPromotions]);
  
  const stats = [
    { label: 'Total Products', value: productCount, icon: '📦', color: '#667eea' },
    { label: 'Orders', value: orderCount, icon: '🧾', color: '#22c55e' },
    { label: 'Reviews', value: reviewCount, icon: '⭐', color: '#f59e0b' },
    { label: 'Active Promotions', value: promotionCount, icon: '🏷️', color: '#10b981' },
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
            <button
              className="btn btn-primary"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => onNavigate?.("products")}
            >
              <span>➕</span> Add New Product
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => onNavigate?.("analytics")}
            >
              <span>📊</span> View Analytics
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => onNavigate?.("settings")}
            >
              <span>⚙️</span> Site Settings
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => router.push("/admin/upload-products")}
            >
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const resp = await fetch("/api/products", { cache: "no-store" });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || "Failed to load products");
        if (!cancelled) setProductsState(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!cancelled) {
          setProductsState(getProducts());
          setLoadError(err?.message || "Failed to load products");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
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
      {loadError && <div className="error-message" style={{ marginBottom: 16 }}>{loadError}</div>}
      <div className="admin-card">
        {isLoading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
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
        )}
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
  const { getHomeContent } = useStore();
  const [content, setContent] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch("/api/content?section=home", { cache: "no-store" });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || "Failed to load home content");
        const normalized = normalizeHomeFromApi(data?.data);
        if (!cancelled) setContent(normalized || {});
      } catch {
        if (!cancelled) setContent(getHomeContent());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
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

  const save = async () => {
    setSaveSuccess("");
    setSaveError("");
    try {
      const resp = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "home", data: serializeHomeForApi(content) }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to save home content");
      localStorage.setItem(STORAGE_KEYS.home, JSON.stringify(content));
      setSaveSuccess("Home content saved.");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save home content");
    }
  };

  if (isLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!content.hero) return <p>No home content yet.</p>;

  return (
    <>
      <div className="admin-header-row">
        <h1>Home content</h1>
        <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
      {saveSuccess && <div className="admin-success">{saveSuccess}</div>}
      {saveError && <div className="error-message">{saveError}</div>}
      <div className="admin-card">
        <h3>Hero section</h3>
        <div className="admin-form">
          <div className="form-group full-width">
            <label>Hero banner images (URLs)</label>
            <div style={{ display: "grid", gap: 10 }}>
              {(content.heroImages || []).length === 0 && (
                <p style={{ margin: 0, opacity: 0.8 }}>No hero images yet.</p>
              )}
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
        {(content.features || []).length === 0 && (
          <p style={{ marginTop: 12, opacity: 0.8 }}>No features yet.</p>
        )}
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
        {(content.whyBuy || []).length === 0 && (
          <p style={{ marginTop: 12, opacity: 0.8 }}>No items yet.</p>
        )}
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
  const { getNavigationForAdmin, remoteImages } = useStore();
  const [nav, setNav] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch("/api/content?section=navigation", { cache: "no-store" });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || "Failed to load navigation");
        const normalized = normalizeNavigationFromApi(data?.data);
        if (!cancelled) setNav(JSON.parse(JSON.stringify(normalized || {})));
      } catch {
        if (!cancelled) {
          const fallback = getNavigationForAdmin();
          setNav(JSON.parse(JSON.stringify(fallback || {})));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [getNavigationForAdmin]);

  const save = async () => {
    if (!nav) return;
    setSaveSuccess("");
    setSaveError("");
    try {
      const resp = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "navigation", data: serializeNavigationForApi(nav) }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to save navigation");
      localStorage.setItem(STORAGE_KEYS.navigation, JSON.stringify(nav));
      setSaveSuccess("Navigation saved.");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save navigation");
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

  if (isLoading) return <div className="loading"><div className="spinner"></div></div>;
  if (!nav) return <p>No navigation data yet.</p>;

  const sectionKeys = Object.keys(nav);

  return (
    <>
      <div className="admin-header-row">
        <h1>Navigation</h1>
        <button type="button" className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
      {saveSuccess && <div className="admin-success">{saveSuccess}</div>}
      {saveError && <div className="error-message">{saveError}</div>}
      <p style={{ marginBottom: 20 }}>Toggle “Show” to hide a navigation section or item. Icon = image index (0–29).</p>
      {sectionKeys.length === 0 ? (
        <p>No navigation items yet.</p>
      ) : (
        sectionKeys.map((sectionKey) => (
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
        ))
      )}
    </>
  );
}

function AdminReviews() {
  const { getReviews } = useStore();
  const [reviews, setReviewsState] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch("/api/content?section=reviews", { cache: "no-store" });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || "Failed to load reviews");
        if (!cancelled) setReviewsState(normalizeReviewsFromApi(data?.data));
      } catch {
        if (!cancelled) setReviewsState(normalizeReviewsFromApi(getReviews() || []));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [getReviews]);

  const update = (index, field, value) => {
    setReviewsState((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addReview = () => {
    setReviewsState((prev) => [
      ...(prev || []),
      {
        id: makeId("review"),
        rating: 5,
        text: "",
        author: "",
        verified: true,
        date: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const removeReview = async (index) => {
    if (window.confirm("Delete this review?")) {
      const review = reviews[index];
      const id = review?.id;
      try {
        if (id) {
          const resp = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
          const data = await resp.json().catch(() => null);
          if (!resp.ok) throw new Error(data?.error || "Failed to delete review");
        }
        const next = (reviews || []).filter((_: any, i: number) => i !== index);
        setReviewsState(next);
        localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(next));
      } catch (err: any) {
        setSaveError(err?.message || "Failed to delete review");
      }
    }
  };

  const save = async () => {
    setSaveSuccess("");
    setSaveError("");
    try {
      const resp = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "reviews", data: serializeReviewsForApi(reviews) }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to save reviews");
      localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
      setSaveSuccess("Reviews saved.");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save reviews");
    }
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
      {saveSuccess && <div className="admin-success">{saveSuccess}</div>}
      {saveError && <div className="error-message">{saveError}</div>}
      <div className="admin-card">
        <h3>Customer reviews (homepage)</h3>
        {isLoading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((r, i) => (
            <div key={r.id || i} className="review-editor-item">
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
          ))
        )}
      </div>
    </>
  );
}

function AdminPromotions() {
  const { getPromotions } = useStore();
  const [promotions, setPromotionsState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch("/api/content?section=promotions", { cache: "no-store" });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || "Failed to load promotions");
        const normalized = normalizePromotionsFromApi(data?.data);
        if (!cancelled) setPromotionsState(normalized || getPromotions());
      } catch {
        if (!cancelled) setPromotionsState(getPromotions());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [getPromotions]);

  const save = async () => {
    if (!promotions) return;
    setSaveSuccess("");
    setSaveError("");
    try {
      const resp = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "promotions", data: serializePromotionsForApi(promotions) }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to save promotions");
      localStorage.setItem(STORAGE_KEYS.promotions, JSON.stringify(promotions));
      setSaveSuccess("Promotions saved.");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save promotions");
    }
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

  if (isLoading) return <div className="loading"><div className="spinner"></div></div>;
  if (!promotions) return <p>No promotions yet.</p>;

  return (
    <>
      <div className="admin-header-row">
        <h1>Promotions</h1>
        <button type="button" className="btn btn-primary" onClick={save}>
          Save changes
        </button>
      </div>
      {saveSuccess && <div className="admin-success">{saveSuccess}</div>}
      {saveError && <div className="error-message">{saveError}</div>}

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

      <div className="admin-card">
        <h3>Analytics (not configured)</h3>
        <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.5 }}>
          Real analytics for {timeRange} requires an analytics provider + event tracking. This section currently shows no
          hardcoded numbers.
        </p>
        <p style={{ marginTop: 10, marginBottom: 0, color: '#666', fontSize: 14, lineHeight: 1.5 }}>
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
          <span>➕</span> Add User
        </button>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.5 }}>
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
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
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
  const { getSettings } = useStore();
  const [settings, setSettings] = useState<any>({});

  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch("/api/content?section=settings", { cache: "no-store" });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || "Failed to load settings");
        const normalized = normalizeSettingsFromApi(data?.data);
        if (!cancelled) {
          const fallback = getSettings();
          setSettings({ ...(fallback || {}), ...(normalized || {}) });
        }
      } catch {
        if (!cancelled) setSettings(getSettings());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [getSettings]);

  const saveSettings = async () => {
    setSaveSuccess("");
    setSaveError("");
    try {
      const resp = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "settings", data: serializeSettingsForApi(settings) }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to save settings");
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
      setSaveSuccess("Settings saved successfully!");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save settings");
    }
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

  if (isLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <>
      <div className="admin-header-row">
        <h1>Site Settings</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={saveSettings}>
            <span>💾</span> Save Settings
          </button>
          <button className="btn btn-danger" onClick={resetAllData} disabled={resetting}>
            <span>🧹</span> {resetting ? "Resetting…" : "Reset Test Data"}
          </button>
        </div>
      </div>

      {saveSuccess && <div className="admin-success">{saveSuccess}</div>}
      {saveError && <div className="error-message" style={{ marginBottom: 16 }}>{saveError}</div>}
      {resetError && <div className="error-message" style={{ marginBottom: 16 }}>{resetError}</div>}

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

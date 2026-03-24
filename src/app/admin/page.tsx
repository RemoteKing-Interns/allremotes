"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Home,
  Megaphone,
  Compass,
  MessageSquareText,
  Settings,
  Upload,
  Plus,
  Import,
  Link2,
  Trash2,
} from "lucide-react";

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
    heroImages: Array.isArray(data.heroImages) ? data.heroImages : [],
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
      <div className="admin-a11y animate-fadeIn">
        <div className="container py-10 sm:py-14">
          <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white/90 p-6 shadow-panel backdrop-blur sm:p-8">
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
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
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
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
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

            <aside className="relative overflow-hidden rounded-xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(251,248,245,0.85))] p-6 shadow-panel backdrop-blur sm:p-8">
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
                  <div key={x.t} className="rounded-xl border border-neutral-200 bg-white/80 p-4 shadow-xs">
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
      <div className="admin-a11y animate-fadeIn">
        <div className="container py-10 sm:py-14">
          <div className="mx-auto max-w-2xl rounded-xl border border-neutral-200 bg-white/85 p-8 text-center shadow-panel backdrop-blur">
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
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      iconHover: "group-hover:border-rose-200 group-hover:bg-rose-50 group-hover:text-rose-700",
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      iconHover: "group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-700",
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      iconHover: "group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700",
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      iconHover: "group-hover:border-amber-200 group-hover:bg-amber-50 group-hover:text-amber-700",
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      iconHover: "group-hover:border-violet-200 group-hover:bg-violet-50 group-hover:text-violet-700",
    },
    {
      id: 'home',
      label: 'Home content',
      icon: Home,
      iconHover: "group-hover:border-cyan-200 group-hover:bg-cyan-50 group-hover:text-cyan-700",
    },
    {
      id: 'promotions',
      label: 'Promotions',
      icon: Megaphone,
      iconHover: "group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700",
    },
    {
      id: 'navigation',
      label: 'Navigation',
      icon: Compass,
      iconHover: "group-hover:border-fuchsia-200 group-hover:bg-fuchsia-50 group-hover:text-fuchsia-700",
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: MessageSquareText,
      iconHover: "group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700",
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      iconHover: "group-hover:border-teal-200 group-hover:bg-teal-50 group-hover:text-teal-700",
    },
  ];

  return (
    <div className="admin-a11y animate-fadeIn">
      <div className="container py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-xl border border-neutral-200 bg-white/85 p-5 shadow-panel backdrop-blur lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <img src="/images/mainlogo.png" alt="ALLREMOTES" className="h-9 w-auto" />
              <div className="min-w-0">
                <strong className="block text-sm font-semibold text-neutral-900">Operations Console</strong>
                <span className="block text-xs font-semibold text-neutral-500">Catalog and content</span>
              </div>
            </div>

            <nav className="mt-5 grid gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-white shadow-soft"
                        : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-extrabold shadow-sm transition-colors ${
                        isActive
                          ? "border-white/20 bg-white/20 text-white"
                          : `border-neutral-200 bg-white text-neutral-500 ${tab.iconHover}`
                      }`}
                    >
                      <Icon size={16} strokeWidth={2.1} />
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              <Link
                className="group flex flex-row items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-600 transition-all duration-200 hover:bg-neutral-100/80 hover:text-neutral-900"
                href="/admin/upload-products"
              >
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-700">
                  <Upload size={16} strokeWidth={2.1} />
                </span>
                <span>Upload CSV</span>
              </Link>
              <Link
                className="group flex flex-row items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-600 transition-all duration-200 hover:bg-neutral-100/80 hover:text-neutral-900"
                href="/admin/save-hero-urls"
              >
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors group-hover:border-cyan-200 group-hover:bg-cyan-50 group-hover:text-cyan-700">
                  <Link2 size={16} strokeWidth={2.1} />
                </span>
                <span>Save Hero URLs</span>
              </Link>
              <Link
                className="group flex flex-row items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-600 transition-all duration-200 hover:bg-neutral-100/80 hover:text-neutral-900"
                href="/admin/top-info-bar"
              >
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700">
                  <Megaphone size={16} strokeWidth={2.1} />
                </span>
                <span>Top Info Bar</span>
              </Link>
              <Link
                className="group flex flex-row items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-600 transition-all duration-200 hover:bg-neutral-100/80 hover:text-neutral-900"
                href="/admin/clear-cache"
              >
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors group-hover:border-rose-200 group-hover:bg-rose-50 group-hover:text-rose-700">
                  <Trash2 size={16} strokeWidth={2.1} />
                </span>
                <span>Clear Cache</span>
              </Link>
            </nav>

            <div className="mt-5 border-t border-neutral-200 pt-4">
              <Link href="/" className="text-sm font-semibold text-accent-dark hover:text-accent">
                ← View site
              </Link>
            </div>
          </aside>

          <main className="min-w-0">
            {activeTab === 'dashboard' && (
              <AdminDashboard
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}
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
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Orders</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage and track customer orders.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-all hover:bg-neutral-50"
          onClick={load}
          disabled={loading}
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm font-semibold text-primary-dark">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm font-medium text-neutral-500">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-2xl font-bold text-neutral-400">
              📦
            </span>
            <p className="text-sm font-semibold text-neutral-900">No orders yet</p>
            <p className="mt-1 text-sm text-neutral-500">When customers place orders, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold text-center">Items</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-neutral-50/50">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-mono font-medium text-neutral-600">
                        #{o.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-600">
                      {new Date(o.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{o?.customer?.email || "Guest User"}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-neutral-600">
                      {Array.isArray(o.items) ? o.items.length : 0}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-neutral-900">
                      AU${Number(o?.pricing?.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-flex items-center">
                        <select
                          className={`appearance-none rounded-full border border-transparent py-1.5 pl-4 pr-8 text-xs font-bold font-semibold uppercase tracking-wider outline-none ring-1 ring-inset ring-black/5 transition-all focus:ring-2 focus:ring-primary ${
                            o.status === "delivered"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-emerald-600/20"
                              : o.status === "shipped"
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100 ring-blue-600/20"
                              : o.status === "cancelled"
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100 ring-rose-600/20"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100 ring-amber-600/20"
                          }`}
                          value={o.status || "processing"}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          disabled={savingId === o.id}
                        >
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="pointer-events-none absolute right-3 opacity-50">▾</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({
  onNavigateTab,
}: {
  onNavigateTab?: (tabId: string) => void;
}) {
  const { getHomeContent, getPromotions } = useStore();
  const router = useRouter();
  const home = getHomeContent();
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [promotionCount, setPromotionCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      setLoadingStats(true);
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
          setReviewCount(
            Array.isArray(reviewsData?.data) ? reviewsData.data.length : 0,
          );
        }
      } catch {
        if (!cancelled) {
          setProductCount(0);
          setOrderCount(0);
          setReviewCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    };

    loadCounts();

    const promotions = getPromotions?.();
    const activeOffers = Array.isArray(promotions?.offers?.offers)
      ? promotions.offers.offers.filter((offer: any) => offer?.enabled).length
      : 0;
    setPromotionCount(activeOffers);

    return () => {
      cancelled = true;
    };
  }, [getPromotions]);

  const stats = [
    {
      label: "Total Products",
      value: productCount,
      icon: Package,
      tone: "from-blue-500 to-cyan-400",
    },
    {
      label: "Orders",
      value: orderCount,
      icon: ShoppingCart,
      tone: "from-emerald-500 to-teal-400",
    },
    {
      label: "Reviews",
      value: reviewCount,
      icon: MessageSquareText,
      tone: "from-amber-400 to-orange-400",
    },
    {
      label: "Active Promotions",
      value: promotionCount,
      icon: Megaphone,
      tone: "from-rose-500 to-pink-400",
    },
  ];

  const recentActivity = [
    { action: "Product added", item: "New Remote Control", time: "2 hours ago" },
    { action: "Review updated", item: "Customer feedback", time: "5 hours ago" },
    { action: "Price changed", item: "Premium Remote", time: "1 day ago" },
    { action: "Navigation updated", item: "Main menu", time: "2 days ago" },
  ];

  const quickActions = [
    {
      label: "Add New Product",
      icon: Plus,
      onClick: () => onNavigateTab?.("products"),
    },
    {
      label: "View Analytics",
      icon: BarChart3,
      onClick: () => onNavigateTab?.("analytics"),
    },
    {
      label: "Site Settings",
      icon: Settings,
      onClick: () => onNavigateTab?.("settings"),
    },
    {
      label: "Import Products",
      icon: Import,
      onClick: () => router.push("/admin/upload-products"),
    },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">Here's what's happening today.</p>
        </div>
        <div className="inline-flex h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-600 shadow-sm">
          {new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
        </div>
      </div>

      {loadingStats ? (
        <div className="mb-8 flex h-44 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
            <div className="spinner" />
            Loading dashboard metrics...
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              (() => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-panel"
                  >
                    <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${stat.tone} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-neutral-500">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">{stat.value}</p>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${stat.tone} text-white shadow-soft transition-transform duration-200 group-hover:scale-105`}>
                        <StatIcon size={20} strokeWidth={2.2} />
                      </div>
                    </div>
                  </div>
                );
              })()
            ))}
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900">Recent Activity</h3>
                <button className="text-sm font-semibold text-primary hover:text-primary-dark">View all</button>
              </div>
              <div className="relative border-l-2 border-dashed border-neutral-200 pl-4 space-y-6">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="relative flex items-start gap-4 text-sm">
                    <div className="absolute -left-[21px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white" />
                    <div className="min-w-0 flex-1">
                      <strong className="text-neutral-900">{activity.action}</strong>
                      <p className="mt-0.5 text-neutral-600">{activity.item}</p>
                    </div>
                    <div className="shrink-0 pt-0.5 text-xs font-semibold text-neutral-600">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Quick Actions</h3>
              <div className="grid gap-3">
                {quickActions.map((action, i) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={action.onClick}
                      className="group flex w-full items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4 text-left text-sm font-semibold text-neutral-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary-dark"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors group-hover:border-primary/25 group-hover:bg-primary/10 group-hover:text-primary-dark">
                        <ActionIcon size={17} strokeWidth={2.2} />
                      </span>
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Hero Preview</h3>
            <div className="flex flex-col sm:flex-row gap-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex-1 space-y-3 text-sm">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-neutral-600">Title</span>
                  <span className="mt-1 block font-semibold text-neutral-900">{home?.hero?.title || "Not set"}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-neutral-600">Subtitle</span>
                  <span className="mt-1 block font-medium text-neutral-800">{home?.hero?.subtitle || "Not set"}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-neutral-600">Description</span>
                  <span className="mt-1 block leading-relaxed text-neutral-700 line-clamp-2">{home?.hero?.description || "Not set"}</span>
                </div>
              </div>
              <div className="flex h-32 w-full sm:w-56 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 shadow-soft text-sm text-white relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <strong className="tracking-tight">HERO SECTION</strong>
                <span className="mt-1 text-xs text-neutral-200">Main landing area</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
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
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your product catalog and inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-all hover:bg-neutral-50"
            onClick={addNew}
          >
            <span>➕</span> Add Product
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-primary-dark"
            onClick={save}
          >
            <span>💾</span> Save Changes
          </button>
        </div>
      </div>
      {saved && (
        <div className="mb-6 flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
          Changes successfully saved to the catalog.
        </div>
      )}

      {loadError && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-sm">
          {loadError}
        </div>
      )}

      {productForEdit ? (
        <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5 animate-in slide-in-from-bottom-4">
          <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5">
            <h3 className="text-lg font-bold text-neutral-900">Edit Product: {productForEdit.name}</h3>
            <p className="mt-1 text-sm text-neutral-500">Update product details, pricing, and availability.</p>
          </div>
          <div className="p-6">
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">Product Name</label>
                <input
                  className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={productForEdit.name}
                  onChange={(e) => update(productForEdit.id, "name", e.target.value)}
                  placeholder="e.g. Sony Universal Remote"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">Category</label>
                <div className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 pr-10 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={productForEdit.category}
                    onChange={(e) => update(productForEdit.id, "category", e.target.value)}
                  >
                    <option value="garage">Garage</option>
                    <option value="car">Car</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-400">▾</div>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">Price (AU$)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center font-medium text-neutral-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 pl-8 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={productForEdit.price}
                    onChange={(e) => update(productForEdit.id, "price", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">Product Image URL</label>
                <div className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 pr-10 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={productImagePool.indexOf(productForEdit.image) >= 0 ? productImagePool.indexOf(productForEdit.image) : 0}
                    onChange={(e) => update(productForEdit.id, "image", productImagePool[Number(e.target.value)])}
                  >
                    {productImagePool.map((_, i) => (
                      <option key={i} value={i}>Image {i + 1}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-400">▾</div>
                </div>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <label className="text-sm font-semibold text-neutral-800">Description</label>
                <textarea
                  className="min-h-[100px] w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={productForEdit.description || ""}
                  onChange={(e) => update(productForEdit.id, "description", e.target.value)}
                  placeholder="Detailed product overview..."
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">Brand</label>
                <input
                  className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={productForEdit.brand || ""}
                  onChange={(e) => update(productForEdit.id, "brand", e.target.value)}
                  placeholder="e.g. Sony"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">Inventory Status</label>
                <div className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 pr-10 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={productForEdit.inStock ? "yes" : "no"}
                    onChange={(e) => update(productForEdit.id, "inStock", e.target.value === "yes")}
                  >
                    <option value="yes">In Stock</option>
                    <option value="no">Out of Stock</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-400">▾</div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 border-t border-neutral-100 pt-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:bg-primary-dark"
                onClick={() => setEditingId(null)}
              >
                Done Editing
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-700">All Products</h3>
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-600">
              {products.length} Total
            </span>
          </div>
          {isLoading ? (
            <div className="flex h-56 items-center justify-center text-sm font-medium text-neutral-500">
              <div className="mr-2 spinner" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-500">
              No products found. Add your first product!
            </div>
          ) : (
            <>
              <div className="divide-y divide-neutral-100 lg:hidden">
                {products.map((p) => (
                  <div key={p.id} className="grid gap-3 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                        <img src={p.image} alt="" className="h-full w-full object-contain p-1" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-6 text-neutral-900 break-words">
                          {p.name}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-700">
                          <span className="font-semibold tracking-wide text-accent-dark">
                            {(p.sku || p.brand || "Model Unset").toString()}
                          </span>
                          <span className="text-neutral-400">•</span>
                          <span className="font-medium capitalize text-neutral-700">{p.category}</span>
                          <span className="text-neutral-400">•</span>
                          <span className="font-medium text-neutral-700">ID:</span>
                          <span className="font-mono text-[11px] uppercase text-neutral-800">{p.id.slice(-6)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-base font-extrabold text-neutral-900">
                        AU${Number(p.price).toFixed(2)}
                      </span>
                      {p.inStock ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex min-w-[72px] flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-primary-dark"
                        onClick={() => setEditingId(p.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-w-[72px] flex-1 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100"
                        onClick={() => remove(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-hidden lg:block">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="border-b border-neutral-100 bg-white text-neutral-500">
                    <tr>
                      <th className="w-20 px-6 py-4 font-semibold">Image</th>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="w-32 px-6 py-4 font-semibold">Category</th>
                      <th className="w-32 px-6 py-4 font-semibold">Price</th>
                      <th className="w-40 px-6 py-4 font-semibold text-center">Status</th>
                      <th className="w-40 px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {products.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-neutral-50/70">
                        <td className="px-6 py-3 align-top">
                          <div className="h-12 w-12 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                            <img src={p.image} alt="" className="h-full w-full object-contain p-1" />
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="font-semibold leading-6 text-neutral-900 break-words">
                            {p.name}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-700">
                            <span className="font-semibold tracking-wide text-accent-dark">
                              {(p.sku || p.brand || "Model Unset").toString()}
                            </span>
                            <span className="text-neutral-400">•</span>
                            <span className="font-medium text-neutral-700">ID:</span>
                            <span className="font-mono text-[11px] uppercase text-neutral-800">{p.id.slice(-6)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-600">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top font-extrabold text-neutral-900">
                          AU${Number(p.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center align-top">
                          {p.inStock ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right align-top">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex min-w-[56px] items-center justify-center rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-primary-dark"
                              onClick={() => setEditingId(p.id)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex min-w-[56px] items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100"
                              onClick={() => remove(p.id)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AdminHome() {
  const { getHomeContent } = useStore();
  const [content, setContent] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [s3ModalOpen, setS3ModalOpen] = useState(false);
  const [s3Tab, setS3Tab] = useState<"browse" | "upload">("browse");
  const [s3Images, setS3Images] = useState<any[]>([]);
  const [s3Loading, setS3Loading] = useState(false);
  const [s3Error, setS3Error] = useState("");
  const [s3Selected, setS3Selected] = useState<any | null>(null);
  const [s3TargetIndex, setS3TargetIndex] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [heroImageErrors, setHeroImageErrors] = useState<Record<number, boolean>>({});

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

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const loadS3Images = async () => {
    setS3Loading(true);
    setS3Error("");
    try {
      const resp = await fetch("/api/admin/s3", { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (data?.error === "S3 not configured") {
        setS3Images([]);
        setS3Error("S3 is not configured. Add AWS credentials to your .env.local file.");
        return;
      }
      if (!resp.ok) throw new Error(data?.error || "Failed to load S3 images");
      setS3Images(Array.isArray(data?.images) ? data.images : []);
    } catch (err: any) {
      setS3Images([]);
      setS3Error(err?.message || "Failed to load S3 images");
    } finally {
      setS3Loading(false);
    }
  };

  const openS3Modal = (index: number) => {
    setS3TargetIndex(index);
    setS3Selected(null);
    setS3Tab("browse");
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadError("");
    setS3ModalOpen(true);
    loadS3Images();
  };

  const closeS3Modal = () => {
    setS3ModalOpen(false);
    setS3Selected(null);
    setS3TargetIndex(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadError("");
  };

  const uploadToPresignedUrl = (presignedUrl: string, file: File) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error("Upload failed"));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });
  };

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (file.type && !allowedTypes.includes(file.type)) {
      setUploadStatus("error");
      setUploadError("Unsupported file type. Use .jpg, .jpeg, .png, or .webp.");
      return;
    }
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");
    try {
      const resp = await fetch("/api/admin/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
      });
      const data = await resp.json().catch(() => null);
      if (data?.error === "S3 not configured") {
        throw new Error("S3 is not configured. Add AWS credentials to your .env.local file.");
      }
      if (!resp.ok) throw new Error(data?.error || "Failed to start upload");
      await uploadToPresignedUrl(data.presignedUrl, file);
      setUploadStatus("done");
      await loadS3Images();
      if (data?.publicUrl) {
        setS3Selected({ key: data.key, url: data.publicUrl, name: file.name, size: file.size });
      }
    } catch (err: any) {
      setUploadStatus("error");
      setUploadError(err?.message || "Upload failed");
    }
  };

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
    setHeroImageErrors((prev) => ({ ...prev, [index]: false }));
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
    setHeroImageErrors({});
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

  const applySelectedImage = () => {
    if (!s3Selected || s3TargetIndex == null) return;
    updateHeroImage(s3TargetIndex, s3Selected.url);
    closeS3Modal();
  };

  if (isLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!content.hero) return <p>No home content yet.</p>;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Home Content</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage the hero section, features, and promotions on the homepage.</p>
        </div>
        <button 
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={save}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Changes
        </button>
      </div>
      {saveSuccess && (
        <div className="mb-8 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-sm animate-in fade-in slide-in-from-top-2">
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-8 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
          {saveError}
        </div>
      )}

      {/* HERO SECTION */}
      <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5">
          <h3 className="text-lg font-bold text-neutral-900">Hero Section</h3>
          <p className="text-xs text-neutral-500">The main banner at the top of the homepage.</p>
        </div>

        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-2 lg:col-span-2">
              <label className="text-sm font-semibold text-neutral-800">Title</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.hero?.title || ""}
                onChange={(e) => update("hero.title", e.target.value)}
              />
            </div>

            <div className="grid gap-2 lg:col-span-2">
              <label className="text-sm font-semibold text-neutral-800">Subtitle</label>
              <textarea
                className="min-h-[100px] w-full resize-y rounded-lg border border-neutral-300 bg-white p-4 text-sm leading-relaxed text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.hero?.subtitle || ""}
                onChange={(e) => update("hero.subtitle", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-800">Primary Button Text</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.hero?.primaryCta || ""}
                onChange={(e) => update("hero.primaryCta", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-800">Primary Button Path (URL)</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.hero?.primaryCtaPath || ""}
                onChange={(e) => update("hero.primaryCtaPath", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-800">Secondary Button Text</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.hero?.secondaryCta || ""}
                onChange={(e) => update("hero.secondaryCta", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-800">Secondary Button Path (URL)</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.hero?.secondaryCtaPath || ""}
                onChange={(e) => update("hero.secondaryCtaPath", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-800">Hero Images</label>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                onClick={addHeroImage}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Image
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(content.heroImages || []).map((img: string, i: number) => (
                <div key={i} className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Image {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
                        onClick={() => openS3Modal(i)}
                      >
                        Browse S3
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                        onClick={() => removeHeroImage(i)}
                        aria-label={`Remove image ${i + 1}`}
                        title="Remove image"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                    {img && !heroImageErrors[i] ? (
                      <img
                        src={img}
                        alt={`Hero image ${i + 1} preview`}
                        className="h-28 w-full object-cover"
                        onError={() => setHeroImageErrors((prev) => ({ ...prev, [i]: true }))}
                        onLoad={() => setHeroImageErrors((prev) => ({ ...prev, [i]: false }))}
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center text-xs font-medium text-neutral-400">
                        No preview
                      </div>
                    )}
                  </div>

                  <input
                    className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={img || ""}
                    onChange={(e) => updateHeroImage(i, e.target.value)}
                    placeholder="/images/example.jpg"
                  />
                </div>
              ))}
              {(!content.heroImages || content.heroImages.length === 0) && (
                <div className="col-span-1 border-2 border-dashed border-neutral-200 rounded-lg p-8 flex flex-col items-center justify-center text-neutral-500">
                  <svg className="h-8 w-8 text-neutral-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">No hero images added</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-6 py-5">
          <div>
             <h3 className="text-lg font-bold text-neutral-900">Features List</h3>
             <p className="text-xs text-neutral-500">Key selling points displayed below the hero.</p>
          </div>
          <button 
            type="button" 
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            onClick={addFeature}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Feature
          </button>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(content.features || []).map((f: any, i: number) => (
              <div key={i} className="group relative flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button 
                    type="button" 
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    onClick={() => removeFeature(i)}
                    aria-label={`Remove feature ${i + 1}`}
                    title="Remove feature"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-500">{i + 1}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Feature</span>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Icon Name</label>
                  <input
                    className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={f.icon}
                    onChange={(e) => updateFeature(i, "icon", e.target.value)}
                    placeholder="e.g. Activity"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Title</label>
                  <input
                    className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={f.title}
                    onChange={(e) => updateFeature(i, "title", e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Description</label>
                  <textarea
                    className="min-h-[70px] w-full resize-none rounded-md border border-neutral-300 bg-white p-3 text-xs leading-relaxed transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={f.description}
                    onChange={(e) => updateFeature(i, "description", e.target.value)}
                  />
                </div>
              </div>
            ))}
            {(!content.features || content.features.length === 0) && (
              <div className="col-span-full border-2 border-dashed border-neutral-200 rounded-lg p-8 flex flex-col items-center justify-center text-neutral-500">
                <svg className="h-8 w-8 text-neutral-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium">No features added</p>
                <p className="text-xs text-neutral-400 mt-1">Click "Add Feature" to create one.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WHY BUY SECTION */}
      <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-6 py-5">
           <div>
              <h3 className="text-lg font-bold text-neutral-900">Why Buy section block</h3>
              <p className="text-xs text-neutral-500">Secondary feature list lower on the page.</p>
           </div>
          <button 
            type="button" 
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            onClick={addWhyBuy}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Reason
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(content.whyBuy || []).map((w: any, i: number) => (
              <div key={i} className="group relative flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button 
                    type="button" 
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    onClick={() => removeWhyBuy(i)}
                    aria-label={`Remove reason ${i + 1}`}
                    title="Remove reason"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-500">{i + 1}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Reason</span>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Icon Name</label>
                  <input
                    className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={w.icon}
                    onChange={(e) => updateWhyBuy(i, "icon", e.target.value)}
                    placeholder="e.g. ShieldCheck"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Title</label>
                  <input
                    className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={w.title}
                    onChange={(e) => updateWhyBuy(i, "title", e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Description</label>
                  <textarea
                    className="min-h-[70px] w-full resize-none rounded-md border border-neutral-300 bg-white p-3 text-xs leading-relaxed transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={w.description}
                    onChange={(e) => updateWhyBuy(i, "description", e.target.value)}
                  />
                </div>
              </div>
            ))}
            {(!content.whyBuy || content.whyBuy.length === 0) && (
              <div className="col-span-full border-2 border-dashed border-neutral-200 rounded-lg p-8 flex flex-col items-center justify-center text-neutral-500">
                <svg className="h-8 w-8 text-neutral-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">No reasons added</p>
                <p className="text-xs text-neutral-400 mt-1">Click "Add Reason" to create one.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5">
          <h3 className="text-lg font-bold text-neutral-900">Bottom Call-to-Action</h3>
          <p className="text-xs text-neutral-500">The promotional banner at the bottom of the homepage.</p>
        </div>
        
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-800">CTA Title</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.ctaSection?.title || ""}
                onChange={(e) => update("ctaSection.title", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-800">CTA Description</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.ctaSection?.description || ""}
                onChange={(e) => update("ctaSection.description", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-800">Button Text</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.ctaSection?.buttonText || ""}
                onChange={(e) => update("ctaSection.buttonText", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-800">Button Path (URL)</label>
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={content.ctaSection?.buttonPath || ""}
                onChange={(e) => update("ctaSection.buttonPath", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      {s3ModalOpen && (
        <div className="s3-modal-backdrop" role="dialog" aria-modal="true">
          <div className="s3-modal">
            <div className="s3-modal-header">
              <h3 style={{ margin: 0 }}>S3 Image Browser</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={closeS3Modal}>
                Close
              </button>
            </div>
            <div className="s3-modal-tabs">
              <button
                type="button"
                className={`s3-modal-tab ${s3Tab === "browse" ? "active" : ""}`}
                onClick={() => setS3Tab("browse")}
              >
                Browse S3 Images
              </button>
              <button
                type="button"
                className={`s3-modal-tab ${s3Tab === "upload" ? "active" : ""}`}
                onClick={() => setS3Tab("upload")}
              >
                Upload new image
              </button>
            </div>
            <div className="s3-modal-body">
              {s3Tab === "browse" ? (
                s3Loading ? (
                  <div className="loading"><div className="spinner"></div></div>
                ) : s3Error ? (
                  <div className="error-message">{s3Error}</div>
                ) : s3Images.length === 0 ? (
                  <p>No images found in the bucket.</p>
                ) : (
                  <div className="s3-image-grid">
                    {s3Images.map((image: any) => (
                      <button
                        type="button"
                        key={image.key}
                        className={`s3-image-card ${s3Selected?.key === image.key ? "selected" : ""}`}
                        onClick={() => setS3Selected(image)}
                      >
                        <img className="s3-image-thumb" src={image.url} alt={image.name || image.key} />
                        <div className="s3-image-meta">
                          <span>{image.name || image.key}</span>
                          <span>{formatBytes(Number(image.size || 0))}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {s3Error && <div className="error-message">{s3Error}</div>}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadFile(file);
                    }}
                  />
                  {uploadStatus === "uploading" && (
                    <div className="s3-upload-status">Uploading... {uploadProgress}%</div>
                  )}
                  {uploadStatus === "done" && (
                    <div className="s3-upload-status">Upload complete.</div>
                  )}
                  {uploadStatus === "error" && (
                    <div className="error-message">{uploadError || "Upload failed."}</div>
                  )}
                </div>
              )}
            </div>
            <div className="s3-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeS3Modal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={applySelectedImage}
                disabled={!s3Selected}
              >
                Use this image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Navigation Setup</h1>
          <p className="mt-1 text-sm text-neutral-500">Configure header and footer links across the site.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-primary-dark"
          onClick={save}
        >
          <span>💾</span> Save Navigation
        </button>
      </div>
      {saveSuccess && (
        <div className="mb-6 flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-sm">
          {saveError}
        </div>
      )}

      {sectionKeys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm font-medium text-neutral-500">
          No navigation items yet.
        </div>
      ) : (
        sectionKeys.map((sectionKey) => (
          <div key={sectionKey} className="mb-8 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
            <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5">
              <h3 className="text-lg font-bold capitalize text-neutral-900">{sectionKey} Menu</h3>
              <p className="text-xs text-neutral-500">Configure the top-level items and dropdown links.</p>
            </div>

            <div className="p-6">
              <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50/50 p-5">
                <strong className="mb-4 block text-sm font-bold text-neutral-800">Section Properties</strong>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Title</label>
                    <input
                      className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={nav[sectionKey]?.title || ""}
                      onChange={(e) => updateSection(sectionKey, "title", e.target.value)}
                      placeholder="e.g. Products"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Path URL</label>
                    <input
                      className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={nav[sectionKey]?.path || ""}
                      onChange={(e) => updateSection(sectionKey, "path", e.target.value)}
                      placeholder="e.g. /category/products"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="inline-flex cursor-pointer items-center gap-3">
                      <div className="relative flex h-6 w-11 items-center rounded-full bg-neutral-200 transition-colors has-[:checked]:bg-emerald-500">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={!nav[sectionKey]?.hidden}
                          onChange={(e) => updateSection(sectionKey, "hidden", !e.target.checked)}
                        />
                        <span className="absolute left-1 h-4 w-4 transform rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                      </div>
                      <span className="text-sm font-semibold text-neutral-700">Show in Menu</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {(nav[sectionKey]?.columns || []).map((col: any, colIndex: number) => (
                  <div key={colIndex} className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
                      <h4 className="font-bold text-neutral-800">{col.title || "Column"}</h4>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {(col.items || []).map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="p-5 transition-colors hover:bg-neutral-50/50">
                          <div className="mb-3 flex items-center justify-between">
                            <strong className="text-xs font-bold uppercase tracking-wider text-neutral-500">Item #{itemIndex + 1}</strong>
                            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-neutral-600">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                                checked={!item.hidden}
                                onChange={(e) => updateItem(sectionKey, colIndex, itemIndex, "hidden", !e.target.checked)}
                              />
                              Visible
                            </label>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={item.name || ""}
                              onChange={(e) => updateItem(sectionKey, colIndex, itemIndex, "name", e.target.value)}
                              placeholder="Link Label"
                            />
                            <input
                              className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={item.path || ""}
                              onChange={(e) => updateItem(sectionKey, colIndex, itemIndex, "path", e.target.value)}
                              placeholder="Destination Path"
                            />
                            <div className="relative sm:col-span-2">
                              <select
                                className="h-9 w-full appearance-none rounded-md border border-neutral-300 bg-neutral-50 px-3 pr-8 text-sm font-medium text-neutral-700 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                value={item.iconIndex ?? 0}
                                onChange={(e) => updateItem(sectionKey, colIndex, itemIndex, "iconIndex", Number(e.target.value))}
                              >
                                <option value={0} disabled>Select an Icon Index</option>
                                {Array.from({ length: (remoteImages || []).length }, (_, i) => (
                                  <option key={i} value={i}>Icon #{i}</option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
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
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Customer Reviews</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage and curate reviews displayed on the homepage.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-all hover:bg-neutral-50"
            onClick={addReview}
          >
            <span>➕</span> Add Review
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-primary-dark"
            onClick={save}
          >
            <span>💾</span> Save Changes
          </button>
        </div>
      </div>
      {saveSuccess && (
        <div className="mb-6 flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-sm">
          {saveError}
        </div>
      )}

      <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xl shadow-sm">⭐</span>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Homepage Reviews</h3>
            <p className="text-xs text-neutral-500">{reviews.length} reviews currently configured to display.</p>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex h-44 items-center justify-center text-sm font-medium text-neutral-500">
              <div className="mr-2 spinner" />
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-3xl font-bold text-neutral-400">
                💬
              </span>
              <p className="text-sm font-semibold text-neutral-900">No reviews added yet</p>
              <p className="mt-1 text-sm text-neutral-500">Click "Add Review" to start showcasing customer feedback.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {reviews.map((r: any, i: number) => (
                <div key={i} className="relative rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50">
                  <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
                    <strong className="text-sm font-bold text-neutral-700">Review #{i + 1}</strong>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-100/50"
                      onClick={() => removeReview(i)}
                      aria-label="Delete review"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Rating</label>
                      <div className="relative">
                        <select
                          className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-8 text-sm font-medium text-neutral-700 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          value={r.rating || 5}
                          onChange={(e) => update(i, "rating", Number(e.target.value))}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} {"⭐".repeat(n)}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Customer Name</label>
                      <input
                        className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={r.author || ""}
                        onChange={(e) => update(i, "author", e.target.value)}
                        placeholder="e.g. Jane Doe"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Review Text</label>
                      <textarea
                        className="min-h-[80px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={r.text || ""}
                        onChange={(e) => update(i, "text", e.target.value)}
                        placeholder="What did the customer say?"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 w-16">Status</label>
                      <div className="relative flex-1">
                        <select
                          className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-8 text-sm font-medium text-neutral-700 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          value={r.verified ? "yes" : "no"}
                          onChange={(e) => update(i, "verified", e.target.value === "yes")}
                        >
                          <option value="yes">✓ Verified Buyer</option>
                          <option value="no">Unverified</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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

  const setTopInfoBar = (updates) => {
    setPromotionsState(p => ({
      ...p,
      topInfoBar: { ...(p?.topInfoBar || {}), ...updates }
    }));
  };

  const addTopInfoItem = () => {
    setTopInfoBar({ items: [...(promotions?.topInfoBar?.items || []), ""] });
  };

  const updateTopInfoItem = (index: number, value: string) => {
    const items = [...(promotions?.topInfoBar?.items || [])];
    items[index] = value;
    setTopInfoBar({ items });
  };

  const removeTopInfoItem = (index: number) => {
    setTopInfoBar({ items: (promotions?.topInfoBar?.items || []).filter((_: any, i: number) => i !== index) });
  };

  const setOffers = (patch: any) => {
    setPromotionsState((prev: any) => ({
      ...prev,
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
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Promotions & Offers</h1>
          <p className="mt-1 text-sm text-neutral-500">Configure global top-bar messages, categories, and discounts.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-primary-dark"
          onClick={save}
        >
          <span>💾</span> Save Promotions
        </button>
      </div>
      {saveSuccess && (
        <div className="mb-6 flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-sm">
          {saveError}
        </div>
      )}

      {/* TOP INFO BAR */}
      <div className="mb-8 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xl shadow-sm">📢</span>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Top Info Bar</h3>
              <p className="text-xs text-neutral-500">The scrolling banner at the very top of the site.</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="inline-flex cursor-pointer items-center gap-3">
              <span className="text-sm font-semibold text-neutral-600">Bar Visibility</span>
              <div className="relative flex h-6 w-11 items-center rounded-full bg-neutral-200 transition-colors has-[:checked]:bg-emerald-500">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={Boolean(promotions?.topInfoBar?.enabled)}
                  onChange={(e) => setTopInfoBar({ enabled: e.target.checked })}
                />
                <span className="absolute left-1 h-4 w-4 transform rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>
        </div>
        
        <div className="p-6">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <strong className="text-sm font-bold text-neutral-800">Scrolling Messages</strong>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-all hover:bg-neutral-50"
                onClick={addTopInfoItem}
              >
                <span>➕</span> Add Message
              </button>
            </div>
            
            <div className="grid gap-3">
              {(promotions?.topInfoBar?.items || []).length === 0 && (
                <div className="py-4 text-center text-sm font-medium text-neutral-500">
                  No messages defined. Add one to show in the info bar.
                </div>
              )}
              {(promotions?.topInfoBar?.items || []).map((t: string, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-neutral-400">#{i + 1}</span>
                    <input
                      className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pl-9 text-sm text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={t || ""}
                      onChange={(e) => updateTopInfoItem(i, e.target.value)}
                      placeholder="e.g. FREE SHIPPING ON ALL ORDERS"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100"
                    onClick={() => removeTopInfoItem(i)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="mb-8 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xl shadow-sm">🗂️</span>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Offer Categories</h3>
              <p className="text-xs text-neutral-500">Group your offers logically.</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-all hover:bg-neutral-50"
            onClick={addCategory}
          >
            <span>➕</span> Add Category
          </button>
        </div>

        <div className="p-6">
          {(categories || []).length === 0 ? (
            <div className="rounded-lg border border-neutral-200 border-dashed py-8 text-center bg-neutral-50/50">
              <p className="text-sm font-semibold text-neutral-500">No categories created yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c: any) => (
                <div key={c.id} className="relative flex items-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <input
                    className="h-11 flex-1 border-none bg-transparent px-4 py-2 text-sm font-semibold text-neutral-900 outline-none"
                    value={c.name || ""}
                    onChange={(e) => updateCategory(c.id, e.target.value)}
                    placeholder="Category Name"
                  />
                  <div className="px-2">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50"
                      onClick={() => removeCategory(c.id)}
                      aria-label={`Delete category ${c.name || ""}`.trim()}
                      title="Delete Category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OFFERS */}
      <div className="mb-8 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xl shadow-sm">💰</span>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Active Offers</h3>
              <p className="text-xs text-neutral-500">Manage discounts and promotional rules.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-neutral-100 px-3 py-1.5 border border-neutral-200">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                checked={Boolean(promotions?.offers?.stackWithMemberDiscount)}
                onChange={(e) => setOffers({ stackWithMemberDiscount: e.target.checked })}
              />
              <span className="text-xs font-bold text-neutral-700">Stack Discounts</span>
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black transition-all"
              onClick={addOffer}
            >
              <span>➕</span> Create Offer
            </button>
          </div>
        </div>

        <div className="p-6 bg-neutral-50/30">
          {(offers || []).length === 0 ? (
            <div className="rounded-lg border border-neutral-200 border-dashed py-12 text-center bg-white">
              <span className="text-4xl mb-3 block opacity-50">🏷️</span>
              <p className="text-sm font-semibold text-neutral-700">No active offers</p>
              <p className="mt-1 text-xs text-neutral-500">Create your first offer to provide discounts to customers.</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {offers.map((o: any) => (
                <div key={o.id} className={`relative rounded-xl border p-5 shadow-sm transition-all ${o.enabled ? 'border-primary/30 bg-white ring-1 ring-primary/5' : 'border-neutral-200 bg-neutral-50/50 opacity-80 hover:opacity-100'}`}>
                  
                  {/* Offer Header */}
                  <div className="mb-5 flex items-start justify-between border-b border-neutral-100 pb-4">
                    <div className="flex-1">
                      <input
                        className="w-full bg-transparent text-lg font-extrabold text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-b focus:border-primary/50"
                        value={o.name || ""}
                        onChange={(e) => updateOffer(o.id, { name: e.target.value })}
                        placeholder="Offer Title (e.g. Summer Sale)"
                      />
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <div className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${o.enabled ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={Boolean(o.enabled)}
                            onChange={(e) => updateOffer(o.id, { enabled: e.target.checked })}
                          />
                          <span className={`absolute left-0.5 h-4 w-4 transform rounded-full bg-white transition-transform ${o.enabled ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${o.enabled ? 'text-emerald-700' : 'text-neutral-500'}`}>
                          {o.enabled ? 'Active' : 'Draft'}
                        </span>
                      </label>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 border border-transparent hover:border-rose-200 hover:bg-rose-50"
                        onClick={() => removeOffer(o.id)}
                        aria-label={`Delete offer ${o.name || ""}`.trim()}
                        title="Delete Offer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Category</label>
                      <div className="relative">
                        <select
                          className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          value={o.categoryId || ""}
                          onChange={(e) => updateOffer(o.id, { categoryId: e.target.value })}
                        >
                          <option value="" disabled>Select Category</option>
                          {(categories || []).map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Target Area</label>
                      <div className="relative">
                        <select
                          className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          value={o.appliesTo || "all"}
                          onChange={(e) => updateOffer(o.id, { appliesTo: e.target.value })}
                        >
                          <option value="all">All Products</option>
                          <option value="car">Car Remotes Only</option>
                          <option value="garage">Garage Remotes Only</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
                      </div>
                    </div>

                    <div className="grid gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Discount Amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 pr-10 text-sm font-semibold text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          step="1" min="0" max="100"
                          value={Number(o.discountPercent ?? 0)}
                          onChange={(e) => updateOffer(o.id, { discountPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-bold text-neutral-400">%</div>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Starts (Optional)</label>
                      <input
                        type="date"
                        className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-neutral-700 uppercase tracking-wide"
                        value={o.startDate || ""}
                        onChange={(e) => updateOffer(o.id, { startDate: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Ends (Optional)</label>
                      <input
                        type="date"
                        className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-neutral-700 uppercase tracking-wide"
                        value={o.endDate || ""}
                        onChange={(e) => updateOffer(o.id, { endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// New Admin Components

function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Analytics</h1>
          <p className="mt-1 text-sm text-neutral-500">View store performance and visitor metrics.</p>
        </div>
        <div className="relative">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)} 
            className="h-10 w-full min-w-[160px] appearance-none rounded-lg border border-neutral-300 bg-white px-4 pr-10 text-sm font-semibold text-neutral-700 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white px-6 py-16 shadow-sm ring-1 ring-black/5 text-center">
        <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100/50 text-4xl shadow-inner">
          📊
        </span>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Analytics Not Configured</h3>
        <p className="max-w-md text-sm text-neutral-600 mb-6">
          Real analytics for {timeRange} requires an analytics provider and event tracking configuration. This section currently has no active data streams.
        </p>
        <div className="rounded-lg bg-orange-50 px-5 py-4 text-left border border-orange-100 max-w-lg w-full">
          <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2 mb-2">
            <span>💡</span> Recommended Setup
          </h4>
          <p className="text-sm text-orange-700">
            To view real data, integrate a tracking provider (Google Analytics 4, Plausible, or PostHog) and capture key e-commerce events like <code>checkout_completed</code> and <code>view_item</code>.
          </p>
        </div>
      </div>
    </div>
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

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
        <p className="admin-muted-copy">
          Users are stored in this browser's <code>localStorage</code> (demo auth). To make users global + secure,
          replace client-side auth with a backend auth/session system.
        </p>
      </div>

      {showAddUser && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900">Add New User</h3>
            <button 
              onClick={() => setShowAddUser(false)}
              className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Name</label>
              <input
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:outline-none transition-all"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Email</label>
              <input
                type="email"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:outline-none transition-all"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Password</label>
              <input
                type="password"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:outline-none transition-all"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Set a password"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Role</label>
              <div className="relative">
                <select
                  className="h-10 w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3 pr-8 text-sm focus:border-primary focus:ring-1 focus:outline-none transition-all"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 border-t border-neutral-100 pt-6">
            <button 
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              onClick={() => setShowAddUser(false)}
            >
              Cancel
            </button>
            <button 
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={addUser} 
              disabled={!newUser.name || !newUser.email || !newUser.password}
            >
              Add User
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50/80 text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900">{user.name}</td>
                  <td className="px-6 py-4 text-neutral-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-500">{user.joined}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => toggleUserStatus(user.id)}
                        disabled={user.id === 'admin'}
                      >
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold tracking-tight text-neutral-900 mb-4 uppercase text-neutral-500">User Statistics</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <span className="text-sm text-neutral-600">Total Users</span>
              <span className="font-semibold text-neutral-900">{users.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <span className="text-sm text-neutral-600">Active Users</span>
              <span className="font-semibold text-green-700">{users.filter(u => u.status === 'active').length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <span className="text-sm text-neutral-600">Admin Users</span>
              <span className="font-semibold text-purple-700">{users.filter(u => u.role === 'admin').length}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold tracking-tight text-neutral-900 mb-4 uppercase text-neutral-500">Recent Signups</h3>
          <div className="grid gap-3">
            {users.slice(-3).reverse().map(user => (
              <div key={user.id} className="flex flex-col py-2 border-b border-neutral-100 last:border-0">
                <span className="font-semibold text-neutral-900 text-sm">{user.name}</span>
                <span className="text-xs text-neutral-500">{user.email}</span>
                <span className="text-xs text-neutral-400 mt-1">Joined {user.joined}</span>
              </div>
            ))}
            {users.length === 0 && <div className="text-sm text-neutral-500 py-2">No users found.</div>}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold tracking-tight text-neutral-900 mb-4 uppercase text-neutral-500">User Roles</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <span className="text-sm text-neutral-600">Customers</span>
              <span className="font-semibold text-neutral-900">{users.filter(u => u.role === 'customer').length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <span className="text-sm text-neutral-600">Admins</span>
              <span className="font-semibold text-neutral-900">{users.filter(u => u.role === 'admin').length}</span>
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
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Site Settings</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage global store configuration and preferences.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={saveSettings}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Settings
          </button>
          <button 
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-all hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={resetAllData} 
            disabled={resetting}
          >
            {resetting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset Test Data
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-8 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-sm animate-in fade-in slide-in-from-top-2">
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-8 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-sm animate-in fade-in slide-in-from-top-2">
          {saveError}
        </div>
      )}
      {resetError && (
        <div className="mb-8 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-sm animate-in fade-in slide-in-from-top-2">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {resetError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-neutral-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900">General Settings</h3>
          </div>
          
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Site Name</label>
              <input
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={settings.siteName || ""}
                onChange={(e) => updateSetting('siteName', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Site Email</label>
              <input
                type="email"
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={settings.siteEmail || ""}
                onChange={(e) => updateSetting('siteEmail', e.target.value)}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Items Per Page</label>
                <input
                  type="number"
                  className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={settings.itemsPerPage || 10}
                  onChange={(e) => updateSetting('itemsPerPage', parseInt(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Currency</label>
                <div className="relative">
                  <select
                    className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={settings.currency || "USD"}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-neutral-700 block mb-1">Timezone</label>
              <div className="relative">
                <select
                  className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-8 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={settings.timezone || "UTC"}
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
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">▾</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-neutral-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Feature Toggles</h3>
          </div>
          
          <div className="grid gap-4">
            <label className="group flex cursor-pointer items-start gap-4 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <div className="pt-1">
                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={settings.maintenanceMode || false}
                    onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                  />
                  <span className={`pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out ${settings.maintenanceMode ? 'bg-primary' : 'bg-neutral-200'}`} />
                  <span className={`pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-neutral-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-semibold text-neutral-900">Maintenance Mode</span>
                <span className="text-neutral-500">Disable the site for maintenance. Only users with admin roles will be able to log in.</span>
              </div>
            </label>
            
            <label className="group flex cursor-pointer items-start gap-4 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <div className="pt-1">
                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={settings.enableRegistration !== false}
                    onChange={(e) => updateSetting('enableRegistration', e.target.checked)}
                  />
                  <span className={`pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out ${settings.enableRegistration !== false ? 'bg-primary' : 'bg-neutral-200'}`} />
                  <span className={`pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-neutral-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${settings.enableRegistration !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-semibold text-neutral-900">Enable User Registration</span>
                <span className="text-neutral-500">Allow new users to register. If disabled, only existing users can sign in.</span>
              </div>
            </label>
            
            <label className="group flex cursor-pointer items-start gap-4 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <div className="pt-1">
                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={settings.enableReviews !== false}
                    onChange={(e) => updateSetting('enableReviews', e.target.checked)}
                  />
                  <span className={`pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out ${settings.enableReviews !== false ? 'bg-primary' : 'bg-neutral-200'}`} />
                  <span className={`pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-neutral-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${settings.enableReviews !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-semibold text-neutral-900">Enable Reviews</span>
                <span className="text-neutral-500">Allow customers to submit new product reviews.</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm mb-6 overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-neutral-900">System Information</h3>
        </div>
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-neutral-100 mt-px">
          <div className="bg-white p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Version</span>
            <span className="text-sm font-medium text-neutral-900">1.0.0</span>
          </div>
          <div className="bg-white p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Environment</span>
            <span className="text-sm font-medium text-neutral-900">{process.env.NODE_ENV || 'unknown'}</span>
          </div>
          <div className="bg-white p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Database</span>
            <span className="text-sm font-medium text-neutral-900 text-neutral-500">MongoDB / Local JSON fallback</span>
          </div>
          <div className="bg-white p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Persistence</span>
            <span className="text-sm font-medium font-mono text-neutral-700 bg-neutral-50 py-0.5 px-2 rounded w-fit mt-1">/api/content/*</span>
          </div>
          <div className="bg-white p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Reset</span>
            <span className="text-sm font-medium text-neutral-900">Disabled in prod unless ALLOW_ADMIN_RESET=1</span>
          </div>
          <div className="bg-white p-5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Note</span>
            <span className="text-sm font-medium text-orange-600">Analytics/users need integration</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;

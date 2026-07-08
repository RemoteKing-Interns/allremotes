"use client";

import React, { Suspense, useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { activityLogger } from "../../lib/activity-logger";
import AdminSupportChat from "../../components/admin/AdminSupportChat";
import ProductSpreadsheet from "../../components/admin/ProductSpreadsheet";
import AdminUsersManager from "../../components/admin/AdminUsers";
import AdminLogs from "../../components/admin/AdminLogs";
import CustomerManagement from "../../components/admin/CustomerManagement";
import AdminAbandonedCarts from "../../components/admin/AdminAbandonedCarts";
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
  Truck,
  Import,
  Link2,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Store,
  Tag,
  Percent,
  FileText,
  Image,
  Globe,
  CreditCard,
  Bell,
  Search,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Edit,
  Copy,
  ExternalLink,
  RefreshCw,
  Layers,
  Grid,
  Tags,
  Building2,
  List,
  Star,
  Heart,
  Share2,
  Bookmark,
  Archive,
  Send,
  Inbox,
  FolderOpen,
  HelpCircle,
  LogOut,
  User,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

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

const AdminContent = () => {
  // All hooks must be declared before any conditional returns
  const { user, login, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === 'admin';

  // Superuser = has wildcard permission (*)
  const isSuperUser = (user?.permissions || []).includes('*');

  // Returns true if the user has the specific permission key (or full access)
  const hasPermission = (key: string) => {
    if (key === 'superuser') return isSuperUser;
    const perms: string[] = user?.permissions || [];
    return perms.includes('*') || perms.includes(key);
  };

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') || localStorage.getItem('adminActiveTab') || 'dashboard';
    }
    return 'dashboard';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Global command palette (⌘K / Ctrl+K)
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [cmdkQuery, setCmdkQuery] = useState("");
  const [cmdkResults, setCmdkResults] = useState<{ type: string; label: string; sub?: string; action: () => void }[]>([]);
  const [cmdkIndex, setCmdkIndex] = useState(0);
  const cmdkInputRef = useRef<HTMLInputElement>(null);

  // Sync logged-in user into activity logger
  useEffect(() => {
    if (user?.email) activityLogger.setUser(user.email, user.id);
  }, [user]);

  // Redirect to first permitted tab if current tab is inaccessible
  useEffect(() => {
    if (!isAdmin) return;
    const allNavItems = [
      { id: 'dashboard', perm: 'dashboard' }, { id: 'orders', perm: 'orders' },
      { id: 'products', perm: 'products' }, { id: 'customers', perm: 'customers' },
      { id: 'analytics', perm: 'analytics' }, { id: 'marketing', perm: 'marketing' },
      { id: 'content', perm: 'content' }, { id: 'settings', perm: 'settings' },
    ];
    const currentTabPerm = [
      { id: 'dashboard', perm: 'dashboard' }, { id: 'orders', perm: 'orders' },
      { id: 'returns', perm: 'orders' }, { id: 'abandoned_carts', perm: 'orders' },
      { id: 'products', perm: 'products' }, { id: 'categories', perm: 'products' },
      { id: 'inventory', perm: 'products' }, { id: 'customers', perm: 'customers' },
      { id: 'reviews', perm: 'customers' }, { id: 'messages', perm: 'customers' },
      { id: 'promotions', perm: 'marketing' }, { id: 'discounts', perm: 'marketing' },
      { id: 'home', perm: 'content' }, { id: 'navigation', perm: 'content' },
      { id: 'analytics', perm: 'analytics' }, { id: 'live_view', perm: 'analytics' },
      { id: 'admin_users', perm: 'superuser' }, { id: 'admin_logs', perm: 'admin_users' },
      { id: 'settings', perm: 'settings' }, { id: 'profile', perm: '' },
    ].find(t => t.id === activeTab);
    if (!currentTabPerm) return;
    if (currentTabPerm.perm === '') return; // profile always allowed
    if (!hasPermission(currentTabPerm.perm)) {
      const first = allNavItems.find(t => hasPermission(t.perm));
      if (first) setActiveTab(first.id);
    }
  }, [isAdmin, user]);

  // Log tab navigation only for meaningful sections (not every click)
  useEffect(() => {
    if (!isAdmin) return;
    const skip = ['dashboard'];
    if (!skip.includes(activeTab)) {
      activityLogger.pageView(activeTab, { tab: activeTab });
    }
  }, [activeTab, isAdmin]);

  // Flush pending logs when admin closes/navigates away
  useEffect(() => {
    const onUnload = () => activityLogger.flushSync();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('order') : null
  );
  const [viewReturnId, setViewReturnId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('return') : null
  );
  const [openThreadId, setOpenThreadId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('thread') : null
  );

  // Fetch unread message count periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const resp = await fetch('/api/admin/support-chats', { cache: 'no-store' });
        const data = await resp.json().catch(() => []);
        if (Array.isArray(data)) {
          const totalUnread = data.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
          setUnreadMessageCount(totalUnread);
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync URL params when tab/id state changes
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.set('tab', activeTab);
    if (viewOrderId) p.set('order', viewOrderId); else p.delete('order');
    if (viewReturnId) p.set('return', viewReturnId); else p.delete('return');
    if (openThreadId) p.set('thread', openThreadId); else p.delete('thread');
    const newUrl = `${window.location.pathname}?${p.toString()}`;
    window.history.replaceState(null, '', newUrl);
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab, viewOrderId, viewReturnId, openThreadId]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const [ordersRes, returnsRes, chatRes] = await Promise.all([
        fetch('/api/orders?limit=50', { cache: 'no-store' }),
        fetch('/api/returns', { cache: 'no-store' }),
        fetch('/api/support-chat', { cache: 'no-store' }).catch(() => null),
      ]);
      const ordersData = ordersRes.ok ? await ordersRes.json().catch(() => []) : [];
      const returnsData = returnsRes.ok ? await returnsRes.json().catch(() => []) : [];
      const chatData = chatRes?.ok ? await chatRes.json().catch(() => []) : [];

      const notifs: any[] = [];

      // New orders in last 24h
      const orders = Array.isArray(ordersData) ? ordersData : [];
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      orders.forEach((o: any) => {
        if (new Date(o.createdAt) > cutoff) {
          notifs.push({
            id: `order-${o.id}`,
            type: 'order',
            title: 'New Order',
            body: `Order ${o.id?.slice(0, 8)} \u2014 AU$${Number(o?.pricing?.total || 0).toFixed(2)}`,
            time: o.createdAt,
            tab: 'orders',
          });
        }
      });

      // Pending return requests
      const returns = Array.isArray(returnsData) ? returnsData : [];
      returns.forEach((r: any) => {
        if (r.status === 'pending') {
          notifs.push({
            id: `return-${r.id}`,
            type: 'return',
            title: 'Pending Return',
            body: `${r.customerEmail} \u2014 ${r.id?.slice(0, 12)}`,
            time: r.createdAt,
            tab: 'returns',
          });
        }
        if (r.status === 'approved' && r.trackingNumber) {
          notifs.push({
            id: `return-tracking-${r.id}`,
            type: 'return',
            title: 'Tracking Submitted',
            body: `${r.customerEmail} sent tracking: ${r.trackingNumber}`,
            time: r.updatedAt,
            tab: 'returns',
          });
        }
      });

      // Open support threads with unread customer messages
      const threads = Array.isArray(chatData) ? chatData : [];
      threads.forEach((t: any) => {
        if (t.status === 'open') {
          notifs.push({
            id: `chat-${t.id}`,
            type: 'chat',
            title: 'Customer Message',
            body: `${t.customerName || t.customerEmail} \u2014 ${t.orderId ? `Order ${t.orderId.slice(0, 8)}` : `Return ${t.returnId?.slice(0, 8)}`}`,
            time: t.lastMessageAt,
            tab: 'messages',
            threadId: t.id,
          });
        }
      });

      notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── ⌘K / Ctrl+K global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdkOpen((v) => !v);
        setCmdkQuery("");
        setCmdkIndex(0);
      }
      if (e.key === 'Escape') setCmdkOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (cmdkOpen) setTimeout(() => cmdkInputRef.current?.focus(), 50);
  }, [cmdkOpen]);

  // Build results whenever query changes
  useEffect(() => {
    if (!cmdkOpen) return;
    const q = cmdkQuery.toLowerCase().trim();

    const results: { type: string; label: string; sub?: string; action: () => void }[] = [];

    // Nav items
    const navDefs = [
      { id: 'dashboard', label: 'Home' },
      { id: 'orders', label: 'Orders' },
      { id: 'returns', label: 'Returns' },
      { id: 'abandoned_carts', label: 'Abandoned Carts' },
      { id: 'products', label: 'Products' },
      { id: 'categories', label: 'Categories & Brands' },
      { id: 'inventory', label: 'Inventory' },
      { id: 'customers', label: 'Customers' },
      { id: 'reviews', label: 'Reviews' },
      { id: 'messages', label: 'Messages/Queries' },
      { id: 'promotions', label: 'Promotions' },
      { id: 'discounts', label: 'Discounts' },
      { id: 'home', label: 'Homepage' },
      { id: 'navigation', label: 'Navigation' },
      { id: 'analytics', label: 'Reports' },
      { id: 'live_view', label: 'Live View' },
      { id: 'admin_users', label: 'Admin Users' },
      { id: 'admin_logs', label: 'Logs' },
      { id: 'settings', label: 'Settings' },
    ];

    navDefs.forEach(({ id, label }) => {
      if (q === "" || label.toLowerCase().includes(q) || id.includes(q)) {
        results.push({ type: 'nav', label, sub: 'Go to page', action: () => { setActiveTab(id); setCmdkOpen(false); } });
      }
    });

    // Fetch-based search (orders + products) — only when there's a query
    if (q.length >= 2) {
      fetch(`/api/orders?limit=200`, { cache: 'no-store' })
        .then(r => r.json()).then((data: any[]) => {
          if (!Array.isArray(data)) return;
          const matches = data.filter((o: any) => {
            const txt = [o.id, o.customer?.email, o.customer?.fullName, o.status].filter(Boolean).join(' ').toLowerCase();
            return txt.includes(q);
          }).slice(0, 5);
          if (matches.length === 0) return;
          setCmdkResults(prev => [
            ...prev.filter(r => r.type !== 'order'),
            ...matches.map((o: any) => ({
              type: 'order',
              label: `Order #${o.id}`,
              sub: `${o.customer?.email || 'Guest'} · ${o.status}`,
              action: () => { setActiveTab('orders'); setViewOrderId(o.id); setCmdkOpen(false); },
            })),
          ]);
        }).catch(() => null);

      fetch(`/api/products`, { cache: 'no-store' })
        .then(r => r.json()).then((data: any[]) => {
          if (!Array.isArray(data)) return;
          const matches = data.filter((p: any) => {
            const txt = [p.name, p.sku, p.rk_sku, p.brand, p.category].filter(Boolean).join(' ').toLowerCase();
            return txt.includes(q);
          }).slice(0, 5);
          if (matches.length === 0) return;
          setCmdkResults(prev => [
            ...prev.filter(r => r.type !== 'product'),
            ...matches.map((p: any) => ({
              type: 'product',
              label: p.name,
              sub: `${p.sku || p.rk_sku || ''} · ${p.category || ''}`,
              action: () => { setActiveTab('products'); setCmdkOpen(false); },
            })),
          ]);
        }).catch(() => null);
    }

    setCmdkResults(results);
    setCmdkIndex(0);
  }, [cmdkQuery, cmdkOpen]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const result = await login(loginEmail, loginPassword);
    if (result.success) return;
    setLoginError(result.error || 'Invalid credentials');
  };

  // Removed auth check redirect to prevent refresh issues
  // The access denied UI will handle non-admin users


  // Listen for tab switch events from child components
  useEffect(() => {
    const handleSwitchTab = (e: CustomEvent) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
        if (e.detail?.viewOrderId) {
          setViewOrderId(e.detail.viewOrderId);
        }
        if (e.detail?.viewReturnId) {
          setViewReturnId(e.detail.viewReturnId);
        }
      }
    };
    window.addEventListener('switchAdminTab', handleSwitchTab as EventListener);
    return () => window.removeEventListener('switchAdminTab', handleSwitchTab as EventListener);
  }, []);

  if (!user) {
    return (
      <div className="admin-a11y animate-fadeIn">
        <div className="container py-10 sm:py-14">
          <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white/90 p-6 shadow-panel backdrop-blur sm:p-8">
              <img src="/images/mainlogo.png" alt="ALLREMOTES" className="h-10 w-auto" />
              <div className="mt-6">
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
                    placeholder="Enter your email"
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

  const allNavItems = [
    { id: 'dashboard',      label: 'Home',               icon: Home,               perm: 'dashboard' },
    { id: 'orders',         label: 'Orders',              icon: ShoppingCart,       perm: 'orders' },
    { id: 'returns',        label: 'Returns',             icon: RotateCcw,          perm: 'orders' },
    { id: 'abandoned_carts',label: 'Abandoned Carts',     icon: Package,            perm: 'orders' },
    { id: 'products',       label: 'Products',            icon: Package,            perm: 'products' },
    { id: 'categories',     label: 'Categories & Brands', icon: Tags,               perm: 'products' },
    { id: 'inventory',      label: 'Inventory',           icon: Layers,             perm: 'products' },
    { id: 'customers',      label: 'Customers',           icon: Users,              perm: 'customers' },
    { id: 'reviews',        label: 'Reviews',             icon: Star,               perm: 'customers' },
    { id: 'messages',       label: 'Messages/Queries',    icon: MessageSquareText,  perm: 'customers' },
    { id: 'promotions',     label: 'Promotions',          icon: Megaphone,          perm: 'marketing' },
    { id: 'discounts',      label: 'Discounts',           icon: Percent,            perm: 'marketing' },
    { id: 'home',           label: 'Homepage',            icon: FileText,           perm: 'content' },
    { id: 'navigation',     label: 'Navigation',          icon: Compass,            perm: 'content' },
    { id: 'analytics',      label: 'Reports',             icon: BarChart3,          perm: 'analytics' },
    { id: 'live_view',      label: 'Live View',           icon: Eye,                perm: 'analytics' },
    { id: 'admin_users',    label: 'Admin Users',         icon: Users,              perm: 'superuser' },
    { id: 'admin_logs',     label: 'Logs',                icon: FileText,           perm: 'admin_users' },
    { id: 'settings',       label: 'Settings',            icon: Settings,           perm: 'settings' },
  ];
  const navItems = [
    ...allNavItems.filter(item => hasPermission(item.perm)),
    { id: 'profile', label: 'My Profile', icon: User, perm: '*' },
  ];

  return (
    <div className="flex h-screen bg-[#f6f6f7]">
      {/* Shopify-style Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-[#1a1a1a] text-white transition-all duration-300 flex flex-col`}>
        {/* Logo Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Store size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">All Remotes</p>
                <p className="text-xs text-neutral-400">Admin</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3">
            <button
              onClick={() => { setCmdkOpen(true); setCmdkQuery(""); setCmdkIndex(0); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-neutral-400 text-sm hover:bg-white/10 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <Search size={16} />
              <span>Search</span>
              <span className="ml-auto text-xs bg-white/10 px-1.5 py-0.5 rounded">⌘K</span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === 'messages' && unreadMessageCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon size={18} className={isActive ? 'text-emerald-400' : ''} />
                    {showBadge && !sidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                        {unreadMessageCount}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-white/10 p-3">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-lg p-1 hover:bg-white/10 transition-colors`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
              </div>
            )}
          </button>
          {!sidebarCollapsed && (
            <div className="mt-3 flex gap-2">
              <Link 
                href="/" 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-medium transition-colors"
              >
                <ExternalLink size={14} />
                View Store
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-neutral-900 capitalize">
              {activeTab === 'dashboard' ? 'Home' : activeTab.replace('_', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); if (!notifOpen) fetchNotifications(); }}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-neutral-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                    <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
                    <span className="text-xs text-neutral-500">{notifications.length} items</span>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="text-sm text-neutral-500">Loading…</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Bell size={28} className="mb-2 text-neutral-300" />
                        <p className="text-sm font-medium text-neutral-600">All clear!</p>
                        <p className="text-xs text-neutral-400 mt-1">No pending notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.threadId) setOpenThreadId(n.threadId);
                            setActiveTab(n.tab);
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 text-left transition-colors"
                        >
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            n.type === 'order' ? 'bg-blue-100 text-blue-600' :
                            n.type === 'return' ? 'bg-amber-100 text-amber-600' :
                            n.type === 'chat' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-neutral-100 text-neutral-500'
                          }`}>
                            {n.type === 'order' ? '🛒' : n.type === 'return' ? '↩' : n.type === 'chat' ? '💬' : '🔔'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-900">{n.title}</p>
                            <p className="text-xs text-neutral-600 truncate mt-0.5">{n.body}</p>
                            <p className="text-xs text-neutral-400 mt-1">
                              {new Date(n.time).toLocaleString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="border-t border-neutral-200 px-4 py-2">
                    <button
                      onClick={() => { fetchNotifications(); }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {notifLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors">
              <HelpCircle size={20} />
            </button>
            <button
              onClick={() => { logout(); router.push("/admin"); }}
              className="p-2 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard'      && hasPermission('dashboard')  && <ShopifyDashboard onNavigateTab={setActiveTab} />}
          {activeTab === 'analytics'      && hasPermission('analytics')  && <AdminAnalytics />}
          {activeTab === 'live_view'      && hasPermission('analytics')  && <LiveViewSection />}
          {activeTab === 'customers'      && hasPermission('customers')  && <CustomerManagement />}
          {activeTab === 'admin_users'    && isSuperUser                 && <AdminUsersManager />}
          {activeTab === 'admin_logs'     && hasPermission('admin_users') && <AdminLogs />}
          {activeTab === 'products'       && hasPermission('products')   && <AdminProducts />}
          {activeTab === 'categories'     && hasPermission('products')   && <CategoriesBrandsSection />}
          {activeTab === 'inventory'      && hasPermission('products')   && <InventorySection />}
          {activeTab === 'orders'         && hasPermission('orders')     && <AdminOrders viewOrderId={viewOrderId} setViewOrderId={setViewOrderId} />}
          {activeTab === 'returns'        && hasPermission('orders')     && <AdminReturns viewReturnId={viewReturnId} setViewReturnId={setViewReturnId} />}
          {activeTab === 'abandoned_carts'&& hasPermission('orders')     && <AdminAbandonedCarts />}
          {activeTab === 'home'           && hasPermission('content')    && <AdminHome />}
          {activeTab === 'promotions'     && hasPermission('marketing')  && <AdminPromotions />}
          {activeTab === 'discounts'      && hasPermission('marketing')  && <DiscountsSection />}
          {activeTab === 'navigation'     && hasPermission('content')    && <AdminNavigation />}
          {activeTab === 'reviews'        && hasPermission('customers')  && <AdminReviews />}
          {activeTab === 'messages'       && hasPermission('customers')  && <AdminMessages openThreadId={openThreadId ?? undefined} onThreadOpened={() => setOpenThreadId(null)} />}
          {activeTab === 'settings'       && hasPermission('settings')   && <AdminSettings />}
          {activeTab === 'profile'        && <AdminProfile />}

          {/* Fallback: tab exists but user lacks permission */}
          {activeTab !== 'profile' && !navItems.some(n => n.id === activeTab) && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-neutral-800">Access Denied</h2>
              <p className="text-sm text-neutral-500 mt-2">You don&apos;t have permission to view this section.</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Global Command Palette ─────────────────────────────────── */}
      {cmdkOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
          onClick={() => setCmdkOpen(false)}
        >
          <div
            className="w-full max-w-xl mx-4 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setCmdkIndex(i => Math.min(i + 1, cmdkResults.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setCmdkIndex(i => Math.max(i - 1, 0)); }
              if (e.key === 'Enter' && cmdkResults[cmdkIndex]) { cmdkResults[cmdkIndex].action(); }
              if (e.key === 'Escape') setCmdkOpen(false);
            }}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
              <Search size={18} className="text-neutral-400 shrink-0" />
              <input
                ref={cmdkInputRef}
                type="text"
                placeholder="Search orders, products, pages…"
                value={cmdkQuery}
                onChange={(e) => setCmdkQuery(e.target.value)}
                className="flex-1 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
              />
              {cmdkQuery && (
                <button onClick={() => setCmdkQuery("")} className="text-neutral-400 hover:text-neutral-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
              <kbd className="text-[11px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {cmdkResults.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-neutral-400">No results found</p>
              ) : (
                (() => {
                  const typeOrder = ['nav', 'order', 'product'];
                  const typeLabel: Record<string, string> = { nav: 'Pages', order: 'Orders', product: 'Products' };
                  let lastType = '';
                  return cmdkResults.map((r, i) => {
                    const showHeading = r.type !== lastType;
                    lastType = r.type;
                    return (
                      <div key={i}>
                        {showHeading && (
                          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                            {typeLabel[r.type] || r.type}
                          </p>
                        )}
                        <button
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === cmdkIndex ? 'bg-violet-50 text-violet-900' : 'hover:bg-neutral-50 text-neutral-800'}`}
                          onClick={r.action}
                          onMouseEnter={() => setCmdkIndex(i)}
                        >
                          <span className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            r.type === 'order' ? 'bg-blue-100 text-blue-700' :
                            r.type === 'product' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-neutral-100 text-neutral-500'
                          }`}>
                            {r.type === 'order' ? '#' : r.type === 'product' ? 'P' : '→'}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate">{r.label}</span>
                            {r.sub && <span className="block text-xs text-neutral-400 truncate">{r.sub}</span>}
                          </span>
                          {i === cmdkIndex && (
                            <kbd className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded font-mono shrink-0">↵</kbd>
                          )}
                        </button>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-4 py-2 border-t border-neutral-100 text-[11px] text-neutral-400">
              <span><kbd className="bg-neutral-100 px-1 rounded font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="bg-neutral-100 px-1 rounded font-mono">↵</kbd> select</span>
              <span><kbd className="bg-neutral-100 px-1 rounded font-mono">ESC</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Types for Unleashed push state ────────────────────────────────────────
type UnleashedPushState = {
  // orderIds that have been pushed for this group label
  pushedOrderIds: string[];
  // Push targets per order ID
  pushTargets: Record<string, { unleashed: boolean; pickops: boolean }>;
  // Unleashed order number returned after push (populated later)
  unleashedOrderNumber?: string;
  unleashedOrderUrl?: string;
};

function AdminOrders({ viewOrderId, setViewOrderId }: { viewOrderId: string | null; setViewOrderId: (id: string | null) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // ── Unleashed: per-group selected order IDs (for checkboxes)
  const [groupSelections, setGroupSelections] = useState<Record<string, Set<string>>>({});

  // ── Unleashed: push state per group label (persists pushed badge + order number)
  const [unleashedPushState, setUnleashedPushState] = useState<Record<string, UnleashedPushState>>({});

  // ── PickOps: status per order ID (fetched from PickOps MongoDB)
  const [pickopsStatus, setPickopsStatus] = useState<Record<string, { status: string; lastUpdatedAt: string | null }>>({});

  // ── Unleashed modal state
  const [unleashedModal, setUnleashedModal] = useState<{
    groupLabel: string;
    selectedOrderIds: string[];
    aggregatedItems: { id: string; name: string; sku: string; rk_sku?: string; quantity: number }[];
  } | null>(null);

  // ── Unleashed modal: editable items
  const [modalItems, setModalItems] = useState<{ id: string; name: string; sku: string; rk_sku?: string; quantity: number }[]>([]);

  // ── Unleashed modal: pushing state
  const [pushingToUnleashed, setPushingToUnleashed] = useState(false);

  // ── Unleashed modal: stock data fetched from Unleashed, cached per group label
  // allGroupStock: { [groupLabel]: { [productKey]: { unleashedQty, newStock } } }
  const [allGroupStock, setAllGroupStock] = useState<Record<string, Record<string, { unleashedQty: number | null; newStock: number | null }>>>({});
  const [modalStock, setModalStock] = useState<Record<string, { unleashedQty: number | null; newStock: number | null }>>({});
  const [loadingStock, setLoadingStock] = useState(false);

  // Auto-open order modal when viewOrderId is set
  useEffect(() => {
    if (viewOrderId && orders.length > 0) {
      const order = orders.find((o) => o.id === viewOrderId);
      if (order) {
        setSelectedOrder(order);
        setViewOrderId(null);
      }
    }
  }, [viewOrderId, orders, setViewOrderId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/orders", { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to load orders");
      const loaded: any[] = Array.isArray(data) ? data : [];
      setOrders(loaded);

      // Rebuild unleashedPushState and allGroupStock from persisted order data
      const rebuilt: Record<string, UnleashedPushState> = {};
      const rebuiltStock: Record<string, Record<string, { unleashedQty: number | null; newStock: number | null }>> = {};
      loaded.forEach((order) => {
        const groupResult = getDateGroup(order.createdAt || order.updatedAt || "");
        const groupLabel = typeof groupResult === "string" ? groupResult : (groupResult as any)?.label ?? String(groupResult);

        if (order.unleashedOrderNumber) {
          if (!rebuilt[groupLabel] || !rebuilt[groupLabel].unleashedOrderNumber) {
            rebuilt[groupLabel] = {
              pushedOrderIds: [],
              pushTargets: {},
              unleashedOrderNumber: order.unleashedOrderNumber,
              unleashedOrderUrl: order.unleashedOrderUrl || "",
            };
          }
          rebuilt[groupLabel].pushedOrderIds = [
            ...new Set([...rebuilt[groupLabel].pushedOrderIds, order.id]),
          ];
          // Store push targets for this order
          rebuilt[groupLabel].pushTargets[order.id] = {
            unleashed: order.unleashedOrderNumber ? true : false,
            pickops: order.pickopsPushedAt ? true : false,
          };
        }

        // Rebuild stock cache from stockSnapshot saved on any order in the group
        if (order.stockSnapshot && !rebuiltStock[groupLabel]) {
          const snap = order.stockSnapshot as Record<string, number | null>;
          const map: Record<string, { unleashedQty: number | null; newStock: number | null }> = {};
          Object.entries(snap).forEach(([key, qty]) => {
            map[key] = { unleashedQty: qty, newStock: qty };
          });
          rebuiltStock[groupLabel] = map;
        }
      });
      if (Object.keys(rebuilt).length > 0) {
        setUnleashedPushState((prev) => ({ ...rebuilt, ...prev }));
      }
      if (Object.keys(rebuiltStock).length > 0) {
        setAllGroupStock((prev) => ({ ...rebuiltStock, ...prev }));
      }

      // Fetch PickOps status for all orders
      const orderIds = loaded.map((o) => o.id);
      if (orderIds.length > 0) {
        try {
          const pickopsResp = await fetch("/api/admin/pickops-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderIds }),
          });
          if (pickopsResp.ok) {
            const pickopsData = await pickopsResp.json();
            setPickopsStatus(pickopsData.statusMap || {});
          }
        } catch {
          // Non-fatal — PickOps status is optional
        }
      }
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

  const getDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Set cutoff to 12PM (noon)
    const getCutoffDate = (d: Date) => {
      const cutoff = new Date(d);
      cutoff.setHours(12, 0, 0, 0);
      return cutoff;
    };

    const nowCutoff = getCutoffDate(now);
    const todayCutoff = getCutoffDate(now);
    const yesterdayCutoff = new Date(todayCutoff);
    yesterdayCutoff.setDate(yesterdayCutoff.getDate() - 1);

    // If current time is before 12PM, "today" is from yesterday 12PM to today 12PM
    // If current time is after 12PM, "today" is from today 12PM to tomorrow 12PM
    const isBeforeNoon = now.getHours() < 12;
    const todayStart = isBeforeNoon ? yesterdayCutoff : todayCutoff;
    const todayEnd = isBeforeNoon ? todayCutoff : new Date(todayCutoff.getTime() + 24 * 60 * 60 * 1000);

    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = todayStart;

    if (date >= todayStart && date < todayEnd) {
      return { label: "Today", date: todayStart };
    } else if (date >= yesterdayStart && date < yesterdayEnd) {
      return { label: "Yesterday", date: yesterdayStart };
    } else {
      const daysAgo = Math.floor((todayStart.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) {
        return { label: `${daysAgo} days ago`, date: date };
      } else {
        return { label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), date: date };
      }
    }
  };

  const groupOrdersByDate = (orders: any[]) => {
    const groups: Record<string, any[]> = {};
    orders.forEach((order) => {
      const group = getDateGroup(order.createdAt || Date.now());
      const key = group.label;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });
    return groups;
  };

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
      const prevOrder = orders.find((o: any) => o.id === id);
      activityLogger.action("order_status_updated", {
        orderId: id,
        previousStatus: prevOrder?.status ?? 'unknown',
        newStatus: status,
        customer: prevOrder?.customerName || prevOrder?.customer?.email || 'unknown',
      });
    } catch (err: any) {
      activityLogger.error("order_status_update_failed", { orderId: id, attemptedStatus: status, error: err?.message });
      setError(err?.message || "Failed to update order");
    } finally {
      setSavingId(null);
    }
  };

  // ── Unleashed helpers ──────────────────────────────────────────────────────

  const getGroupSelection = (groupLabel: string, groupOrders: any[]): Set<string> => {
    if (groupSelections[groupLabel]) return groupSelections[groupLabel];
    // Default: select all orders that have NOT already been pushed in this group
    const pushedIds = new Set(unleashedPushState[groupLabel]?.pushedOrderIds || []);
    const defaultSelected = new Set(
      groupOrders.filter((o) => !pushedIds.has(o.id)).map((o) => o.id)
    );
    return defaultSelected;
  };

  const setGroupSelection = (groupLabel: string, ids: Set<string>) => {
    setGroupSelections((prev) => ({ ...prev, [groupLabel]: ids }));
  };

  const toggleOrderInGroup = (groupLabel: string, orderId: string, groupOrders: any[]) => {
    const current = new Set(getGroupSelection(groupLabel, groupOrders));
    if (current.has(orderId)) {
      current.delete(orderId);
    } else {
      current.add(orderId);
    }
    setGroupSelection(groupLabel, current);
  };

  const toggleAllInGroup = (groupLabel: string, groupOrders: any[]) => {
    const current = getGroupSelection(groupLabel, groupOrders);
    const allIds = groupOrders.map((o) => o.id);
    if (current.size === allIds.length) {
      setGroupSelection(groupLabel, new Set());
    } else {
      setGroupSelection(groupLabel, new Set(allIds));
    }
  };

  const openUnleashedModal = (groupLabel: string, groupOrders: any[]) => {
    const selection = getGroupSelection(groupLabel, groupOrders);
    const selectedOrderIds = Array.from(selection);
    const selectedOrders = groupOrders.filter((o) => selectedOrderIds.includes(o.id));

    // Aggregate items: merge by product id, summing quantities
    const itemMap: Record<string, { id: string; name: string; sku: string; rk_sku: string; quantity: number }> = {};
    selectedOrders.forEach((order) => {
      (order.items || []).forEach((item: any) => {
        // Group by rk_sku first (stable Unleashed product code), then sku, then id, then name
        const key = item.rk_sku || item.sku || item.id || item.name;
        if (itemMap[key]) {
          itemMap[key].quantity += Number(item.quantity || 1);
        } else {
          itemMap[key] = {
            id: item.id || key,
            name: item.name || "Unknown",
            sku: item.sku || "",
            rk_sku: item.rk_sku || "",
            quantity: Number(item.quantity || 1),
          };
        }
      });
    });

    const aggregatedItems = Object.values(itemMap);
    setUnleashedModal({ groupLabel, selectedOrderIds, aggregatedItems });
    setModalItems(aggregatedItems.map((i) => ({ ...i })));

    // Fetch stock from Unleashed on first open for this group; restore from cache on subsequent opens
    setAllGroupStock((prev) => {
      if (prev[groupLabel]) {
        // Already fetched — restore cached stock immediately
        setModalStock(prev[groupLabel]);
        setLoadingStock(false);
        return prev;
      }
      // First open — fetch from Unleashed
      setLoadingStock(true);
      setModalStock({});
      const stockItems = aggregatedItems.map((i) => ({
        rk_sku: i.rk_sku || "",
        sku: i.sku || "",
        name: i.name || "",
        sellingQty: i.quantity,
      }));
      fetch("/api/unleashed/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: stockItems, orderIds: selectedOrderIds }),
      })
        .then((r) => r.json())
        .then((data) => {
          const map: Record<string, { unleashedQty: number | null; newStock: number | null }> = {};
          (data.results || []).forEach((r: any) => {
            [r.productCode, r.rk_sku, r.sku, r.name].filter(Boolean).forEach((k: string) => {
              if (!map[k]) map[k] = { unleashedQty: r.unleashedQty, newStock: r.newStock };
            });
          });
          setModalStock(map);
          setAllGroupStock((s) => ({ ...s, [groupLabel]: map }));
        })
        .catch(() => {})
        .finally(() => setLoadingStock(false));
      return { ...prev, [groupLabel]: {} }; // reserve slot so parallel opens don't double-fetch
    });
  };

  const handleModalItemQtyChange = (idx: number, value: string) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setModalItems((prev) => prev.map((item, i) => (i === idx ? { ...item, quantity: qty } : item)));
  };

  const [unleashedError, setUnleashedError] = useState<string>("");
  const [pushTargets, setPushTargets] = useState<{ unleashed: boolean; pickops: boolean }>({ unleashed: true, pickops: true });

  const handlePushToUnleashed = async () => {
    if (!unleashedModal) return;
    if (!pushTargets.unleashed && !pushTargets.pickops) return;
    setPushingToUnleashed(true);
    setUnleashedError("");

    const { groupLabel, selectedOrderIds } = unleashedModal;

    // Build per-order breakdown for PickOps (individual docs per order)
    const selectedOrders = orders.filter((o: any) => selectedOrderIds.includes(o.id));
    const perOrder = selectedOrders.map((o: any) => ({
      orderId: o.id,
      customerName: o.customerName || o.customer?.name || "",
      items: (o.items || []).map((item: any) => ({
        name: item.name || "",
        sku: item.sku || "",
        rk_sku: item.rk_sku || "",
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.price || 0),
      })),
    }));

    try {
      const resp = await fetch("/api/unleashed/sales-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          groupLabel,
          selectedOrderIds,
          items: modalItems,
          perOrder,
          pushTargets,
        }),
      });
      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        setUnleashedError(data?.error || `Push failed (${resp.status})`);
        setPushingToUnleashed(false);
        return;
      }

      // Mark these specific orders as pushed and store the Unleashed order number
      setUnleashedPushState((prev) => {
        const existing = prev[groupLabel] || { pushedOrderIds: [], pushTargets: {} };
        const merged = Array.from(new Set([...existing.pushedOrderIds, ...selectedOrderIds]));
        
        // Build push targets for each selected order
        const newPushTargets: Record<string, { unleashed: boolean; pickops: boolean }> = {};
        selectedOrderIds.forEach(orderId => {
          newPushTargets[orderId] = {
            unleashed: pushTargets.unleashed,
            pickops: pushTargets.pickops,
          };
        });
        
        return {
          ...prev,
          [groupLabel]: {
            pushedOrderIds: merged,
            pushTargets: { ...existing.pushTargets, ...newPushTargets },
            unleashedOrderNumber: data?.orderNumber || existing.unleashedOrderNumber,
            unleashedOrderUrl: data?.orderUrl || existing.unleashedOrderUrl,
          },
        };
      });

      // After push: deselect pushed orders from checkboxes so next push defaults exclude them
      setGroupSelections((prev) => {
        const remaining = new Set(
          (prev[groupLabel] ? Array.from(prev[groupLabel]) : []).filter(
            (id) => !selectedOrderIds.includes(id)
          )
        );
        return { ...prev, [groupLabel]: remaining };
      });

      activityLogger.action("orders_pushed", {
        orderIds: selectedOrderIds,
        orderCount: selectedOrderIds.length,
        groupLabel,
        targets: [pushTargets.unleashed && 'Unleashed', pushTargets.pickops && 'PickOps'].filter(Boolean).join(' + '),
        unleashedOrderNumber: data?.orderNumber || null,
      });
      setUnleashedModal(null);
    } catch (err: any) {
      activityLogger.error("orders_push_failed", {
        orderIds: selectedOrderIds,
        groupLabel,
        targets: [pushTargets.unleashed && 'Unleashed', pushTargets.pickops && 'PickOps'].filter(Boolean).join(' + '),
        error: err?.message,
      });
      setUnleashedError(err?.message || "Unexpected error pushing to Unleashed");
    } finally {
      setPushingToUnleashed(false);
    }
  };

  const isPushedToUnleashed = (groupLabel: string, orderId: string) =>
    unleashedPushState[groupLabel]?.pushedOrderIds?.includes(orderId) ?? false;

  // ─────────────────────────────────────────────────────────────────────────

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

      <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        <strong>Grouping:</strong> Orders are grouped from 12PM to 12PM (noon to noon)
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
            {Object.entries(groupOrdersByDate(orders)).map(([groupLabel, groupOrders]) => {
              const selection = getGroupSelection(groupLabel, groupOrders);
              const allSelected = selection.size === groupOrders.length;
              const someSelected = selection.size > 0 && !allSelected;
              const pushState = unleashedPushState[groupLabel];

              return (
                <div key={groupLabel} className="mb-6">
                  {/* ── Group header ── */}
                  <div className="sticky top-0 z-10 bg-neutral-100/80 backdrop-blur-sm border-b border-neutral-200 px-6 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="text-sm font-bold text-neutral-700 shrink-0">{groupLabel}</h3>
                      {/* Unleashed order number badge — shown once available */}
                      {pushState?.unleashedOrderNumber && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                          Unleashed #{pushState.unleashedOrderNumber}
                        </span>
                      )}
                    </div>
                    {/* Push to Unleashed button */}
                    <button
                      type="button"
                      disabled={selection.size === 0}
                      onClick={() => openUnleashedModal(groupLabel, groupOrders)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm transition-all hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      Push to Unleashed
                      {selection.size > 0 && (
                        <span className="ml-0.5 rounded-full bg-violet-200 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                          {selection.size}
                        </span>
                      )}
                    </button>
                  </div>

                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500">
                      <tr>
                        {/* Select-all checkbox */}
                        <th className="px-4 py-4 w-10">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected; }}
                            onChange={() => toggleAllInGroup(groupLabel, groupOrders)}
                            className="h-4 w-4 rounded border-neutral-300 accent-violet-600 cursor-pointer"
                            title="Select all in group"
                          />
                        </th>
                        <th className="px-4 py-4 font-semibold">Order ID</th>
                        <th className="px-4 py-4 font-semibold">Time</th>
                        <th className="px-4 py-4 font-semibold">Customer</th>
                        <th className="px-4 py-4 font-semibold text-center">Items</th>
                        <th className="px-4 py-4 font-semibold text-right">Total</th>
                        <th className="px-4 py-4 font-semibold text-center">Pushed</th>
                        <th className="px-4 py-4 font-semibold text-center">PickOps</th>
                        <th className="px-4 py-4 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {groupOrders.map((o) => {
                        const pushed = isPushedToUnleashed(groupLabel, o.id);
                        const checked = selection.has(o.id);
                        return (
                          <tr
                            key={o.id}
                            className={`transition-colors hover:bg-neutral-50/50 cursor-pointer ${pushed ? "bg-violet-50/30" : ""}`}
                            onClick={() => setSelectedOrder(o)}
                          >
                            {/* Per-order checkbox */}
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleOrderInGroup(groupLabel, o.id, groupOrders)}
                                className="h-4 w-4 rounded border-neutral-300 accent-violet-600 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-mono font-medium text-neutral-600">
                                #{o.id}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-medium text-neutral-600">
                              {new Date(o.createdAt || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-neutral-900">{o?.customer?.email || "Guest User"}</div>
                            </td>
                            <td className="px-4 py-4 text-center font-medium text-neutral-600">
                              {Array.isArray(o.items) ? o.items.length : 0}
                            </td>
                            <td className="px-4 py-4 text-right font-extrabold text-neutral-900">
                              AU${Number(o?.pricing?.total || 0).toFixed(2)}
                            </td>
                            {/* Pushed badge */}
                            <td className="px-4 py-4 text-center">
                              {(() => {
                                const targets = unleashedPushState[groupLabel]?.pushTargets?.[o.id];
                                if (!targets) {
                                  return <span className="text-xs text-neutral-300">—</span>;
                                }
                                
                                let text = "";
                                if (targets.unleashed && targets.pickops) {
                                  text = "PickOps + Unleashed";
                                } else if (targets.unleashed) {
                                  text = "Unleashed";
                                } else if (targets.pickops) {
                                  text = "PickOps";
                                } else {
                                  return <span className="text-xs text-neutral-300">—</span>;
                                }
                                
                                return (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    {text}
                                  </span>
                                );
                              })()}
                            </td>
                            {/* PickOps status */}
                            <td className="px-4 py-4 text-center">
                              {(() => {
                                const pickops = pickopsStatus[o.id];
                                if (!pickops) {
                                  return <span className="text-xs text-neutral-300">—</span>;
                                }
                                const statusColor = {
                                  pending: "bg-amber-100 text-amber-700",
                                  picked: "bg-blue-100 text-blue-700",
                                  packed: "bg-indigo-100 text-indigo-700",
                                  shipped: "bg-purple-100 text-purple-700",
                                  completed: "bg-emerald-100 text-emerald-700",
                                  cancelled: "bg-rose-100 text-rose-700",
                                  backordered: "bg-orange-100 text-orange-700",
                                  "Release to Pick": "bg-cyan-100 text-cyan-700",
                                  "Backordered": "bg-orange-100 text-orange-700",
                                }[pickops.status] || "bg-neutral-100 text-neutral-700";
                                return (
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}>
                                    {pickops.status}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-flex items-center">
                                <select
                                  className={`appearance-none rounded-full border border-transparent py-1.5 pl-4 pr-8 text-xs font-bold font-semibold uppercase tracking-wider outline-none ring-1 ring-inset ring-black/5 transition-all focus:ring-2 focus:ring-primary ${
                                    o.status === "delivered" || o.status === "customer_received"
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
                                  <option value="customer_received">Received by Customer</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                <div className="pointer-events-none absolute right-3 opacity-50">▾</div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Unleashed Push Modal ── */}
      {unleashedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !pushingToUnleashed && setUnleashedModal(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 bg-violet-50 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Push to Unleashed</h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {unleashedModal.groupLabel} · {unleashedModal.selectedOrderIds.length} order{unleashedModal.selectedOrderIds.length !== 1 ? "s" : ""} selected
                </p>
              </div>
              <button
                onClick={() => !pushingToUnleashed && setUnleashedModal(null)}
                disabled={pushingToUnleashed}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body: aggregated items table */}
            <div className="px-6 py-4">
              <p className="mb-3 text-xs text-neutral-500">
                Review and adjust quantities before pushing. Items are aggregated across all selected orders.
              </p>
              {(() => {
                const hasRkSku = modalItems.some((i) => i.rk_sku);
                return (
                  <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold">Product</th>
                          {hasRkSku && <th className="px-4 py-2.5 text-left font-semibold">RK_SKU</th>}
                          <th className="px-4 py-2.5 text-right font-semibold w-28">Quantity</th>
                          <th className="px-4 py-2.5 text-right font-semibold w-28">
                            {loadingStock ? (
                              <span className="inline-flex items-center gap-1 text-neutral-400">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-500" />
                                Stock
                              </span>
                            ) : "Stock"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {modalItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-neutral-50/60">
                            <td className="px-4 py-3 font-medium text-neutral-900 max-w-[200px] truncate" title={item.name}>
                              {item.name}
                            </td>
                            {hasRkSku && (
                              <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                {item.rk_sku || "—"}
                              </td>
                            )}
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min={0}
                                value={item.quantity}
                                onChange={(e) => handleModalItemQtyChange(idx, e.target.value)}
                                className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-right text-sm font-semibold text-neutral-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              {(() => {
                                const key = item.rk_sku || item.sku || item.name;
                                const s = modalStock[key];
                                if (loadingStock) return <span className="text-neutral-300">...</span>;
                                if (!s || s.newStock === null) return <span className="text-neutral-400">—</span>;
                                return (
                                  <div className="flex flex-col items-end">
                                    <span className={`text-base font-bold tabular-nums ${
                                      s.newStock < 1 ? "text-red-600" : s.newStock <= 3 ? "text-amber-500" : "text-emerald-600"
                                    }`}>
                                      {s.newStock}
                                    </span>
                                    <span className="text-[10px] text-neutral-400">of {s.unleashedQty} in UL</span>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                        {modalItems.length === 0 && (
                          <tr>
                            <td colSpan={hasRkSku ? 4 : 3} className="px-4 py-6 text-center text-sm text-neutral-400">
                              No items in selected orders.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 border-t border-neutral-200 px-6 py-4">
              {unleashedError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                  {unleashedError}
                </div>
              )}
              {/* Push targets */}
              <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Push to:</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pushTargets.unleashed}
                    onChange={(e) => {
                      const next = { ...pushTargets, unleashed: e.target.checked };
                      if (!next.unleashed && !next.pickops) return; // at least one must stay checked
                      setPushTargets(next);
                    }}
                    className="h-4 w-4 rounded border-neutral-300 accent-violet-600"
                  />
                  <span className="text-sm font-semibold text-neutral-700">Unleashed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pushTargets.pickops}
                    onChange={(e) => {
                      const next = { ...pushTargets, pickops: e.target.checked };
                      if (!next.unleashed && !next.pickops) return; // at least one must stay checked
                      setPushTargets(next);
                    }}
                    className="h-4 w-4 rounded border-neutral-300 accent-violet-600"
                  />
                  <span className="text-sm font-semibold text-neutral-700">PickOps</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { if (!pushingToUnleashed) { setUnleashedModal(null); setUnleashedError(""); } }}
                disabled={pushingToUnleashed}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePushToUnleashed}
                disabled={pushingToUnleashed || modalItems.length === 0 || (!pushTargets.unleashed && !pushTargets.pickops)}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pushingToUnleashed ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    Push{pushTargets.unleashed && pushTargets.pickops ? " to Unleashed + PickOps" : pushTargets.unleashed ? " to Unleashed" : " to PickOps"}
                  </>
                )}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-bold text-neutral-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-neutral-50 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Order ID</p>
                  <p className="font-mono text-sm font-medium">#{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Date</p>
                  <p className="text-sm">{new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Status</p>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    selectedOrder.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                    selectedOrder.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    selectedOrder.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedOrder.status || 'Processing'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total</p>
                  <p className="text-sm font-bold">AU${Number(selectedOrder?.pricing?.total || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Unleashed</p>
                  {selectedOrder.unleashedOrderNumber ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Pushed
                      </span>
                      {selectedOrder.unleashedOrderUrl && (
                        <a
                          href={selectedOrder.unleashedOrderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-600 hover:text-violet-800 underline"
                          title="View in Unleashed"
                        >
                          {selectedOrder.unleashedOrderNumber}
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-400">Not pushed</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">PickOps</p>
                  {(() => {
                    const pickops = pickopsStatus[selectedOrder.id];
                    if (!pickops) {
                      return <span className="text-xs text-neutral-400">Not in PickOps</span>;
                    }
                    const statusColor = {
                      pending: "bg-amber-100 text-amber-700",
                      picked: "bg-blue-100 text-blue-700",
                      packed: "bg-indigo-100 text-indigo-700",
                      shipped: "bg-purple-100 text-purple-700",
                      completed: "bg-emerald-100 text-emerald-700",
                      cancelled: "bg-rose-100 text-rose-700",
                    }[pickops.status] || "bg-neutral-100 text-neutral-700";
                    return (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusColor}`}>
                          {pickops.status}
                        </span>
                        {pickops.lastUpdatedAt && (
                          <span className="text-[10px] text-neutral-400">
                            Updated {new Date(pickops.lastUpdatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Customer</h3>
                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="font-medium text-neutral-900">{selectedOrder?.customer?.fullName || 'N/A'}</p>
                  <p className="text-sm text-neutral-600">{selectedOrder?.customer?.email}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Shipping Address</h3>
                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="font-medium text-neutral-900">{selectedOrder?.shipping?.address}</p>
                  <p className="text-sm text-neutral-600">
                    {selectedOrder?.shipping?.city}, {selectedOrder?.shipping?.state} {selectedOrder?.shipping?.zipCode}
                  </p>
                  <p className="text-sm text-neutral-600">{selectedOrder?.shipping?.country}</p>
                  {selectedOrder?.shipping?.phone && (
                    <p className="mt-2 text-sm text-neutral-600">📞 {selectedOrder.shipping.phone}</p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Items</h3>
                <div className="rounded-lg border border-neutral-200">
                  {(selectedOrder?.items || []).map((item: any, idx: number) => (
                    <div key={idx} className={`flex items-center justify-between p-4 ${idx !== (selectedOrder?.items?.length || 0) - 1 ? 'border-b border-neutral-100' : ''}`}>
                      <div>
                        <p className="font-medium text-neutral-900">{item.name}</p>
                        {item.rk_sku && <p className="font-mono text-xs text-violet-600">{item.rk_sku}</p>}
                        <p className="text-sm text-neutral-500">Qty: {item.quantity} × AU${Number(item.unitPrice || 0).toFixed(2)}</p>
                      </div>
                      <p className="font-semibold text-neutral-900">AU${Number(item.lineTotal || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Pricing</h3>
                <div className="rounded-lg border border-neutral-200 p-4">
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-600">Subtotal</span>
                    <span>AU${Number(selectedOrder?.pricing?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder?.pricing?.discountTotal > 0 && (
                    <div className="flex justify-between py-1 text-emerald-600">
                      <span>Member Discount</span>
                      <span>-AU${Number(selectedOrder.pricing.discountTotal).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2">
                    <span className="font-bold text-neutral-900">Total</span>
                    <span className="font-bold text-neutral-900">AU${Number(selectedOrder?.pricing?.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <AdminSupportChat
              orderId={selectedOrder.id}
              customerEmail={selectedOrder.customer?.email}
              customerName={selectedOrder.customer?.fullName}
            />

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminReturns({ viewReturnId, setViewReturnId }: { viewReturnId: string | null; setViewReturnId: (id: string | null) => void }) {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Auto-open return modal when viewReturnId is set
  useEffect(() => {
    if (viewReturnId && returns.length > 0) {
      const ret = returns.find((r) => r.id === viewReturnId);
      if (ret) {
        setSelectedReturn(ret);
        setViewReturnId(null);
      }
    }
  }, [viewReturnId, returns, setViewReturnId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const url = filterStatus === "all" ? "/api/returns" : `/api/returns?status=${filterStatus}`;
      const resp = await fetch(url, { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to load returns");
      setReturns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setReturns([]);
      setError(err?.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  const updateReturn = async (id: string, updates: Record<string, any>) => {
    setSavingId(id);
    setError("");
    try {
      const resp = await fetch(`/api/returns/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || "Failed to update return");
      setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
      if (selectedReturn?.id === id) {
        setSelectedReturn({ ...selectedReturn, ...data });
      }
      activityLogger.action("return_updated", { returnId: id, fields: Object.keys(updates), values: updates });
    } catch (err: any) {
      activityLogger.error("return_update_failed", { returnId: id, error: err?.message });
      setError(err?.message || "Failed to update return");
    } finally {
      setSavingId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "approved":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "rejected":
        return "bg-rose-50 text-rose-700 ring-rose-600/20";
      case "completed":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "cancelled":
        return "bg-neutral-100 text-neutral-600 ring-neutral-600/20";
      default:
        return "bg-neutral-100 text-neutral-600 ring-neutral-600/20";
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      faulty: "Faulty / Defective",
      stopped_working: "Stopped Working (No Physical Damage)",
      wrong_item: "Wrong Item",
      not_as_described: "Not As Described",
      changed_mind: "Changed Mind",
      other: "Other",
    };
    return reasons[reason] || reason;
  };

  const getConditionLabel = (condition: string) => {
    const conditions: Record<string, string> = {
      unopened: "Unopened / Sealed",
      opened_unused: "Opened but Unused",
      used: "Used",
      damaged: "Damaged",
      unknown: "Unknown",
    };
    return conditions[condition] || condition;
  };

  const pendingCount = returns.filter((r) => r.status === "pending").length;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
            Returns
            {pendingCount > 0 && (
              <span className="ml-3 inline-flex items-center justify-center rounded-full bg-rose-100 px-2.5 py-1 text-sm font-bold text-rose-700">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Manage customer return requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm"
          >
            <option value="all">All Returns</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="shipped">Shipped (by customer)</option>
            <option value="received">Received (by us)</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-all hover:bg-neutral-50"
            onClick={load}
            disabled={loading}
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh
          </button>
        </div>
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
            Loading returns...
          </div>
        ) : returns.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-2xl font-bold text-neutral-400">
              ↩️
            </span>
            <p className="text-sm font-semibold text-neutral-900">No return requests</p>
            <p className="mt-1 text-sm text-neutral-500">When customers request returns, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Return ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Order</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Reason</th>
                  <th className="px-6 py-4 font-semibold text-center">Items</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {returns.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-neutral-50/50">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-mono font-medium text-neutral-600">
                        #{r.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-600">
                      {new Date(r.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-neutral-500">#{r.orderId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{r.customerEmail || "Unknown"}</div>
                      {r.customerName && <div className="text-xs text-neutral-500">{r.customerName}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-700">{getReasonLabel(r.reason)}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-neutral-600">
                      {Array.isArray(r.items) ? r.items.length : 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${getStatusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark"
                        onClick={() => setSelectedReturn(r)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReturn && (
        <ReturnDetailModal
          returnRequest={selectedReturn}
          onClose={() => setSelectedReturn(null)}
          onUpdate={updateReturn}
          savingId={savingId}
          getReasonLabel={getReasonLabel}
          getConditionLabel={getConditionLabel}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      )}
    </div>
  );
}

function ReturnDetailModal({
  returnRequest,
  onClose,
  onUpdate,
  savingId,
  getReasonLabel,
  getConditionLabel,
  getStatusBadgeClass,
}: {
  returnRequest: any;
  onClose: () => void;
  onUpdate: (id: string, updates: Record<string, any>) => Promise<void>;
  savingId: string | null;
  getReasonLabel: (reason: string) => string;
  getConditionLabel: (condition: string) => string;
  getStatusBadgeClass: (status: string) => string;
}) {
  const [resolution, setResolution] = useState(returnRequest.resolution || "");
  const [refundAmount, setRefundAmount] = useState(returnRequest.refundAmount || 0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos: string[] = Array.isArray(returnRequest.photos) ? returnRequest.photos : [];

  const totalItemValue = (returnRequest.items || []).reduce(
    (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const handleStatusChange = async (newStatus: string) => {
    await onUpdate(returnRequest.id, { status: newStatus });
  };

  const isExpiredRequest = returnRequest.reasonDetails?.includes("[RETURN WINDOW EXPIRED");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-900">Return Request Details</h3>
            <p className="text-sm text-neutral-500">#{returnRequest.id}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-2xl">×</button>
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl bg-neutral-50 p-4">
              <h4 className="text-sm font-bold text-neutral-700 mb-2">Order Information</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Order ID:</strong> {returnRequest.orderId}</p>
                <p><strong>Order Date:</strong> {new Date(returnRequest.orderDate).toLocaleDateString()}</p>
                <p><strong>Customer:</strong> {returnRequest.customerEmail}</p>
                {returnRequest.customerName && <p><strong>Name:</strong> {returnRequest.customerName}</p>}
                {returnRequest.trackingNumber && <p><strong>Tracking:</strong> {returnRequest.trackingNumber}</p>}
                {returnRequest.approvedAt && <p><strong>Approved:</strong> {new Date(returnRequest.approvedAt).toLocaleDateString()}</p>}
                {returnRequest.receivedAt && <p><strong>Received:</strong> {new Date(returnRequest.receivedAt).toLocaleDateString()}</p>}
                {returnRequest.refundedAt && <p><strong>Refunded:</strong> {new Date(returnRequest.refundedAt).toLocaleDateString()}</p>}
              </div>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <h4 className="text-sm font-bold text-neutral-700 mb-2">Return Reason</h4>
              <p className="text-sm font-medium text-neutral-900">{getReasonLabel(returnRequest.reason)}</p>
              {returnRequest.condition && (
                <p className="text-sm text-neutral-600 mt-1"><strong>Condition:</strong> {getConditionLabel(returnRequest.condition)}</p>
              )}
              {returnRequest.reasonDetails && (
                <div className={`mt-2 rounded-lg p-3 text-sm ${isExpiredRequest ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-neutral-200'}`}>
                  {isExpiredRequest && (
                    <span className="inline-block mb-1 rounded bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                      EXPIRED WINDOW REQUEST
                    </span>
                  )}
                  <p className="text-neutral-700 whitespace-pre-wrap">{returnRequest.reasonDetails}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <h4 className="text-sm font-bold text-neutral-700 mb-2">Items to Return ({returnRequest.items?.length || 0})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(returnRequest.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-white rounded-lg p-2 border border-neutral-200">
                    <div>
                      <p className="font-medium text-neutral-900">{item.productName || "Item"}</p>
                      <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-neutral-700">AU${Number(item.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-neutral-200 flex justify-between text-sm font-bold">
                <span>Total Value:</span>
                <span>AU${totalItemValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h4 className="text-sm font-bold text-neutral-700 mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {["pending", "approved", "rejected", "shipped", "received", "refunded", "cancelled"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={savingId === returnRequest.id}
                    onClick={() => handleStatusChange(status)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ring-1 ring-inset transition-all ${
                      returnRequest.status === status
                        ? getStatusBadgeClass(status) + " ring-2"
                        : "bg-white text-neutral-500 ring-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h4 className="text-sm font-bold text-neutral-700 mb-3">Resolution</h4>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Select resolution...</option>
                <option value="replacement">Exchange / Replacement</option>
                <option value="refund">Refund</option>
                <option value="rejected">Rejected - No Action</option>
              </select>

              {(resolution === "refund" || resolution === "store_credit") && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Refund Amount (AU$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    placeholder={totalItemValue.toFixed(2)}
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onUpdate(returnRequest.id, { resolution, refundAmount: Number(refundAmount) })}
              disabled={savingId === returnRequest.id}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"
            >
              {savingId === returnRequest.id ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="mt-4 rounded-xl bg-neutral-50 border border-neutral-200 p-4">
            <h4 className="text-sm font-bold text-neutral-700 mb-3">Photos ({photos.length}) — click to enlarge</h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {photos.map((src: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-neutral-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  <img src={src} alt={`photo ${i + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition">
                    <svg className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0zM11 8v6M8 11h6" /></svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
            onClick={() => setLightboxIndex(null)}
          >
            <div className="relative flex flex-col items-center max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex w-full items-center justify-between mb-3">
                <span className="text-white/70 text-sm">{lightboxIndex + 1} / {photos.length}</span>
                <div className="flex gap-2">
                  <a
                    href={photos[lightboxIndex]}
                    download={`photo-${lightboxIndex + 1}`}
                    className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm font-semibold text-white flex items-center gap-1.5 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                    Download
                  </a>
                  <button
                    onClick={() => setLightboxIndex(null)}
                    className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm font-semibold text-white transition"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="relative w-full flex items-center justify-center">
                {photos.length > 1 && (
                  <button
                    onClick={() => setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)}
                    className="absolute left-0 z-10 rounded-full bg-white/10 hover:bg-white/25 p-2 text-white transition -translate-x-2"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                )}
                <img
                  src={photos[lightboxIndex]}
                  alt={`photo ${lightboxIndex + 1}`}
                  className="max-h-[75vh] max-w-full rounded-xl shadow-2xl object-contain"
                />
                {photos.length > 1 && (
                  <button
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
                    className="absolute right-0 z-10 rounded-full bg-white/10 hover:bg-white/25 p-2 text-white transition translate-x-2"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                )}
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 max-w-full">
                {photos.map((src: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition ${
                      i === lightboxIndex ? "border-blue-400" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AdminSupportChat
          orderId={undefined}
          returnId={returnRequest.id}
          customerEmail={returnRequest.customerEmail}
          customerName={returnRequest.customerName}
        />

        <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-500">
          <span>Created: {new Date(returnRequest.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(returnRequest.updatedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function ShopifyDashboard({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
  const [stats, setStats] = useState({
    totalSales: 0,
    orders: 0,
    customers: 0,
    products: 0,
    returns: 0,
    avgOrderValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const [ordersRes, productsRes, returnsRes] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/returns", { cache: "no-store" }),
      ]);
      
      const orders = await ordersRes.json().catch(() => []);
      const products = await productsRes.json().catch(() => []);
      const returns = await returnsRes.json().catch(() => []);
      
      const totalSales = (orders || []).reduce((sum: number, o: any) => sum + (o?.pricing?.total || 0), 0);
      const orderCount = (orders || []).length;
      
      setStats({
        totalSales,
        orders: orderCount,
        customers: new Set((orders || []).map((o: any) => o?.customer?.email).filter(Boolean)).size,
        products: (products || []).length,
        returns: (returns || []).filter((r: any) => r.status === 'pending').length,
        avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
      });
      
      setRecentOrders((orders || []).slice(0, 5));
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, gradient: 'from-blue-500 to-blue-600', change: '+8.2%', up: true },
    { label: 'Total Revenue', value: `AU$${stats.totalSales.toFixed(2)}`, icon: DollarSign, gradient: 'from-emerald-500 to-emerald-600', change: '+12.5%', up: true },
    { label: 'Active Users', value: stats.customers, icon: Users, gradient: 'from-purple-500 to-purple-600', change: '+5.1%', up: true },
    { label: 'Pending Returns', value: stats.returns, icon: RotateCcw, gradient: 'from-amber-500 to-amber-600', change: null, up: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
                <Bell size={20} className="text-slate-600" />
              </button>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <button className="p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
              <Settings size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon size={28} className="text-white" />
                  </div>
                </div>
                {stat.change && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${stat.up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {stat.up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      <span className="text-sm font-semibold">{stat.change}</span>
                    </div>
                    <span className="text-sm text-slate-400">vs last month</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">Recent Orders</h3>
            <button 
              onClick={() => onNavigateTab('orders')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No orders yet</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                      {order?.customer?.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{order?.customer?.email || 'Guest'}</p>
                      <p className="text-sm text-slate-500">#{order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">AU${(order?.pricing?.total || 0).toFixed(2)}</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'delivered' || order.status === 'customer_received' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status === 'customer_received' ? 'Received' : (order.status || 'processing')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { label: 'Add Product', icon: Plus, tab: 'products', color: 'from-blue-500 to-blue-600' },
                { label: 'View Orders', icon: ShoppingCart, tab: 'orders', color: 'from-emerald-500 to-emerald-600' },
                { label: 'Manage Returns', icon: RotateCcw, tab: 'returns', color: 'from-amber-500 to-amber-600' },
                { label: 'View Analytics', icon: BarChart3, tab: 'analytics', color: 'from-purple-500 to-purple-600' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => onNavigateTab(action.tab)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-slate-700">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Support Tickets Alert */}
          {stats.returns > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-900">Pending Returns</p>
                  <p className="text-amber-700 mt-1">
                    You have {stats.returns} return request{stats.returns > 1 ? 's' : ''} awaiting review.
                  </p>
                  <button 
                    onClick={() => onNavigateTab('returns')}
                    className="mt-3 font-semibold text-amber-900 hover:text-amber-800 transition-colors"
                  >
                    Review now →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomersSection() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const orders = await res.json().catch(() => []);
        
        const customerMap = new Map();
        (orders || []).forEach((order: any) => {
          const email = order?.customer?.email;
          if (!email) return;
          
          if (customerMap.has(email)) {
            const existing = customerMap.get(email);
            existing.orders += 1;
            existing.totalSpent += order?.pricing?.total || 0;
            if (new Date(order.createdAt) > new Date(existing.lastOrder)) {
              existing.lastOrder = order.createdAt;
            }
          } else {
            customerMap.set(email, {
              email,
              name: order?.customer?.name || order?.shipping?.name || '',
              phone: order?.customer?.phone || order?.shipping?.phone || '',
              orders: 1,
              totalSpent: order?.pricing?.total || 0,
              lastOrder: order.createdAt,
              address: order?.shipping ? `${order.shipping.city}, ${order.shipping.state}` : '',
            });
          }
        });
        
        setCustomers(Array.from(customerMap.values()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Customers</h2>
          <p className="text-sm text-neutral-500 mt-1">{customers.length} total customers</p>
        </div>
        <button className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Location</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Orders</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Total Spent</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.email} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{customer.name || 'Guest'}</p>
                          <p className="text-xs text-neutral-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{customer.address || '-'}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-neutral-900">{customer.orders}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900">AU${customer.totalSpent.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-500">
                      {new Date(customer.lastOrder).toLocaleDateString()}
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

function InventorySection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStock, setLoadingStock] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<'name' | 'quantity' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Memoize sorted products to avoid re-sorting on every render
  const sortedProducts = useMemo(() => {
    if (!sortColumn) return products;
    
    const sorted = [...products].sort((a, b) => {
      if (sortColumn === 'name') {
        const aName = a.name?.toLowerCase() || '';
        const bName = b.name?.toLowerCase() || '';
        if (sortDirection === 'asc') return aName.localeCompare(bName);
        return bName.localeCompare(aName);
      }
      
      if (sortColumn === 'quantity') {
        const aQty = a.quantity;
        const bQty = b.quantity;
        
        // Handle null values - always sort to end
        if (aQty === null && bQty === null) return 0;
        if (aQty === null) return 1;
        if (bQty === null) return -1;
        
        // Both have values, sort normally
        if (sortDirection === 'asc') return aQty - bQty;
        return bQty - aQty;
      }
      
      return 0;
    });
    
    return sorted;
  }, [products, sortColumn, sortDirection]);

  const loadStock = async () => {
    try {
      setLoadingStock(new Set(products.map(p => p.id)));
      const res = await fetch("/api/inventory/stock", { cache: "no-store" });
      const data = await res.json().catch(() => ({ products: [] }));
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingStock(new Set());
    }
  };

  // Load product data from MongoDB first (without stock)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json().catch(() => []);
        const productsWithRkSku = (data || []).filter((p: any) => p.rk_sku);
        setProducts(productsWithRkSku.map((p: any) => ({ ...p, quantity: null, binLocation: null })));
        setLoading(false);
        // Then load stock data
        loadStock();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const lowStock = products.filter(p => (p.quantity ?? 0) < 10 && (p.quantity ?? 0) > 0);
  const outOfStock = products.filter(p => (p.quantity ?? 0) === 0);

  const handleSort = (column: 'name' | 'quantity') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Skeleton cell for quantity/bin location
  const SkeletonCell = () => (
    <div className="h-6 w-12 bg-neutral-200 rounded animate-pulse ml-auto" />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Inventory</h2>
          <p className="text-sm text-neutral-500 mt-1">Live stock from Unleashed (by rk_sku)</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); loadStock(); }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
        >
          {refreshing ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-sm font-medium text-neutral-500">Total Products</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{products.length}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <p className="text-sm font-medium text-amber-700">Low Stock</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{lowStock.length}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <p className="text-sm font-medium text-red-700">Out of Stock</p>
          <p className="mt-1 text-3xl font-bold text-red-900">{outOfStock.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">All Products</h3>
          {refreshing && <span className="text-xs text-neutral-500">Updating...</span>}
        </div>
        {loading && products.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <p>No products with rk_sku found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Product
                      {sortColumn === 'name' && (
                        <span className="text-neutral-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">RK SKU</th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      Quantity
                      {sortColumn === 'quantity' && (
                        <span className="text-neutral-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Bin Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <Package size={16} />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-neutral-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{product.sku || '-'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{product.rk_sku || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {refreshing ? (
                        <SkeletonCell />
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          (product.quantity ?? 0) === 0 
                            ? 'bg-red-100 text-red-700' 
                            : (product.quantity ?? 0) < 10
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {product.quantity === null ? 'N/A' : product.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {refreshing ? (
                        <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                      ) : (
                        product.binLocation || '-'
                      )}
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


function DiscountsSection() {
  const [discounts, setDiscounts] = useState<any[]>([
    { id: '1', code: 'WELCOME10', type: 'percentage', value: 10, usageCount: 45, status: 'active' },
    { id: '2', code: 'FREESHIP', type: 'shipping', value: 0, usageCount: 120, status: 'active' },
    { id: '3', code: 'SUMMER20', type: 'percentage', value: 20, usageCount: 0, status: 'scheduled' },
  ]);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Discounts</h2>
          <p className="text-sm text-neutral-500 mt-1">Create and manage discount codes</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Create Discount
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Type</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Value</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Used</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-neutral-400" />
                      <span className="font-mono text-sm font-semibold text-neutral-900">{discount.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600 capitalize">{discount.type}</td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-neutral-900">
                    {discount.type === 'percentage' ? `${discount.value}%` : discount.type === 'shipping' ? 'Free' : `AU$${discount.value}`}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-neutral-600">{discount.usageCount} times</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      discount.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      discount.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {discount.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LiveViewSection() {
  const [visitors, setVisitors] = useState(Math.floor(Math.random() * 20) + 5);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisitors(prev => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Live View</h2>
        <p className="text-sm text-neutral-500 mt-1">Real-time activity on your store</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-lg font-semibold text-neutral-900">{visitors} visitors right now</span>
          </div>
          
          <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
            <div className="text-center text-neutral-500">
              <Eye size={40} className="mx-auto mb-2 text-neutral-400" />
              <p className="text-sm">Live visitor map would appear here</p>
              <p className="text-xs text-neutral-400 mt-1">Showing real-time visitor locations</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Top Pages</h3>
            <div className="space-y-2">
              {[
                { page: '/products/all', visitors: 8 },
                { page: '/', visitors: 5 },
                { page: '/cart', visitors: 3 },
                { page: '/checkout', visitors: 2 },
              ].map((item) => (
                <div key={item.page} className="flex items-center justify-between py-2">
                  <span className="text-sm text-neutral-600 truncate">{item.page}</span>
                  <span className="text-sm font-medium text-neutral-900">{item.visitors}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Activity Feed</h3>
            <div className="space-y-3">
              {[
                { action: 'Product viewed', time: '2 min ago' },
                { action: 'Added to cart', time: '5 min ago' },
                { action: 'Checkout started', time: '8 min ago' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-neutral-700">{item.action}</span>
                  <span className="text-neutral-400 ml-auto">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
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
      label: "Shipping Settings",
      icon: Truck,
      onClick: () => router.push("/admin/shipping"),
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
};

// Rich text editor component (outside AdminProducts to prevent re-creation on each render)
const RichTextEditor = ({ value, onChange, placeholder, onPdfUpload }: { value: string, onChange: (value: string) => void, placeholder?: string, onPdfUpload?: (url: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success || data.url) {
        execCommand('insertImage', data.url);
      }
    } catch (err) {
      alert('Image upload failed');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are accepted');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success || data.url && onPdfUpload) {
        onPdfUpload(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload failed');
    }
  };

  // Only update innerHTML from props when it's not from internal input
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      editorRef.current.innerHTML = value;
    }
    isInternalUpdate.current = false;
  }, [value]);

  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-neutral-200 bg-neutral-50">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="px-3 py-1.5 text-sm font-semibold rounded hover:bg-neutral-200"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="px-3 py-1.5 text-sm italic rounded hover:bg-neutral-200"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="px-3 py-1.5 text-sm underline rounded hover:bg-neutral-200"
          title="Underline"
        >
          <u>U</u>
        </button>
        <div className="w-px bg-neutral-300 mx-1"></div>
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) execCommand('createLink', url);
          }}
          className="px-3 py-1.5 text-sm rounded hover:bg-neutral-200"
          title="Link"
        >
          🔗 Link
        </button>
        <label className="px-3 py-1.5 text-sm rounded hover:bg-neutral-200 cursor-pointer" title="Insert Image">
          📷 Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
        {onPdfUpload && (
          <label className="px-3 py-1.5 text-sm rounded hover:bg-neutral-200 cursor-pointer" title="Upload PDF">
            📄 PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfUpload}
            />
          </label>
        )}
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="px-3 py-1.5 text-sm rounded hover:bg-neutral-200"
          title="Clear Formatting"
        >
          🗑️ Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[150px] p-4 text-sm focus:outline-none"
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
};

function AdminProducts() {
  const { getProducts, setProducts, productImagePool, getSettings } = useStore();
  const router = useRouter();
  const [products, setProductsState] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingImageDeletions, setPendingImageDeletions] = useState(new Set<number>());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Track which images loaded successfully to filter out broken S3 images
  const [validImageIndices, setValidImageIndices] = useState<Set<number>>(new Set());
  // Toggle to show all images including broken ones (for cleanup)
  const [showAllImages, setShowAllImages] = useState(false);
  // Track which RK fields are editable
  const [editableRkSku, setEditableRkSku] = useState(false);
  const [editableRkUrl, setEditableRkUrl] = useState(false);
  // Spreadsheet view toggle
  const [spreadsheetView, setSpreadsheetView] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(25);
  const [settings, setSettings] = useState<any>({});

  // Sorting states
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load settings for calculations
  useEffect(() => {
    setSettings(getSettings() || {});
  }, [getSettings]);

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
        if (!cancelled) {
          setIsLoading(false);
          // Check if there's a pending edit product ID after loading
          const pendingEditId = localStorage.getItem('adminEditProductId');
          if (pendingEditId) {
            setEditingId(pendingEditId);
            setIsNewProduct(false);
            localStorage.removeItem('adminEditProductId');
          }
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [getProducts]);

  // Reset valid image indices when switching products, but keep track of checked status per product
  useEffect(() => {
    setValidImageIndices(new Set());
    setShowAllImages(false);
  }, [editingId]);

  // Listen for edit product requests from other admin sections
  useEffect(() => {
    const handleEditProduct = (e: CustomEvent) => {
      if (e.detail?.editProductId) {
        setEditingId(e.detail.editProductId);
        setIsNewProduct(false);
        // Clear from localStorage after using it
        localStorage.removeItem('adminEditProductId');
      }
    };
    window.addEventListener('switchAdminTab', handleEditProduct as EventListener);
    return () => window.removeEventListener('switchAdminTab', handleEditProduct as EventListener);
  }, []);

  const save = async () => {
    const currentProducts = [...products];
    const product = currentProducts.find((p) => p.id === editingId);
    if (!product) return;

    // Validate required fields
    if (!product.category) {
      alert('Please select a Category before saving.');
      return;
    }

    let updatedProduct = { ...product };

    if (pendingImageDeletions.size > 0) {
      const currentImages = product.images || (product.image ? [product.image] : []);
      const filteredImages = currentImages.filter((_, idx) => !pendingImageDeletions.has(idx));
      updatedProduct.images = filteredImages;
      updatedProduct.image = filteredImages[0] || "";
    }

    // Ensure comparePrice is explicitly set
    if (updatedProduct.comparePrice === undefined) {
      updatedProduct.comparePrice = 0;
    }

    const updatedProducts = currentProducts.map((p) =>
      p.id === editingId ? updatedProduct : p
    );

    // Update local state first
    setProductsState(updatedProducts);

    // Save to store context (MongoDB/JSON) - do this after state update
    setTimeout(() => {
      setProducts(updatedProducts);
    }, 0);

    activityLogger.action("product_saved", {
      productId: editingId,
      name: updatedProduct.name,
      sku: updatedProduct.sku || updatedProduct.rk_sku || '',
      category: updatedProduct.category || '',
      price: updatedProduct.price,
      inStock: updatedProduct.inStock,
    });
    setPendingImageDeletions(new Set());
    setSaved(true);
    setIsNewProduct(false);
    setEditingId(null);
    
    // Check if we should return to Categories & Brands
    const returnToCategories = localStorage.getItem('adminReturnToCategories');
    const returnTab = localStorage.getItem('adminReturnTab');
    if (returnToCategories === 'true') {
      localStorage.removeItem('adminReturnToCategories');
      // Keep the return tab info for the CategoriesBrandsSection to restore
      window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'categories' } }));
    }
    
    // Reload products from server to get fresh data
    try {
      const resp = await fetch("/api/products", { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (resp.ok && Array.isArray(data)) {
        setProductsState(data);
      }
    } catch (err) {
      console.error("Failed to reload products after save:", err);
    }
    
    setTimeout(() => setSaved(false), 3000);
  };

  const addNew = () => {
    const newId = String(Date.now());
    setProductsState((prev) => [
      ...prev,
      {
        id: newId,
        name: 'New Product',
        category: '',
        price: 0,
        comparePrice: 0,
        imageIndex: 0,
        image: '',
        description: '',
        inStock: true,
        brand: '',
        condition: 'Brand New',
        returns: 'No returns accepted',
        seller: 'AllRemotes (100% positive)',
        status: 'draft', // New products start as draft
      },
    ]);
    setEditingId(newId);
    setIsNewProduct(true);
  };

  const addNewCategory = (categoryName: string) => {
    // Create a temporary product with the new category to persist it to DB
    const tempId = `temp_${Date.now()}`;
    const tempProduct = {
      id: tempId,
      name: 'Temp Category Product',
      category: categoryName,
      price: 0,
      comparePrice: 0,
      image: '',
      description: '',
      inStock: false,
      brand: '',
      condition: 'Brand New',
      returns: '',
      seller: '',
      status: 'draft',
    };

    // Add to products state temporarily
    setProductsState((prev) => [...prev, tempProduct]);

    // Save to database
    setTimeout(() => {
      setProducts((prev) => [...prev, tempProduct]);
    }, 0);

    // Remove temp product after a delay
    setTimeout(() => {
      setProductsState((prev) => prev.filter((p) => p.id !== tempId));
      setProducts((prev) => prev.filter((p) => p.id !== tempId));
    }, 1000);
  };

  const publishProduct = (id: string) => {
    setProductsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'active' } : p))
    );
  };

  const unpublishProduct = (id: string) => {
    setProductsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'draft' } : p))
    );
  };

  const update = (id, field, value) => {
    setProductsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const remove = (id) => {
    if (window.confirm('Remove this product?')) {
      const updatedProducts = products.filter((p) => p.id !== id);
      setProductsState(updatedProducts);
      // Persist to backend
      setTimeout(() => {
        setProducts(updatedProducts);
      }, 0);
      if (editingId === id) setEditingId(null);
    }
  };

  const productForEdit = products.find((p) => p.id === editingId);

  // Get unique category values
  const categoryOptions = [...new Set(products.map((p: any) => p.category).filter(Boolean))].sort();

  // Filter products based on search, category, stock, and status
  const filteredProducts = products.filter((p: any) => {
    const query = searchQuery.toLowerCase();
    const searchableText = [
      p.name,
      p.title,
      p.sku,
      p.brand,
      p.id,
      p.description,
      p.seo_title,
      p.tags,
      p.features,
      p.compatibility,
      p.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = searchQuery === "" || searchableText.includes(query);
    
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    
    const matchesStock = stockFilter === "all" || 
      (stockFilter === "in_stock" && p.inStock !== false) ||
      (stockFilter === "out_of_stock" && p.inStock === false);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && (p.status === 'active' || !p.status)) ||
      (statusFilter === "draft" && p.status === 'draft') ||
      (statusFilter === "archived" && p.status === 'archived');
    
    return matchesSearch && matchesCategory && matchesStock && matchesStatus;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockFilter, statusFilter]);

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Apply sorting to filtered products
  const sortedProducts = React.useMemo(() => {
    if (!sortField) return filteredProducts;
    
    return [...filteredProducts].sort((a: any, b: any) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle undefined/null values
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';
      
      // Numeric sorting for price
      if (sortField === 'price') {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String sorting for other fields
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);
  const showingFrom = sortedProducts.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + productsPerPage, sortedProducts.length);

  // Count products by status
  const statusCounts = {
    all: products.length,
    active: products.filter((p: any) => p.status === 'active' || !p.status).length,
    draft: products.filter((p: any) => p.status === 'draft').length,
    archived: products.filter((p: any) => p.status === 'archived').length,
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your product catalog and inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          {!editingId && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-all hover:bg-neutral-50"
              onClick={() => setSpreadsheetView(!spreadsheetView)}
            >
              <span>{spreadsheetView ? "📋" : "📊"}</span>
              {spreadsheetView ? "Table View" : "Spreadsheet View"}
            </button>
          )}
          {!editingId && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-200 transition-all hover:bg-neutral-50"
              onClick={addNew}
            >
              <span>➕</span> Add Product
            </button>
          )}
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

      {/* Filters Section */}
      {!productForEdit && (
        <div className="mb-6 space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 border-b border-neutral-200">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'draft', label: 'Draft' },
              { id: 'archived', label: 'Archived' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  statusFilter === tab.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {statusCounts[tab.id as keyof typeof statusCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, brand, description, tags, features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((cat: string) => (
                    <option key={cat} value={cat}>{cat === 'garage' ? 'Garage & Gate' : cat}</option>
                  ))}
                </select>
              </div>

              {/* Stock Filter */}
              <div className="w-full lg:w-40">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full h-10 px-3 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchQuery || categoryFilter !== "all" || stockFilter !== "all" || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setStockFilter("all");
                    setStatusFilter("all");
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>

            {/* Filter Results Summary */}
            <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-neutral-500">
                  Showing <span className="font-semibold text-neutral-900">{showingFrom}-{showingTo}</span> of{" "}
                  <span className="font-semibold text-neutral-900">{filteredProducts.length}</span> products
                  {filteredProducts.length !== products.length && (
                    <span className="ml-2 text-amber-600 font-medium">
                      ({products.length - filteredProducts.length} hidden by filters)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-neutral-500">Per page:</label>
                <select
                  value={productsPerPage}
                  onChange={(e) => {
                    setProductsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 py-1 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {productForEdit ? (
        <div className="animate-in fade-in duration-300">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  // Remove new unsaved product from state
                  if (isNewProduct) {
                    setProductsState((prev) => prev.filter((p) => p.id !== editingId));
                  }
                  setEditingId(null);
                  setPendingImageDeletions(new Set());
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                  setPreviewImage(null);
                  setIsNewProduct(false);
                  setEditableRkSku(false);
                  setEditableRkUrl(false);
                  
                  // Check if we should return to Categories & Brands
                  const returnToCategories = localStorage.getItem('adminReturnToCategories');
                  if (returnToCategories === 'true') {
                    localStorage.removeItem('adminReturnToCategories');
                    // Keep adminReturnTab and selected brand/category for restoration
                    window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'categories' } }));
                  }
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{productForEdit.name || 'New Product'}</h1>
                <p className="text-sm text-neutral-500">
                  Product ID: {productForEdit.id}
                  {productForEdit.sku && (
                    <span className="ml-3 text-neutral-700 font-medium">SKU: {productForEdit.sku}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  // Remove new unsaved product from state
                  if (isNewProduct) {
                    setProductsState((prev) => prev.filter((p) => p.id !== editingId));
                  }
                  setEditingId(null);
                  setPendingImageDeletions(new Set());
                  setDraggedIndex(null);
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                  setPreviewImage(null);
                  setIsNewProduct(false);
                  setEditableRkSku(false);
                  setEditableRkUrl(false);
                  
                  // Check if we should return to Categories & Brands
                  const returnToCategories = localStorage.getItem('adminReturnToCategories');
                  if (returnToCategories === 'true') {
                    localStorage.removeItem('adminReturnToCategories');
                    // Keep adminReturnTab and selected brand/category for restoration
                    window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'categories' } }));
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={productForEdit.name || productForEdit.title || ''}
                        onChange={(e) => update(productForEdit.id, "name", e.target.value)}
                        placeholder="Short sleeve t-shirt"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">SKU</label>
                      <input
                        type="text"
                        value={productForEdit.sku || ''}
                        onChange={(e) => update(productForEdit.id, "sku", e.target.value)}
                        placeholder="SKU-123"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">RK_SKU</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={productForEdit.rk_sku || ''}
                          onChange={(e) => update(productForEdit.id, "rk_sku", e.target.value)}
                          placeholder="Remote King SKU"
                          readOnly={!editableRkSku}
                          className={`w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pr-10 ${!editableRkSku ? 'bg-neutral-50 text-neutral-600' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setEditableRkSku(!editableRkSku)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                          title={editableRkSku ? 'Lock' : 'Edit'}
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">RK_URL</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={productForEdit.rk_url || ''}
                          onChange={(e) => update(productForEdit.id, "rk_url", e.target.value)}
                          placeholder="https://..."
                          readOnly={!editableRkUrl}
                          className={`w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pr-10 ${!editableRkUrl ? 'bg-neutral-50 text-neutral-600' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setEditableRkUrl(!editableRkUrl)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                          title={editableRkUrl ? 'Lock' : 'Edit'}
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Frequency MHz</label>
                      <input
                        type="text"
                        value={productForEdit.frequency_mhz || ''}
                        onChange={(e) => update(productForEdit.id, "frequency_mhz", e.target.value)}
                        placeholder="433.92"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Buttons</label>
                      <input
                        type="text"
                        value={productForEdit.buttons || ''}
                        onChange={(e) => update(productForEdit.id, "buttons", e.target.value)}
                        placeholder="2, 4"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Compatibility</label>
                    <input
                      type="text"
                      value={productForEdit.compatibility || ''}
                      onChange={(e) => update(productForEdit.id, "compatibility", e.target.value)}
                      placeholder="Compatible with..."
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Condition</label>
                    <select
                      value={productForEdit.condition || 'Brand New'}
                      onChange={(e) => update(productForEdit.id, "condition", e.target.value)}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Refurbished">Refurbished</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">SEO Title</label>
                    <input
                      type="text"
                      value={productForEdit.seo_title || ''}
                      onChange={(e) => update(productForEdit.id, "seo_title", e.target.value)}
                      placeholder="SEO optimized title"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Description</label>
                    <RichTextEditor
                      value={productForEdit.description || ''}
                      onChange={(value) => update(productForEdit.id, "description", value)}
                      placeholder="Add a detailed description of your product..."
                      onPdfUpload={(url) => update(productForEdit.id, "descriptionPdf", url)}
                    />
                    {productForEdit.descriptionPdf && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <a
                          href={productForEdit.descriptionPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          📄 {productForEdit.descriptionPdf.split('/').pop()}
                        </a>
                        <button
                          type="button"
                          onClick={() => update(productForEdit.id, "descriptionPdf", "")}
                          className="text-red-500 hover:text-red-700"
                          title="Remove PDF"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Instructions</label>
                    <RichTextEditor
                      value={productForEdit.instructions || ''}
                      onChange={(value) => update(productForEdit.id, "instructions", value)}
                      placeholder="Add instructions for using this product..."
                      onPdfUpload={(url) => update(productForEdit.id, "instructionsPdf", url)}
                    />
                    {productForEdit.instructionsPdf && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <a
                          href={productForEdit.instructionsPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          📄 {productForEdit.instructionsPdf.split('/').pop()}
                        </a>
                        <button
                          type="button"
                          onClick={() => update(productForEdit.id, "instructionsPdf", "")}
                          className="text-red-500 hover:text-red-700"
                          title="Remove PDF"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Features</label>
                    <RichTextEditor
                      value={productForEdit.features || productForEdit.feature || ''}
                      onChange={(value) => update(productForEdit.id, "features", value)}
                      placeholder="Add product features..."
                      onPdfUpload={(url) => update(productForEdit.id, "featuresPdf", url)}
                    />
                    {(productForEdit.featuresPdf || productForEdit.featurePdf) && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <a
                          href={productForEdit.featuresPdf || productForEdit.featurePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          📄 {(productForEdit.featuresPdf || productForEdit.featurePdf).split('/').pop()}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            update(productForEdit.id, "featuresPdf", "");
                            update(productForEdit.id, "featurePdf", "");
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Remove PDF"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Specification</label>
                    <RichTextEditor
                      value={productForEdit.specification || ''}
                      onChange={(value) => update(productForEdit.id, "specification", value)}
                      placeholder="Add product specifications..."
                      onPdfUpload={(url) => update(productForEdit.id, "specificationPdf", url)}
                    />
                    {productForEdit.specificationPdf && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <a
                          href={productForEdit.specificationPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          📄 {productForEdit.specificationPdf.split('/').pop()}
                        </a>
                        <button
                          type="button"
                          onClick={() => update(productForEdit.id, "specificationPdf", "")}
                          className="text-red-500 hover:text-red-700"
                          title="Remove PDF"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Compatibility</label>
                    <RichTextEditor
                      value={productForEdit.compatibility || ''}
                      onChange={(value) => update(productForEdit.id, "compatibility", value)}
                      placeholder="Add compatibility information..."
                      onPdfUpload={(url) => update(productForEdit.id, "compatibilityPdf", url)}
                    />
                    {productForEdit.compatibilityPdf && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <a
                          href={productForEdit.compatibilityPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          📄 {productForEdit.compatibilityPdf.split('/').pop()}
                        </a>
                        <button
                          type="button"
                          onClick={() => update(productForEdit.id, "compatibilityPdf", "")}
                          className="text-red-500 hover:text-red-700"
                          title="Remove PDF"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Media Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-900">Media</h3>
                  <button
                    type="button"
                    onClick={() => setShowAllImages(!showAllImages)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      showAllImages 
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {showAllImages ? '⚠️ Showing All (Including Broken)' : '✓ Showing Valid Only'}
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {/* Images Gallery - filter broken images unless showAllImages is enabled */}
                    {(productForEdit.images || (productForEdit.image ? [productForEdit.image] : []))
                      .map((img: string, idx: number) => {
                        // An image is broken if explicitly marked as failed (negative index in set)
                        // An image is valid if explicitly marked as loaded successfully
                        const isBroken = validImageIndices.has(-idx - 1);
                        const isValid = validImageIndices.has(idx);
                        // Show image if: showAllImages is on, or image is valid, or image hasn't been checked yet (!isValid && !isBroken)
                        const shouldShow = showAllImages || isValid || (!isValid && !isBroken);
                        return { img, idx, isBroken, isValid, shouldShow };
                      })
                      .filter(({ shouldShow }) => shouldShow)
                      .map(({ img, idx, isBroken, isValid }, displayIdx) => {
                        const isDragging = draggedIndex === idx;
                        const isDragOver = dragOverIndex === idx;
                        return (
                        <div
                          key={idx + '-' + img}
                          draggable={!isBroken}
                          onDragStart={() => setDraggedIndex(idx)}
                          onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                          onDragOver={(e) => { e.preventDefault(); if (!isBroken) setDragOverIndex(idx); }}
                          onDragLeave={() => setDragOverIndex(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (isBroken || draggedIndex === null || draggedIndex === idx) { setDragOverIndex(null); setDraggedIndex(null); return; }
                            const currentImages = [...(productForEdit.images || (productForEdit.image ? [productForEdit.image] : []))];
                            const [moved] = currentImages.splice(draggedIndex, 1);
                            currentImages.splice(idx, 0, moved);
                            update(productForEdit.id, "images", currentImages);
                            update(productForEdit.id, "image", currentImages[0] || "");
                            // Remap pending deletions indices
                            const newDeletions = new Set<number>();
                            pendingImageDeletions.forEach((dIdx) => {
                              if (dIdx === draggedIndex) newDeletions.add(idx);
                              else if (dIdx > draggedIndex && dIdx <= idx) newDeletions.add(dIdx - 1);
                              else if (dIdx < draggedIndex && dIdx >= idx) newDeletions.add(dIdx + 1);
                              else newDeletions.add(dIdx);
                            });
                            setPendingImageDeletions(newDeletions);
                            setDragOverIndex(null);
                            setDraggedIndex(null);
                          }}
                          className={`relative group aspect-square rounded-lg border-2 overflow-hidden ${
                            isBroken 
                              ? 'bg-red-50 border-red-300 cursor-not-allowed' 
                              : 'bg-neutral-50 border-neutral-300 cursor-move'
                          } ${
                            pendingImageDeletions.has(idx) ? 'border-rose-500 opacity-50' : ''
                          } ${isDragging ? 'opacity-30' : ''} ${isDragOver ? 'ring-2 ring-emerald-500 border-emerald-400' : ''}`}
                        >
                          {/* Broken Image Placeholder */}
                          {isBroken && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><path d="m3 3 18 18"/></svg>
                              <span className="text-xs mt-1">Image not found</span>
                            </div>
                          )}
                          <img
                            src={img}
                            alt={`Product ${displayIdx + 1}`}
                            className={`w-full h-full object-contain p-2 pointer-events-none transition-opacity duration-300 ${isBroken ? 'opacity-0' : 'opacity-100'}`}
                            draggable={false}
                            onLoad={() => {
                              setValidImageIndices(prev => new Set([...prev, idx]));
                            }}
                            onError={() => {
                              // Image failed to load - mark as broken using negative index
                              setValidImageIndices(prev => new Set([...prev, -idx - 1]));
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPreviewImage(img); }}
                              className="p-2 bg-white rounded-lg text-blue-600 hover:bg-blue-50"
                              title="Preview"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                            </button>
                            {displayIdx === 0 && !pendingImageDeletions.has(idx) && (
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-white rounded-lg text-neutral-600 hover:bg-neutral-50"
                                title="Main image"
                              >
                                <span className="text-xs font-medium">Main</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newDeletions = new Set(pendingImageDeletions);
                                if (newDeletions.has(idx)) {
                                  newDeletions.delete(idx);
                                } else {
                                  newDeletions.add(idx);
                                }
                                setPendingImageDeletions(newDeletions);
                              }}
                              className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50"
                              title={pendingImageDeletions.has(idx) ? "Undo delete" : "Delete"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <span className={`absolute top-2 left-2 px-2 py-0.5 text-white text-xs font-medium rounded ${
                            pendingImageDeletions.has(idx) ? 'bg-rose-500' : isBroken ? 'bg-red-500' : (displayIdx === 0 ? 'bg-emerald-500' : 'bg-neutral-600')
                          }`}>
                            {pendingImageDeletions.has(idx) ? 'Pending Delete' : isBroken ? 'Broken' : (displayIdx === 0 ? 'Main' : `#${displayIdx + 1}`)}
                          </span>
                          {/* Drag hint */}
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-70 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                          </div>
                        </div>
                      );
                    })}

                    {/* Upload Area */}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-emerald-600">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          
                          const currentImages = [...(productForEdit.images || (productForEdit.image ? [productForEdit.image] : []))];
                          
                          for (const file of files) {
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('productId', productForEdit.id);
                              
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData,
                              });
                              const data = await res.json();
                              
                              if (data.url) {
                                currentImages.push(data.url);
                              }
                            } catch (err) {
                              console.error('Upload failed:', err);
                              // Fallback: use data URL for preview
                              await new Promise<void>((resolve) => {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    currentImages.push(ev.target.result as string);
                                  }
                                  resolve();
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                          }
                          
                          update(productForEdit.id, "images", currentImages);
                          update(productForEdit.id, "image", currentImages[0] || "");
                        }}
                      />
                      <Upload size={24} />
                      <span className="text-xs font-medium">Add images</span>
                    </label>
                  </div>

                  {/* Image URL Input */}
                  <div className="pt-4 border-t border-neutral-100">
                    <label className="block text-sm font-medium text-neutral-600 mb-2">Or add image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value) {
                              const currentImages = productForEdit.images || (productForEdit.image ? [productForEdit.image] : []);
                              const newImages = [...currentImages, input.value];
                              update(productForEdit.id, "images", newImages);
                              update(productForEdit.id, "image", newImages[0] || "");
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value) {
                            const currentImages = productForEdit.images || (productForEdit.image ? [productForEdit.image] : []);
                            const newImages = [...currentImages, input.value];
                            update(productForEdit.id, "images", newImages);
                            update(productForEdit.id, "image", newImages[0] || "");
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-900">Pricing</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Actual Price (selling price)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={productForEdit.price || ''}
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || 0;
                            update(productForEdit.id, "price", price);
                            // Auto-calculate comparePrice based on member discount
                            const discount = (settings.memberDiscountRate ?? 10) / 100;
                            const comparePrice = price * (1 - discount);
                            update(productForEdit.id, "comparePrice", parseFloat(comparePrice.toFixed(2)));
                          }}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        After Trade Discount Price
                        <span className="text-xs font-normal text-neutral-500 ml-1">
                          ({settings.memberDiscountRate ?? 10}% off)
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={(() => {
                            const price = productForEdit.price || 0;
                            const discount = (settings.memberDiscountRate ?? 10) / 100;
                            const discountedPrice = price * (1 - discount);
                            return discountedPrice > 0 ? discountedPrice.toFixed(2) : '';
                          })()}
                          readOnly
                          className="w-full pl-8 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-600 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Auto-calculated: Price - {(settings.memberDiscountRate ?? 10)}% member discount
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-900">Inventory</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">SKU (Stock Keeping Unit)</label>
                      <input
                        type="text"
                        value={productForEdit.sku || ''}
                        onChange={(e) => update(productForEdit.id, "sku", e.target.value)}
                        placeholder="SKU-001"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        value={productForEdit.stock || productForEdit.quantity || ''}
                        onChange={(e) => update(productForEdit.id, "stock", parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForEdit.inStock !== false}
                        onChange={(e) => update(productForEdit.id, "inStock", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <span className="text-sm font-medium text-neutral-700">Track quantity</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-900">Status</h3>
                </div>
                <div className="p-6">
                  <select
                    value={productForEdit.status || ''}
                    onChange={(e) => update(productForEdit.id, "status", e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Select status...</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Organization Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-900">Organization</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Category *</label>
                    <div className="flex gap-2">
                      <select
                        value={productForEdit.category || ''}
                        onChange={(e) => update(productForEdit.id, "category", e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="">Select category</option>
                        {categoryOptions.map((cat: string) => (
                          <option key={cat} value={cat}>{cat === 'garage' ? 'Garage & Gate' : cat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const newCategory = prompt('Enter new Category:');
                          if (newCategory && newCategory.trim()) {
                            const trimmedCategory = newCategory.trim();
                            update(productForEdit.id, "category", trimmedCategory);
                            addNewCategory(trimmedCategory);
                          }
                        }}
                        className="px-3 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                        title="Add new category"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Brand</label>
                    <input
                      type="text"
                      value={productForEdit.brand || ''}
                      onChange={(e) => update(productForEdit.id, "brand", e.target.value)}
                      placeholder="Enter brand name"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Tags</label>
                    <input
                      type="text"
                      value={productForEdit.tags || ''}
                      onChange={(e) => update(productForEdit.id, "tags", e.target.value)}
                      placeholder="remote, garage, wireless"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <p className="mt-1 text-xs text-neutral-500">Separate tags with commas</p>
                  </div>
                </div>
              </div>

              {/* Product Details Card */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-900">Product Details</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Condition</label>
                    <select
                      value={productForEdit.condition || 'Brand New'}
                      onChange={(e) => update(productForEdit.id, "condition", e.target.value)}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Refurbished">Refurbished</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Returns</label>
                    <input
                      type="text"
                      value={productForEdit.returns || ''}
                      onChange={(e) => update(productForEdit.id, "returns", e.target.value)}
                      placeholder="No returns accepted"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Warranty</label>
                    <input
                      type="text"
                      value={productForEdit.warranty || ''}
                      onChange={(e) => update(productForEdit.id, "warranty", e.target.value)}
                      placeholder="12 months"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : spreadsheetView ? (
        <ProductSpreadsheet onBack={() => setSpreadsheetView(false)} readOnly={false} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-700">
              {filteredProducts.length === products.length ? 'All Products' : 'Filtered Products'}
            </h3>
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-600">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
          {isLoading ? (
            <div className="flex h-56 items-center justify-center text-sm font-medium text-neutral-500">
              <div className="mr-2 spinner" />
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-500">
              {products.length === 0 ? 'No products found. Add your first product!' : 'No products match your filters. Try adjusting your search criteria.'}
            </div>
          ) : (
            <>
              <div className="divide-y divide-neutral-100 lg:hidden">
                {paginatedProducts.map((p) => (
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
                          <span className="inline-block max-w-[100px] font-medium text-neutral-700 leading-tight line-clamp-1">
                            {p.category || '-'}
                          </span>
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

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50 hover:text-primary-dark"
                        onClick={() => setEditingId(p.id)}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 shadow-sm transition-colors hover:bg-rose-100"
                        onClick={() => remove(p.id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
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
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer hover:text-neutral-700 select-none"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortField === 'name' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="w-28 px-6 py-4 font-semibold cursor-pointer hover:text-neutral-700 select-none"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center gap-1">
                          Category
                          {sortField === 'category' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="w-24 px-6 py-4 font-semibold">SKU</th>
                      <th className="w-24 px-6 py-4 font-semibold">RK_SKU</th>
                      <th 
                        className="w-28 px-6 py-4 font-semibold cursor-pointer hover:text-neutral-700 select-none"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center gap-1">
                          Price
                          {sortField === 'price' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="w-32 px-6 py-4 font-semibold text-center cursor-pointer hover:text-neutral-700 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Status
                          {sortField === 'status' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="w-32 px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedProducts.map((p) => (
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
                            <span className="font-medium text-neutral-700">ID:</span>
                            <span className="font-mono text-[11px] uppercase text-neutral-800">{p.id.slice(-6)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="inline-block max-w-[120px] rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 leading-tight line-clamp-2">
                            {p.category ? (p.category === 'garage' ? 'Garage & Gate' : p.category) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          {p.id ? (
                            <a
                              href={`/product/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {p.sku || p.id}
                            </a>
                          ) : (
                            <span className="font-mono text-xs text-neutral-700">{p.sku || '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          {p.rk_sku && p.rk_url ? (
                            <a
                              href={p.rk_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {p.rk_sku}
                            </a>
                          ) : (
                            <span className="font-mono text-xs text-neutral-700">{p.rk_sku || '-'}</span>
                          )}
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
                              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50 hover:text-primary-dark"
                              onClick={() => setEditingId(p.id)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 shadow-sm transition-colors hover:bg-rose-100"
                              onClick={() => remove(p.id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-neutral-600">
                    Page <span className="font-semibold text-neutral-900">{currentPage}</span> of{" "}
                    <span className="font-semibold text-neutral-900">{totalPages}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-lg hover:bg-neutral-100"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
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
      activityLogger.action("home_content_saved");
    } catch (err: any) {
      activityLogger.error("home_content_save_failed", { error: err?.message });
      setSaveError(err?.message || "Failed to save home content");
    }
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset all home content to default values? This cannot be undone.')) {
                setContent({
                  heroImages: ["/images/3.jpg", "/images/1.jpg", "/images/5.png", "/images/2.jpg", "/images/6.png", "/images/4.png", "/images/7.png", "/images/8.png", "/images/9.png", "/images/10.png"],
                  hero: {
                    title: "Garage Door & Gate Remotes",
                    subtitle: "Quality is Guaranteed",
                    description: "Your trusted source for premium car and garage remotes. Browse reliable replacements, accessories, and business-ready service support.",
                    primaryCta: "Shop Car Remotes",
                    primaryCtaPath: "/products/car",
                    secondaryCta: "Shop Garage Remotes",
                    secondaryCtaPath: "/products/garage",
                  },
                  features: [],
                  whyBuy: [],
                  ctaSection: {
                    title: "Ready to upgrade your remote?",
                    description: "Browse our complete catalog of automotive and garage remotes.",
                    buttonText: "Shop All Products",
                    buttonPath: "/products/all",
                  },
                });
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
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

        <div className="p-6 space-y-8">
          {/* TEXT CONTENT SECTION */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">Text Content</h4>
            <div className="grid gap-4">
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={content.hero?.title || ""}
                onChange={(e) => update("hero.title", e.target.value)}
                placeholder="Main headline..."
              />
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={content.hero?.subtitle || ""}
                onChange={(e) => update("hero.subtitle", e.target.value)}
                placeholder="Subtitle..."
              />
              <textarea
                className="min-h-[80px] w-full resize-y rounded-lg border border-neutral-300 bg-white p-3 text-sm leading-relaxed text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={content.hero?.description || ""}
                onChange={(e) => update("hero.description", e.target.value)}
                placeholder="Description shown below subtitle..."
              />
            </div>
          </div>

          {/* PRIMARY BUTTON SECTION */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">Primary Button</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={content.hero?.primaryCta || ""}
                onChange={(e) => update("hero.primaryCta", e.target.value)}
                placeholder="Button text..."
              />
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-500 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={content.hero?.primaryCtaPath || ""}
                onChange={(e) => update("hero.primaryCtaPath", e.target.value)}
                placeholder="/products/path"
              />
            </div>
          </div>

          {/* SECONDARY BUTTON SECTION */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">Secondary Button</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={content.hero?.secondaryCta || ""}
                onChange={(e) => update("hero.secondaryCta", e.target.value)}
                placeholder="Button text..."
              />
              <input
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm tracking-wide text-neutral-500 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={content.hero?.secondaryCtaPath || ""}
                onChange={(e) => update("hero.secondaryCtaPath", e.target.value)}
                placeholder="/products/path"
              />
            </div>
          </div>

          {/* CAROUSEL IMAGES - SIMPLIFIED */}
          <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-neutral-900">Carousel Images</label>
                <p className="text-xs text-neutral-500">Images rotate every 6 seconds</p>
              </div>
              <button
                type="button"
                onClick={addHeroImage}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            <div className="space-y-3">
              {(content.heroImages || []).map((img: string, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                    {img ? (
                      <img src={img} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-neutral-400">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={img || ""}
                      onChange={(e) => updateHeroImage(i, e.target.value)}
                      placeholder="/images/photo.jpg or https://..."
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (i > 0) {
                          const newImages = [...(content.heroImages || [])];
                          [newImages[i], newImages[i - 1]] = [newImages[i - 1], newImages[i]];
                          setContent((prev) => ({ ...prev, heroImages: newImages }));
                        }
                      }}
                      disabled={i === 0}
                      className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                      title="Move up"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (i < (content.heroImages || []).length - 1) {
                          const newImages = [...(content.heroImages || [])];
                          [newImages[i], newImages[i + 1]] = [newImages[i + 1], newImages[i]];
                          setContent((prev) => ({ ...prev, heroImages: newImages }));
                        }
                      }}
                      disabled={i === (content.heroImages || []).length - 1}
                      className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                      title="Move down"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHeroImage(i)}
                      className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {(!content.heroImages || content.heroImages.length === 0) && (
                <div className="rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center">
                  <p className="text-sm text-neutral-500">No carousel images. Click "Add" to start.</p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">
                <strong>Tip:</strong> Use local paths like <code className="bg-amber-100 px-1 rounded">/images/1.jpg</code> or full S3 URLs. 
                Images should be 16:9 ratio (1920×1080) for best results.
              </p>
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
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                    onClick={() => {
                      if (i > 0) {
                        const newFeatures = [...(content.features || [])];
                        [newFeatures[i], newFeatures[i - 1]] = [newFeatures[i - 1], newFeatures[i]];
                        setContent((prev) => ({ ...prev, features: newFeatures }));
                      }
                    }}
                    disabled={i === 0}
                    title="Move up"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                    onClick={() => {
                      if (i < (content.features || []).length - 1) {
                        const newFeatures = [...(content.features || [])];
                        [newFeatures[i], newFeatures[i + 1]] = [newFeatures[i + 1], newFeatures[i]];
                        setContent((prev) => ({ ...prev, features: newFeatures }));
                      }
                    }}
                    disabled={i === (content.features || []).length - 1}
                    title="Move down"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                    onClick={() => removeFeature(i)}
                    aria-label={`Remove feature ${i + 1}`}
                    title="Remove feature"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                    onClick={() => {
                      if (i > 0) {
                        const newWhyBuy = [...(content.whyBuy || [])];
                        [newWhyBuy[i], newWhyBuy[i - 1]] = [newWhyBuy[i - 1], newWhyBuy[i]];
                        setContent((prev) => ({ ...prev, whyBuy: newWhyBuy }));
                      }
                    }}
                    disabled={i === 0}
                    title="Move up"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                    onClick={() => {
                      if (i < (content.whyBuy || []).length - 1) {
                        const newWhyBuy = [...(content.whyBuy || [])];
                        [newWhyBuy[i], newWhyBuy[i + 1]] = [newWhyBuy[i + 1], newWhyBuy[i]];
                        setContent((prev) => ({ ...prev, whyBuy: newWhyBuy }));
                      }
                    }}
                    disabled={i === (content.whyBuy || []).length - 1}
                    title="Move down"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                    onClick={() => removeWhyBuy(i)}
                    aria-label={`Remove reason ${i + 1}`}
                    title="Remove reason"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
      activityLogger.action("navigation_saved");
    } catch (err: any) {
      activityLogger.error("navigation_save_failed", { error: err?.message });
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
        activityLogger.action("review_deleted", { reviewId: id });
      } catch (err: any) {
        activityLogger.error("review_delete_failed", { error: err?.message });
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
      activityLogger.action("reviews_saved", { count: reviews?.length });
    } catch (err: any) {
      activityLogger.error("reviews_save_failed", { error: err?.message });
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
      activityLogger.action("promotions_saved");
    } catch (err: any) {
      activityLogger.error("promotions_save_failed", { error: err?.message });
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'customer' });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        const result = await response.json();

        if (result.success && result.users) {
          const normalizedUsers = result.users.map((u: any) => ({
            id: u._id || u.id,
            name: u.name,
            email: u.email,
            role: u.role || 'customer',
            status: u.status || 'active',
            provider: u.provider || 'email',
            emailVerified: u.emailVerified || false,
            createdAt: u.createdAt || '',
            joined: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '—',
          }));
          setUsers(normalizedUsers);
        } else {
          setError('Failed to load users');
        }
      } catch (err) {
        setError('Error fetching users');
        console.error('Fetch users error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
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
      setUsers([...users, row]);
      setNewUser({ name: '', email: '', password: '', role: 'customer' });
      setShowAddUser(false);
    }
  };

  const toggleUserStatus = (userId) => {
    // TODO: Add API endpoint to update user status
    const next = users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    );
    setUsers(next);
  };

  const deleteUser = (userId) => {
    // TODO: Add API endpoint to delete user
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
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

      {loading && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm mb-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading users from database...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm mb-6">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm mb-6 text-center">
          <p className="text-neutral-600">No users found in database.</p>
        </div>
      )}

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

      {!loading && users.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50/80 text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Provider</th>
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
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${user.provider === 'google' ? 'bg-orange-100 text-orange-800' : user.provider === 'apple' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                        {user.provider || 'email'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{user.joined}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={user.role === 'admin'}
                        >
                          {user.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => deleteUser(user.id)}
                          disabled={user.role === 'admin'}
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
      )}

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
      activityLogger.action("settings_saved");
    } catch (err: any) {
      activityLogger.error("settings_save_failed", { error: err?.message });
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

      activityLogger.action("admin_data_reset");
      window.location.href = "/";
    } catch (err: any) {
      activityLogger.error("admin_data_reset_failed", { error: err?.message });
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
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-700 block mb-1">Member Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={settings.memberDiscountRate ?? 10}
                  onChange={(e) => updateSetting('memberDiscountRate', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                />
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

            <label className="group flex cursor-pointer items-start gap-4 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <div className="pt-1">
                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={settings.emailsEnabled !== false}
                    onChange={(e) => updateSetting('emailsEnabled', e.target.checked)}
                  />
                  <span className={`pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out ${settings.emailsEnabled !== false ? 'bg-primary' : 'bg-neutral-200'}`} />
                  <span className={`pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-neutral-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${settings.emailsEnabled !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-semibold text-neutral-900">Enable Email Sending</span>
                <span className="text-neutral-500">
                  {settings.emailsEnabled !== false
                    ? "Emails are currently being sent (order confirmations, abandoned carts, etc)."
                    : "⚠️ All outgoing emails are disabled. No order confirmations or notifications will be sent."}
                </span>
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

// Categories & Brands Management Section
// Helper to format category display names
const getCategoryDisplayName = (category: string): string => {
  const displayNames: Record<string, string> = {
    'garage': 'Garage & Gate',
    'car': 'Car Remotes',
    'home': 'For The Home',
    'locksmith': 'Locksmithing',
    'Uncategorized': 'Uncategorized',
  };
  return displayNames[category] || category;
};

function CategoriesBrandsSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  
  // Category management
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  
  // Brand management
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [editBrandName, setEditBrandName] = useState('');
  const [brandImageUploading, setBrandImageUploading] = useState<string | null>(null);
  
  // Product viewing state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [showProductsPanel, setShowProductsPanel] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const resp = await fetch('/api/products', { cache: 'no-store' });
      const data = await resp.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
      
      // Restore state if returning from product edit
      const returnTab = localStorage.getItem('adminReturnTab');
      const returnBrand = localStorage.getItem('adminReturnSelectedBrand');
      const returnCategory = localStorage.getItem('adminReturnSelectedCategory');
      
      if (returnTab) {
        // Small delay to ensure products are loaded
        setTimeout(() => {
          setActiveTab(returnTab as 'categories' | 'brands');
          
          if (returnBrand) {
            setSelectedBrand(returnBrand);
            setShowProductsPanel(true);
          } else if (returnCategory) {
            setSelectedCategory(returnCategory);
            setShowProductsPanel(true);
          }
          
          // Clear the stored values
          localStorage.removeItem('adminReturnTab');
          localStorage.removeItem('adminReturnSelectedBrand');
          localStorage.removeItem('adminReturnSelectedCategory');
        }, 100);
      }
    }
  };

  // Calculate category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  // Calculate brand stats
  const brandStats = useMemo(() => {
    const stats: Record<string, { count: number; image?: string }> = {};
    products.forEach(p => {
      const brand = p.brand || 'Unknown';
      if (!stats[brand]) {
        stats[brand] = { count: 0, image: p.brandImage };
      }
      stats[brand].count += 1;
    });
    return Object.entries(stats).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);
  
  // Get products for selected category
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);
  
  // Get products for selected brand
  const brandProducts = useMemo(() => {
    if (!selectedBrand) return [];
    return products.filter(p => p.brand === selectedBrand);
  }, [products, selectedBrand]);
  
  // Handle viewing category products
  const handleViewCategoryProducts = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedBrand(null);
    setShowProductsPanel(true);
  };
  
  // Handle viewing brand products
  const handleViewBrandProducts = (brandName: string) => {
    setSelectedBrand(brandName);
    setSelectedCategory(null);
    setShowProductsPanel(true);
  };
  
  // Close products panel
  const handleCloseProductsPanel = () => {
    setShowProductsPanel(false);
    setSelectedCategory(null);
    setSelectedBrand(null);
  };

  // Category operations
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    // Create a temporary product to establish the category
    const tempProduct = {
      id: `temp_cat_${Date.now()}`,
      name: 'Category Placeholder',
      category: newCategoryName.trim(),
      price: 0,
      inStock: false,
      status: 'draft'
    };
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: [tempProduct] })
      });
      setNewCategoryName('');
      fetchProducts();
      activityLogger.action('category_added', { name: newCategoryName.trim() });
    } catch (err) {
      activityLogger.error('category_add_failed', { name: newCategoryName.trim() });
      alert('Failed to add category');
    }
  };

  const handleEditCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingCategory(null);
      return;
    }
    // Update all products with this category
    const productsToUpdate = products.filter(p => p.category === oldName);
    if (productsToUpdate.length === 0) {
      setEditingCategory(null);
      return;
    }
    const updated = productsToUpdate.map(p => ({ ...p, category: newName.trim() }));
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updated })
      });
      setEditingCategory(null);
      fetchProducts();
      activityLogger.action('category_renamed', { from: oldName, to: newName.trim() });
    } catch (err) {
      activityLogger.error('category_rename_failed', { from: oldName, to: newName.trim() });
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const productCount = categoryStats.find(([name]) => name === categoryName)?.[1] || 0;
    if (productCount > 0) {
      alert(`Cannot delete "${categoryName}" - it has ${productCount} products. Move or delete those products first.`);
      return;
    }
    // Delete placeholder product if exists
    const placeholder = products.find(p => p.category === categoryName && p.id.startsWith('temp_cat_'));
    if (placeholder) {
      try {
        await fetch(`/api/admin/products?id=${placeholder.id}`, { method: 'DELETE' });
        fetchProducts();
        activityLogger.action('category_deleted', { name: categoryName });
      } catch (err) {
        activityLogger.error('category_delete_failed', { name: categoryName });
        alert('Failed to delete category');
      }
    }
  };

  // Brand operations
  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    const tempProduct = {
      id: `temp_brand_${Date.now()}`,
      name: 'Brand Placeholder',
      brand: newBrandName.trim(),
      category: 'all',
      price: 0,
      inStock: false,
      status: 'draft'
    };
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: [tempProduct] })
      });
      setNewBrandName('');
      fetchProducts();
      activityLogger.action('brand_added', { name: newBrandName.trim() });
    } catch (err) {
      activityLogger.error('brand_add_failed', { name: newBrandName.trim() });
      alert('Failed to add brand');
    }
  };

  const handleEditBrand = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingBrand(null);
      return;
    }
    const productsToUpdate = products.filter(p => p.brand === oldName);
    if (productsToUpdate.length === 0) {
      setEditingBrand(null);
      return;
    }
    const updated = productsToUpdate.map(p => ({ ...p, brand: newName.trim() }));
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updated })
      });
      setEditingBrand(null);
      fetchProducts();
      activityLogger.action('brand_renamed', { from: oldName, to: newName.trim() });
    } catch (err) {
      activityLogger.error('brand_rename_failed', { from: oldName, to: newName.trim() });
      alert('Failed to update brand');
    }
  };

  const handleDeleteBrand = async (brandName: string) => {
    const productCount = brandStats.find(([name]) => name === brandName)?.[1].count || 0;
    if (productCount > 0) {
      alert(`Cannot delete "${brandName}" - it has ${productCount} products. Move or delete those products first.`);
      return;
    }
    const placeholder = products.find(p => p.brand === brandName && p.id.startsWith('temp_brand_'));
    if (placeholder) {
      try {
        await fetch(`/api/admin/products?id=${placeholder.id}`, { method: 'DELETE' });
        fetchProducts();
        activityLogger.action('brand_deleted', { name: brandName });
      } catch (err) {
        activityLogger.error('brand_delete_failed', { name: brandName });
        alert('Failed to delete brand');
      }
    }
  };

  const handleBrandImageUpload = async (brandName: string, file: File) => {
    setBrandImageUploading(brandName);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'brand');
      formData.append('brandName', brandName);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Upload failed: ${res.status}`);
      }
      if (data.url) {
        // Update all products with this brand to include the brand image
        const productsToUpdate = products.filter(p => p.brand === brandName);
        const updated = productsToUpdate.map(p => ({ ...p, brandImage: data.url }));
        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: updated })
        });
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload brand image');
    } finally {
      setBrandImageUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-neutral-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categories & Brands</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage product categories and brands</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tags size={16} />
            Categories ({categoryStats.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'brands'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 size={16} />
            Brands ({brandStats.length})
          </div>
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Add New Category */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Add New Category</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900">All Categories</h3>
            </div>
            <div className="divide-y divide-neutral-100">
              {categoryStats.length === 0 ? (
                <div className="px-6 py-8 text-center text-neutral-500">
                  No categories found
                </div>
              ) : (
                categoryStats.map(([name, count]) => (
                  <div 
                    key={name} 
                    onClick={() => handleViewCategoryProducts(name)}
                    className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 cursor-pointer"
                  >
                    {editingCategory === name ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditCategory(name, editCategoryName);
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="flex-1 px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditCategory(name, editCategoryName); }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingCategory(null); }}
                          className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-neutral-900">{getCategoryDisplayName(name)}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewCategoryProducts(name); }}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                              count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                            {count} {count === 1 ? 'product' : 'products'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(name);
                              setEditCategoryName(name);
                            }}
                            className="p-2 text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit category"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(name); }}
                            disabled={count > 0}
                            className={`p-2 rounded-lg transition-colors ${
                              count > 0
                                ? 'text-neutral-300 cursor-not-allowed'
                                : 'text-neutral-600 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={count > 0 ? 'Cannot delete: has products' : 'Delete category'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Brands Tab */}
      {activeTab === 'brands' && (
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="text-2xl font-bold">{brandStats.length}</div>
              <div className="text-emerald-100 text-sm">Total Brands</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="text-2xl font-bold">
                {brandStats.filter(([_, s]) => s.image).length}
              </div>
              <div className="text-blue-100 text-sm">With Images</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
              <div className="text-2xl font-bold">
                {brandStats.filter(([_, s]) => s.count > 0).length}
              </div>
              <div className="text-amber-100 text-sm">Active Brands</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="text-2xl font-bold">
                {brandStats.reduce((sum, [_, s]) => sum + s.count, 0)}
              </div>
              <div className="text-purple-100 text-sm">Total Products</div>
            </div>
          </div>

          {/* Add New Brand */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h3 className="font-semibold text-neutral-900 mb-4 text-lg">Add New Brand</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter brand name..."
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
                className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                onClick={handleAddBrand}
                disabled={!newBrandName.trim()}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={20} />
                Add Brand
              </button>
            </div>
          </div>

          {/* Brands Grid */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 text-lg">All Brands</h3>
              <span className="text-sm text-neutral-500">{brandStats.length} brands</span>
            </div>
            {brandStats.length === 0 ? (
              <div className="px-6 py-12 text-center text-neutral-500">
                <Building2 size={48} className="mx-auto mb-4 text-neutral-300" />
                <p className="text-lg font-medium">No brands found</p>
                <p className="text-sm">Add your first brand above</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {brandStats.map(([name, stats]) => (
                    <div
                      key={name}
                      onClick={() => handleViewBrandProducts(name)}
                      className="group relative bg-neutral-50 rounded-xl border border-neutral-200 hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden cursor-pointer"
                    >
                      {/* Brand Image */}
                      <div className="relative aspect-square bg-white flex items-center justify-center p-4">
                        {stats.image ? (
                          <img
                            src={stats.image}
                            alt={name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-neutral-400">
                            <Building2 size={40} />
                            <span className="text-xs mt-2">No image</span>
                          </div>
                        )}
                        {/* Upload overlay - only show when editing */}
                        <label 
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer transition-opacity ${brandImageUploading === name ? 'opacity-100' : editingBrand === name ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const file = e.target.files?.[0];
                              if (file) handleBrandImageUpload(name, file);
                            }}
                          />
                          {brandImageUploading === name ? (
                            <RefreshCw className="animate-spin text-white" size={24} />
                          ) : (
                            <div className="text-white text-center">
                              <Upload size={24} className="mx-auto mb-1" />
                              <span className="text-xs">Upload</span>
                            </div>
                          )}
                        </label>
                      </div>

                      {/* Brand Info */}
                      <div className="p-3">
                        {editingBrand === name ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editBrandName}
                              onChange={(e) => setEditBrandName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditBrand(name, editBrandName);
                                if (e.key === 'Escape') setEditingBrand(null);
                              }}
                              autoFocus
                              className="w-full px-2 py-1 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditBrand(name, editBrandName)}
                                className="flex-1 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingBrand(null)}
                                className="flex-1 py-1 bg-neutral-200 text-neutral-700 rounded text-xs font-medium hover:bg-neutral-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-neutral-900 text-sm truncate" title={name}>
                              {name}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewBrandProducts(name); }}
                              className={`text-xs mt-1 text-left cursor-pointer hover:underline ${stats.count > 0 ? 'text-emerald-600 font-medium' : 'text-neutral-500'}`}>
                              {stats.count} {stats.count === 1 ? 'product' : 'products'}
                            </button>
                            {/* Actions */}
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-neutral-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBrand(name);
                                  setEditBrandName(name);
                                }}
                                className="flex-1 py-1.5 text-xs font-medium text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="Edit brand"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteBrand(name); }}
                                disabled={stats.count > 0}
                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                                  stats.count > 0
                                    ? 'text-neutral-300 cursor-not-allowed'
                                    : 'text-neutral-600 hover:text-red-600 hover:bg-red-50'
                                }`}
                                title={stats.count > 0 ? 'Cannot delete: has products' : 'Delete brand'}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Products Panel for Selected Category/Brand */}
      {showProductsPanel && (selectedCategory || selectedBrand) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  {selectedCategory ? `Category: ${getCategoryDisplayName(selectedCategory)}` : `Brand: ${selectedBrand}`}
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  {selectedCategory 
                    ? `${categoryProducts.length} product${categoryProducts.length === 1 ? '' : 's'} in this category`
                    : `${brandProducts.length} product${brandProducts.length === 1 ? '' : 's'} for this brand`
                  }
                </p>
              </div>
              <button
                onClick={handleCloseProductsPanel}
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-6">
              {(selectedCategory ? categoryProducts : brandProducts).length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Package size={48} className="mx-auto mb-4 text-neutral-300" />
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm mt-1">
                    {selectedCategory 
                      ? `There are no products in the "${selectedCategory}" category.`
                      : `There are no products for the "${selectedBrand}" brand.`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(selectedCategory ? categoryProducts : brandProducts).map((product: any) => (
                    <div 
                      key={product.id} 
                      onClick={() => window.open(`/product/${product.id}`, '_blank')}
                      className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Product Image */}
                      <div className="aspect-video bg-neutral-100 flex items-center justify-center relative">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-neutral-400 flex flex-col items-center">
                            <Package size={40} />
                            <span className="text-xs mt-1">No image</span>
                          </div>
                        )}
                        {product.inStock ? (
                          <span className="absolute top-2 right-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            In Stock
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 text-sm line-clamp-2" title={product.name}>
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-emerald-600 font-bold">${product.price?.toFixed?.(2) || product.price}</span>
                          {product.comparePrice > product.price && (
                            <span className="text-neutral-400 line-through text-sm">${product.comparePrice?.toFixed?.(2) || product.comparePrice}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                          <span className="bg-neutral-100 px-2 py-0.5 rounded">{getCategoryDisplayName(product.category)}</span>
                          <span className="bg-neutral-100 px-2 py-0.5 rounded">{product.brand}</span>
                        </div>
                        {/* Actions */}
                        <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseProductsPanel();
                              window.open(`/product/${product.id}`, '_blank');
                            }}
                            className="flex-1 py-1.5 text-xs font-medium text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseProductsPanel();
                              // Store the product ID to be edited and switch to products tab
                              localStorage.setItem('adminEditProductId', product.id);
                              // Store flag to return to categories/brands after edit
                              localStorage.setItem('adminReturnToCategories', 'true');
                              // Store which brand/category tab was active and which item was selected
                              if (selectedBrand) {
                                localStorage.setItem('adminReturnTab', 'brands');
                                localStorage.setItem('adminReturnSelectedBrand', selectedBrand);
                              } else if (selectedCategory) {
                                localStorage.setItem('adminReturnTab', 'categories');
                                localStorage.setItem('adminReturnSelectedCategory', selectedCategory);
                              }
                              // Dispatch custom event to notify parent to switch tabs
                              window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'products', editProductId: product.id } }));
                            }}
                            className="flex-1 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                Showing {(selectedCategory ? categoryProducts : brandProducts).length} product{(selectedCategory ? categoryProducts : brandProducts).length === 1 ? '' : 's'}
              </span>
              <button
                onClick={handleCloseProductsPanel}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminMessages({ openThreadId, onThreadOpened }: { openThreadId?: string; onThreadOpened?: () => void }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingThreadId, setPendingThreadId] = useState<string | undefined>(openThreadId);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (openThreadId) setPendingThreadId(openThreadId);
  }, [openThreadId]);

  useEffect(() => {
    if (pendingThreadId && threads.length > 0) {
      const thread = threads.find(t => t.id === pendingThreadId);
      if (thread) {
        setSelectedThread(thread);
        setPendingThreadId(undefined);
        onThreadOpened?.();
      }
    }
  }, [pendingThreadId, threads]);

  const loadThreads = async () => {
    try {
      const resp = await fetch('/api/admin/support-chats', { cache: 'no-store' });
      const data = await resp.json().catch(() => []);
      if (Array.isArray(data)) {
        setThreads(data);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading messages...</div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquareText size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500">No messages yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Thread List */}
      <div className="w-96 flex-shrink-0 border border-neutral-200 rounded-xl bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-lg font-semibold text-neutral-900">Messages</h2>
          <p className="text-sm text-neutral-500">{threads.length} conversation{threads.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={`w-full p-4 text-left border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                selectedThread?.id === thread.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-900 truncate">
                    {thread.customerName || thread.customerEmail}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {thread.orderId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem('adminViewOrderId', thread.orderId);
                          window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'orders', viewOrderId: thread.orderId } }));
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Order: #{thread.orderId}
                      </button>
                    )}
                    {thread.returnId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem('adminViewReturnId', thread.returnId);
                          window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'returns', viewReturnId: thread.returnId } }));
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline ml-2"
                      >
                        Return: #{thread.returnId}
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-neutral-600 truncate mt-1">
                    {thread.latestMessage || 'No messages'}
                  </div>
                </div>
                {thread.unreadCount > 0 && (
                  <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {new Date(thread.lastMessageAt).toLocaleDateString()} at {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {selectedThread ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {selectedThread.customerName || selectedThread.customerEmail}
                </h3>
                <div className="text-sm text-neutral-500">
                  {selectedThread.orderId && (
                    <button
                      onClick={() => {
                        localStorage.setItem('adminViewOrderId', selectedThread.orderId);
                        window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'orders', viewOrderId: selectedThread.orderId } }));
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline mr-3"
                    >
                      Order: #{selectedThread.orderId}
                    </button>
                  )}
                  {selectedThread.returnId && (
                    <button
                      onClick={() => {
                        localStorage.setItem('adminViewReturnId', selectedThread.returnId);
                        window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'returns', viewReturnId: selectedThread.returnId } }));
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Return: #{selectedThread.returnId}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedThread(null)}
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AdminSupportChat
                orderId={selectedThread.orderId}
                returnId={selectedThread.returnId}
                customerEmail={selectedThread.customerEmail}
                customerName={selectedThread.customerName}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-neutral-500">
              <MessageSquareText size={48} className="mx-auto text-neutral-300 mb-4" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminProfile() {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [error, setError] = useState('');

  const getHeader = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').email || ''; } catch { return ''; }
  };

  const saveName = async () => {
    if (!name.trim() || name.trim() === user?.name) return;
    setSaving(true); setError(''); setNameSuccess(false);
    try {
      const resp = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': getHeader() },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || 'Failed to update name'); return; }
      setNameSuccess(true);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: name.trim() }));
      setTimeout(() => setNameSuccess(false), 3000);
    } catch { setError('Connection error'); } finally { setSaving(false); }
  };

  const savePassword = async () => {
    setPwErrors([]); setError(''); setPwSuccess(false);
    if (newPassword !== confirmPassword) { setPwErrors(['Passwords do not match']); return; }
    setSavingPw(true);
    try {
      const resp = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': getHeader() },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await resp.json();
      if (!resp.ok) { setPwErrors(data.passwordErrors || [data.error || 'Failed']); return; }
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch { setError('Connection error'); } finally { setSavingPw(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">My Profile</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage your admin account details and password.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Name */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-800">Account Info</h3>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
          <p className="text-sm text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">{user?.email}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Display Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your name"
            />
            <button
              onClick={saveName}
              disabled={saving || !name.trim() || name.trim() === user?.name}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : nameSuccess ? <CheckCircle size={14} /> : null}
              {nameSuccess ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Role</label>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
            <User size={11} /> {user?.role || 'admin'}
          </span>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-800">Change Password</h3>
        {pwErrors.length > 0 && (
          <ul className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-1 list-disc list-inside">
            {pwErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        {pwSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle size={14} /> Password updated successfully.
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Current Password</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 pr-9 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" />
            <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">New Password</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 pr-9 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" />
        </div>
        <button
          onClick={savePassword}
          disabled={savingPw || !currentPassword || !newPassword || !confirmPassword}
          className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {savingPw && <RefreshCw size={14} className="animate-spin" />}
          {savingPw ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

const Admin = () => (
  <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-600" /></div>}>
    <AdminContent />
  </Suspense>
);

export default Admin;

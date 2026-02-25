"use client";

import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { navigationMenu as defaultNavFromFile } from '../data/navigation';
import { remoteImages } from '../data/navigation';

const STORAGE_KEYS = {
  products: 'allremotes_products',
  homeContent: 'allremotes_home_content',
  navigation: 'allremotes_navigation',
  reviews: 'allremotes_reviews',
  promotions: 'allremotes_promotions',
};

const defaultHomeContent = {
  heroImages: ["/images/hero.jpg", "/images/heroimg.jpg"],
  hero: {
    title: 'Garage Door & Gate Remotes',
    subtitle: 'Quality is Guaranteed',
    description: 'Your trusted source for premium car and garage remotes. Browse our extensive collection of high-quality remote controls designed to meet all your automation needs.',
    primaryCta: 'Shop Car Remotes',
    primaryCtaPath: '/products/car',
    secondaryCta: 'Shop Garage Remotes',
    secondaryCtaPath: '/products/garage',
  },
  features: [
    { icon: '🚗', title: 'Car Remotes', description: 'Universal and brand-specific car remotes with advanced security features', path: '/products/car', linkText: 'Explore →' },
    { icon: '🚪', title: 'Garage Remotes', description: 'Reliable garage door and gate remotes for all your home automation needs', path: '/products/garage', linkText: 'Explore →' },
    { icon: '✓', title: 'Quality Guaranteed', description: 'All our products come with quality assurance and customer support', path: '', linkText: '' },
  ],
  whyBuy: [
    { icon: '✓', title: 'Quality Guaranteed', description: 'All our products are genuine and come with quality assurance. We stand behind every product we sell.' },
    { icon: '🚚', title: 'Free Shipping Australia Wide', description: 'We offer free shipping on all non-bulky items across Australia. Fast and reliable delivery.' },
    { icon: '🔄', title: '30 Day Returns & 12 Month Warranty', description: 'All purchases include a 30-day return option and 12-month warranty for your peace of mind.' },
    { icon: '💬', title: 'Unbeatable Support', description: 'Friendly, reliable support you can trust. Our experienced team is ready to help via phone, email, or live chat.' },
    { icon: '🔒', title: 'Secure Payments', description: 'Mastercard, VISA, AMEX, Bank Deposit, Afterpay - All payment options are surcharge-free and secure.' },
    { icon: '⭐', title: 'Trusted by Thousands', description: 'Over 1,500 five-star reviews and trusted by homeowners, tradespeople, and businesses across Australia.' },
  ],
  ctaSection: {
    title: 'Ready to Find Your Perfect Remote?',
    description: 'Browse our collection and find the perfect remote for your needs',
    buttonText: 'View All Products',
    buttonPath: '/products/all',
  },
};

const defaultPromotions = {
  topInfoBar: {
    enabled: true,
    items: ["12 MONTH WARRANTY", "30 DAY RETURNS", "SAFE & SECURE", "TRADE PRICING"],
  },
  offers: {
    categories: [
      { id: "black-friday", name: "Black Friday" },
      { id: "boxing-day", name: "Boxing Day" },
    ],
    offers: [
      {
        id: "black-friday-sale",
        categoryId: "black-friday",
        name: "Black Friday Sale",
        enabled: false,
        appliesTo: "all", // all | car | garage
        discountPercent: 20,
        startDate: "",
        endDate: "",
      },
    ],
    stackWithMemberDiscount: false,
  },
};

const defaultReviews = [
  { rating: 5, text: 'Excellent service and fast delivery! The remote I ordered worked perfectly with my garage door. Highly recommend ALLREMOTES!', author: 'John M.', verified: true },
  { rating: 5, text: 'Great quality products at competitive prices. The customer support team was very helpful in finding the right remote for my car.', author: 'Sarah K.', verified: true },
  { rating: 5, text: 'Quick shipping and the product was exactly as described. Easy to program and works great. Will definitely shop here again!', author: 'Michael T.', verified: true },
  { rating: 5, text: 'Best place to buy remotes online! Wide selection, genuine products, and excellent customer service. 5 stars!', author: 'Emma L.', verified: true },
  { rating: 5, text: 'Professional service and high-quality remotes. The warranty gives me confidence in my purchase. Thank you!', author: 'David R.', verified: true },
  { rating: 5, text: 'Fast delivery, great prices, and the remote works perfectly. The free shipping is a huge bonus. Highly satisfied!', author: 'Lisa W.', verified: true },
];

// Product images: use first 12 from remoteImages for product catalog
const productImagePool = remoteImages.slice(0, 12);

function loadProducts() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.products);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function resolveProducts(productsData) {
  if (!productsData || !productsData.length) return [];
  return productsData.map((p) => ({
    ...p,
    image: (typeof p.image === 'string' && p.image.trim())
      ? p.image
      : (typeof p.imageIndex === 'number' && productImagePool[p.imageIndex])
        ? productImagePool[p.imageIndex]
        : productImagePool[0],
  }));
}

function coerceServerProductsToLocal(productsFromServer) {
  // The server writes products to products.json. Those objects may not have
  // the `imageIndex` field the UI expects for localStorage. Normalize here so
  // existing UI code keeps working.
  if (!Array.isArray(productsFromServer)) return null;
  return productsFromServer.map((p) => ({
    id: p?.id ?? String(Date.now()),
    name: p?.name ?? '',
    category: p?.category ?? 'garage',
    price: p?.price ?? 0,
    description: p?.description ?? '',
    inStock: typeof p?.inStock === 'boolean' ? p.inStock : true,
    brand: p?.brand ?? '',
    sku: p?.sku ?? p?.product_code ?? '',
    image: p?.image ?? '',
    imageIndex: typeof p?.imageIndex === 'number' ? p.imageIndex : 0,
    condition: p?.condition ?? 'Brand New',
    returns: p?.returns ?? 'No returns accepted',
    seller: p?.seller ?? 'AllRemotes (100% positive)',
  }));
}

function saveProducts(productsWithImages) {
  if (typeof window === 'undefined') return;
  const toSave = productsWithImages.map((p) => {
    const { image, ...rest } = p;
    const imageIndex = productImagePool.indexOf(image);
    if (imageIndex >= 0) return { ...rest, imageIndex };
    // If the image isn't from our local pool (e.g. a URL from the CSV upload),
    // persist it directly so the UI can render it.
    return { ...rest, imageIndex: null, image: typeof image === 'string' ? image : '' };
  });
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(toSave));
}

const StoreContext = createContext();

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};

export const StoreProvider = ({ children }) => {
  const [productsVersion, setProductsVersion] = useState(0);
  const [homeVersion, setHomeVersion] = useState(0);
  const [navVersion, setNavVersion] = useState(0);
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [promotionsVersion, setPromotionsVersion] = useState(0);
  const apiBase = useMemo(() => {
    // Prefer same-origin by default. Override when hosting the API elsewhere.
    const fromEnv = String(process.env.NEXT_PUBLIC_API_BASE || '').trim();
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocalHost = host === 'localhost' || host === '127.0.0.1';
      const pointsToLocal = /localhost|127\.0\.0\.1/.test(fromEnv);
      if (!isLocalHost && pointsToLocal) return '';
    }
    return fromEnv;
  }, []);

  const postJson = useCallback(async (path, body, { method = 'POST' } = {}) => {
    try {
      const res = await fetch(`${apiBase}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? null),
        credentials: 'omit',
      });
      if (!res.ok) return null;
      return await res.json().catch(() => ({}));
    } catch {
      return null;
    }
  }, [apiBase]);

  const getJson = useCallback(async (path) => {
    try {
      const res = await fetch(`${apiBase}${path}`, { credentials: 'omit' });
      if (!res.ok) return null;
      return await res.json().catch(() => ({}));
    } catch {
      return null;
    }
  }, [apiBase]);

  const getProducts = useCallback(() => {
    const stored = loadProducts();
    return resolveProducts(stored);
    // productsVersion forces new reference so consumers re-render after setProducts
  }, [productsVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const setProducts = useCallback((productsArray) => {
    saveProducts(productsArray);
    setProductsVersion((v) => v + 1);

    // Best-effort: persist to backend when MongoDB is enabled there.
    // If the backend isn't running / Mongo isn't configured, we silently keep localStorage behavior.
    postJson('/api/admin/products', productsArray, { method: 'PUT' });
  }, [postJson]);

  const refreshProductsFromServer = useCallback(async () => {
    // Best-effort: if the backend isn't running, we simply keep current local data.
    const res = await fetch(`${apiBase}/api/products`);
    if (!res.ok) throw new Error('Failed to refresh products from server');
    const data = await res.json();
    const normalized = coerceServerProductsToLocal(data);
    if (!normalized) return;
    setProducts(resolveProducts(normalized));
  }, [apiBase, setProducts]);

  // Try to hydrate products from the server on first load (non-blocking).
  useEffect(() => {
    refreshProductsFromServer().catch((err) => {
      // Helpful in production debugging (e.g. Vercel DB connectivity).
      // eslint-disable-next-line no-console
      console.warn('refreshProductsFromServer failed', err);
    });
  }, [refreshProductsFromServer]);

  const getHomeContent = useCallback(() => {
    try {
      if (typeof window === 'undefined') return defaultHomeContent;
      const raw = localStorage.getItem(STORAGE_KEYS.homeContent);
      if (!raw) return defaultHomeContent;
      return { ...defaultHomeContent, ...JSON.parse(raw) };
    } catch {
      return defaultHomeContent;
    }
    // homeVersion forces re-render after setHomeContent
  }, [homeVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const setHomeContent = useCallback((content) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.homeContent, JSON.stringify(content));
    setHomeVersion((v) => v + 1);
    postJson('/api/content/home', content);
  }, [postJson]);

  const resolveNavIcons = useCallback((nav) => {
    if (!nav || typeof nav !== 'object') return nav;
    const out = {};
    for (const key of Object.keys(nav)) {
      const section = nav[key];
      if (!section || section.hasDropdown === false) {
        out[key] = section;
        continue;
      }
      if (!Array.isArray(section.columns)) {
        out[key] = section;
        continue;
      }
      out[key] = {
        ...section,
        columns: section.columns.map((col) => ({
          ...col,
          items: (col.items || []).map((item) => ({
            ...item,
            icon: item.iconIndex != null && remoteImages[item.iconIndex]
              ? remoteImages[item.iconIndex]
              : remoteImages[0],
          })),
        })),
      };
    }
    return out;
  }, []);

  const serializeNavIcons = useCallback((nav) => {
    if (!nav || typeof nav !== 'object') return nav;
    const out = {};
    for (const key of Object.keys(nav)) {
      const section = nav[key];
      if (!section || section.hasDropdown === false) {
        out[key] = section;
        continue;
      }
      if (!Array.isArray(section.columns)) {
        out[key] = section;
        continue;
      }
      out[key] = {
        ...section,
        columns: section.columns.map((col) => ({
          ...col,
          items: (col.items || []).map((item) => {
            const { icon, iconIndex: existing, ...rest } = item;
            const iconIndex = typeof existing === 'number' ? existing : remoteImages.indexOf(icon);
            return { ...rest, iconIndex: iconIndex >= 0 ? iconIndex : 0 };
          }),
        })),
      };
    }
    return out;
  }, []);

  const getNavigation = useCallback(() => {
    try {
      if (typeof window === 'undefined') return defaultNavFromFile;
      const raw = localStorage.getItem(STORAGE_KEYS.navigation);
      if (!raw) return defaultNavFromFile;
      const parsed = JSON.parse(raw);
      return resolveNavIcons(parsed);
    } catch {
      return defaultNavFromFile;
    }
    // navVersion forces re-render after setNavigation
  }, [navVersion, resolveNavIcons]); // eslint-disable-line react-hooks/exhaustive-deps

  const setNavigation = useCallback((nav) => {
    if (typeof window === 'undefined') return;
    const serialized = serializeNavIcons(nav);
    localStorage.setItem(STORAGE_KEYS.navigation, JSON.stringify(serialized));
    setNavVersion((v) => v + 1);
    postJson('/api/content/navigation', serialized);
  }, [serializeNavIcons, postJson]);

  const getNavigationForAdmin = useCallback(() => {
    try {
      if (typeof window === 'undefined') return serializeNavIcons(defaultNavFromFile);
      const raw = localStorage.getItem(STORAGE_KEYS.navigation);
      if (raw) return JSON.parse(raw);
    } catch {}
    return serializeNavIcons(defaultNavFromFile);
  }, [serializeNavIcons]);

  const getReviews = useCallback(() => {
    try {
      if (typeof window === 'undefined') return defaultReviews;
      const raw = localStorage.getItem(STORAGE_KEYS.reviews);
      if (!raw) return defaultReviews;
      return JSON.parse(raw);
    } catch {
      return defaultReviews;
    }
    // reviewsVersion forces re-render after setReviews
  }, [reviewsVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const setReviews = useCallback((reviews) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
    setReviewsVersion((v) => v + 1);
    postJson('/api/content/reviews', reviews);
  }, [postJson]);

  const getPromotions = useCallback(() => {
    try {
      if (typeof window === 'undefined') return defaultPromotions;
      const raw = localStorage.getItem(STORAGE_KEYS.promotions);
      if (!raw) return defaultPromotions;
      const parsed = JSON.parse(raw);
      return { ...defaultPromotions, ...parsed };
    } catch {
      return defaultPromotions;
    }
    // promotionsVersion forces re-render after setPromotions
  }, [promotionsVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const setPromotions = useCallback((promotions) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.promotions, JSON.stringify(promotions));
    setPromotionsVersion((v) => v + 1);
    postJson('/api/content/promotions', promotions);
  }, [postJson]);

  // Hydrate shared content (Mongo-backed) into localStorage on startup.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    getJson('/api/content/home').then((resp) => {
      if (!resp || !resp.data) return;
      localStorage.setItem(STORAGE_KEYS.homeContent, JSON.stringify(resp.data));
      setHomeVersion((v) => v + 1);
    });
    getJson('/api/content/navigation').then((resp) => {
      if (!resp || !resp.data) return;
      localStorage.setItem(STORAGE_KEYS.navigation, JSON.stringify(resp.data));
      setNavVersion((v) => v + 1);
    });
    getJson('/api/content/reviews').then((resp) => {
      if (!resp || !resp.data) return;
      localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(resp.data));
      setReviewsVersion((v) => v + 1);
    });
    getJson('/api/content/promotions').then((resp) => {
      if (!resp || !resp.data) return;
      localStorage.setItem(STORAGE_KEYS.promotions, JSON.stringify(resp.data));
      setPromotionsVersion((v) => v + 1);
    });
  }, [getJson]);

  const value = {
    getProducts,
    setProducts,
    refreshProductsFromServer,
    getHomeContent,
    setHomeContent,
    getNavigation,
    getNavigationForAdmin,
    setNavigation,
    getReviews,
    setReviews,
    getPromotions,
    setPromotions,
    productImagePool,
    remoteImages,
    defaultHomeContent,
    defaultReviews,
    defaultPromotions,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export default StoreContext;

"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { generateNavigationFromProducts } from "../data/navigation";
import MainHeaderBar from "./header/MainHeaderBar";
import NavBar from "./header/NavBar";
import TopInfoBar from "./header/TopInfoBar";

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const { getNavigation, getProducts, getPromotions } = useStore();
  const navigationMenu = getNavigation();
  const promotions = getPromotions();
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = getCartItemCount();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const searchRef = useRef(null);
  const hamburgerRef = useRef(null);
  const accountMenuCloseTimeoutRef = useRef(null);

  // Get products for nav generation — prefer store cache, fallback to API fetch
  const [isClient, setIsClient] = useState(false);
  const [navProducts, setNavProducts] = useState([]);

  useEffect(() => {
    setIsClient(true);
    const stored = getProducts();
    if (stored && stored.length > 0) {
      setNavProducts(stored);
      return;
    }
    // Fetch from API if store is empty
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setNavProducts(data); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also sync when store products update (e.g. after store hydration)
  const storeProducts = useMemo(() => getProducts() || [], [getProducts]);
  useEffect(() => {
    if (storeProducts.length > 0 && storeProducts.length !== navProducts.length) {
      setNavProducts(storeProducts);
    }
  }, [storeProducts, navProducts.length]);

  // Generate navigation from product categories (only on client to avoid hydration errors)
  const dynamicNavigation = useMemo(() => {
    if (!isClient || !navProducts || navProducts.length === 0) return null;
    return generateNavigationFromProducts(navProducts);
  }, [navProducts, isClient]);

  const navItems = Object.entries(dynamicNavigation || {})
    .filter(([, item]) => !item?.hidden)
    .map(([key, item]) => ({ key, ...item }));

  const isRouteActive = (path) => {
    if (!path) return false;
    if (pathname === path) return true;
    return pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const openAccountMenu = () => {
    if (accountMenuCloseTimeoutRef.current) {
      clearTimeout(accountMenuCloseTimeoutRef.current);
      accountMenuCloseTimeoutRef.current = null;
    }
    setShowAccountMenu(true);
  };

  const scheduleAccountMenuClose = () => {
    if (accountMenuCloseTimeoutRef.current) {
      clearTimeout(accountMenuCloseTimeoutRef.current);
    }
    accountMenuCloseTimeoutRef.current = window.setTimeout(() => {
      setShowAccountMenu(false);
      accountMenuCloseTimeoutRef.current = null;
    }, 180);
  };

  const cancelAccountMenuClose = () => {
    if (accountMenuCloseTimeoutRef.current) {
      clearTimeout(accountMenuCloseTimeoutRef.current);
      accountMenuCloseTimeoutRef.current = null;
    }
  };

  const openDrawer = () => {
    setMobileDrawerOpen(true);
  };

  const closeDrawer = () => {
    setMobileDrawerOpen(false);
    window.requestAnimationFrame(() => {
      if (hamburgerRef.current) hamburgerRef.current.focus();
    });
  };

  useEffect(() => {
    cancelAccountMenuClose();
    setShowAccountMenu(false);
    setShowSearchResults(false);
  }, [pathname]);

  useEffect(() => {
    const list = getProducts() || [];
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = list.filter((product) => {
        const searchableText = [
          product.name,
          product.description,
          product.category,
          product.brand,
          product.sku,
          product.seo_title,
          product.tags,
          product.features,
          product.compatibility,
          product.cat1,
          product.cat2,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchableText.includes(query);
      });
      setSearchResults(filtered.slice(0, 8));
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, getProducts]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products/all?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const handleProductClick = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleNavLinkClick = () => {
    closeDrawer();
  };

  const handleAccountTriggerClick = (e) => {
    if (!showAccountMenu) {
      e.preventDefault();
      openAccountMenu();
      return;
    }
    setShowAccountMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        cancelAccountMenuClose();
        setShowAccountMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      cancelAccountMenuClose();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-[1200] border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-md transition-shadow duration-200 ease-in-out">
      <TopInfoBar promotions={promotions} />
      <MainHeaderBar
        user={user}
        promotions={promotions}
        cartCount={cartCount}
        searchQuery={searchQuery}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        showAccountMenu={showAccountMenu}
        setShowSearchResults={setShowSearchResults}
        searchRef={searchRef}
        accountMenuRef={accountMenuRef}
        hamburgerRef={hamburgerRef}
        mobileDrawerOpen={mobileDrawerOpen}
        handleSearchSubmit={handleSearchSubmit}
        handleSearchChange={handleSearchChange}
        handleProductClick={handleProductClick}
        openAccountMenu={openAccountMenu}
        scheduleAccountMenuClose={scheduleAccountMenuClose}
        cancelAccountMenuClose={cancelAccountMenuClose}
        handleAccountTriggerClick={handleAccountTriggerClick}
        setShowAccountMenu={setShowAccountMenu}
        handleLogout={handleLogout}
        openDrawer={openDrawer}
      />
      <NavBar
        user={user}
        pathname={pathname}
        navItems={navItems}
        hamburgerRef={hamburgerRef}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
        isRouteActive={isRouteActive}
        handleNavLinkClick={handleNavLinkClick}
        handleLogout={handleLogout}
        closeDrawer={closeDrawer}
      />
    </header>
  );
};

export default Header;

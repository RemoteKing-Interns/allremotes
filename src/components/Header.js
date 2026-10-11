"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import MainHeaderBar from "./header/MainHeaderBar";
import NavBar from "./header/NavBar";
import TopInfoBar from "./header/TopInfoBar";
import { buildProductSearchIndex, searchIndex } from "../lib/search";
import { generateProductSlugUrl } from "../lib/product-slugs";
import { trackSearch } from "../lib/gtag";

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const { getProducts, getPromotions } = useStore();
  const promotions = getPromotions();
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = getCartItemCount();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const accountMenuRef = useRef(null);
  const searchRef = useRef(null);
  const hamburgerRef = useRef(null);
  const accountMenuCloseTimeoutRef = useRef(null);

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
    }, 80);
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

  // Memoize the product list + precomputed search index once per
  // productsVersion change (getProducts() JSON.parses a ~2.3MB blob and
  // re-enriches every product — running it per keystroke was the bottleneck).
  const searchableProducts = React.useMemo(
    () => buildProductSearchIndex(getProducts() || []),
    [getProducts],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      const filtered = searchIndex(searchableProducts, debouncedQuery);
      setSearchResults(filtered.slice(0, 8).map((r) => r.product));
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
    setActiveResultIndex(-1);
    setIsSearching(false);
  }, [debouncedQuery, searchableProducts]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
    if (e.target.value.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (term) {
      trackSearch(term, searchResults.length);
      router.push(`/products/all?search=${encodeURIComponent(term)}`);
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowSearchResults(false);
      setActiveResultIndex(-1);
      return;
    }
    if (!showSearchResults || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveResultIndex((i) => (i + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveResultIndex((i) => (i - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === "Enter" && activeResultIndex >= 0) {
      e.preventDefault();
      const p = searchResults[activeResultIndex];
      router.push(generateProductSlugUrl(String(p.id), String(p.name || ""), p.sku || p.rk_sku));
      handleProductClick();
    }
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
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
        isSearching={isSearching}
        showAccountMenu={showAccountMenu}
        setShowSearchResults={setShowSearchResults}
        searchRef={searchRef}
        accountMenuRef={accountMenuRef}
        hamburgerRef={hamburgerRef}
        mobileDrawerOpen={mobileDrawerOpen}
        handleSearchSubmit={handleSearchSubmit}
        handleSearchChange={handleSearchChange}
        handleSearchKeyDown={handleSearchKeyDown}
        activeResultIndex={activeResultIndex}
        handleSearchClear={handleSearchClear}
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

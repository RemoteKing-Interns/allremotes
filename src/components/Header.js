"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [topBarCollapsed, setTopBarCollapsed] = useState(false);
  const dropdownRef = useRef(null);
  const accountMenuRef = useRef(null);
  const searchRef = useRef(null);
  const hamburgerRef = useRef(null);
  const dropdownCloseTimeoutRef = useRef(null);
  const accountMenuCloseTimeoutRef = useRef(null);

  const navItems = Object.entries(navigationMenu || {})
    .filter(([, item]) => !item?.hidden)
    .map(([key, item]) => ({ key, ...item }));

  const getVisibleColumns = (section) =>
    (section?.columns || [])
      .map((col) => ({
        ...col,
        items: (col.items || []).filter((i) => !i?.hidden),
      }))
      .filter((col) => (col.items || []).length > 0);

  const isRouteActive = (path) => {
    if (!path) return false;
    if (pathname === path) return true;
    return pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const openDropdown = (key) => {
    const section = navigationMenu[key];
    if (!section || section.hidden) return;
    const visibleColumns = getVisibleColumns(section);

    if (visibleColumns.length > 0) {
      if (dropdownCloseTimeoutRef.current) {
        clearTimeout(dropdownCloseTimeoutRef.current);
        dropdownCloseTimeoutRef.current = null;
      }
      setActiveDropdown(key);
    }
  };

  const scheduleDropdownClose = () => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
    }
    dropdownCloseTimeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
      dropdownCloseTimeoutRef.current = null;
    }, 160);
  };

  const cancelDropdownClose = () => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
      dropdownCloseTimeoutRef.current = null;
    }
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
    cancelDropdownClose();
    cancelAccountMenuClose();
    setActiveDropdown(null);
    setShowAccountMenu(false);
    setShowSearchResults(false);
  }, [pathname]);

  useEffect(() => {
    const list = getProducts() || [];
    if (searchQuery.trim().length > 0) {
      const filtered = list.filter((product) => {
        const query = searchQuery.toLowerCase();
        return (
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.description &&
            product.description.toLowerCase().includes(query)) ||
          (product.category && product.category.toLowerCase().includes(query))
        );
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        cancelDropdownClose();
        setActiveDropdown(null);
      }
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
      cancelDropdownClose();
      cancelAccountMenuClose();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const collapseThreshold = 24;

    const handleScroll = () => {
      setTopBarCollapsed(window.scrollY > collapseThreshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-[1200] border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-md transition-shadow duration-200 ease-in-out">
      <TopInfoBar promotions={promotions} collapsed={topBarCollapsed} />
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
        dropdownRef={dropdownRef}
        hamburgerRef={hamburgerRef}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        getVisibleColumns={getVisibleColumns}
        isRouteActive={isRouteActive}
        openDropdown={openDropdown}
        scheduleDropdownClose={scheduleDropdownClose}
        cancelDropdownClose={cancelDropdownClose}
        handleNavLinkClick={handleNavLinkClick}
        handleLogout={handleLogout}
        closeDrawer={closeDrawer}
      />
    </header>
  );
};

export default Header;

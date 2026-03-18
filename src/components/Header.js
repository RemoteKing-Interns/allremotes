"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { getPriceBreakdown, isDiscountEligible } from "../utils/pricing";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";

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

  // Search functionality
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

  return (
    <header className="sticky top-0 z-[1200] border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-md">
      {promotions?.topInfoBar?.enabled && (promotions?.topInfoBar?.items || []).length > 0 && (
        <div className="border-b border-neutral-200 bg-neutral-100/70">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-xs font-semibold text-neutral-700 sm:justify-between">
              {(promotions.topInfoBar.items || []).map((text, idx) => (
                <span key={`${idx}-${text}`} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="container">
          <div className="flex items-center gap-3 py-4 md:gap-5">
            <Link href="/" className="shrink-0" aria-label="ALLREMOTES home">
              <img src="/images/mainlogo.png" alt="ALLREMOTES" className="h-10 w-auto sm:h-11" />
            </Link>

            <div className="relative hidden flex-1 md:block" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search remote, brand, or model"
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white/90 pl-4 pr-12 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/40"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent-dark transition hover:bg-accent/15"
                  aria-label="Search"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
              </form>

              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-[1300] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-strong">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 text-xs font-semibold text-neutral-700">
                    <span>Search Results ({searchResults.length})</span>
                    <span className="text-neutral-400">Top matches</span>
                  </div>
                  <div className="max-h-[22rem] overflow-auto">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-100"
                        onClick={handleProductClick}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 rounded-xl border border-neutral-200 bg-white object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.src = "/images/mainlogo.png";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-neutral-900">
                            {product.name}
                          </div>
                          {(() => {
                            const pricing = getPriceBreakdown(
                              product.price,
                              isDiscountEligible(user),
                              { promotions, product },
                            );
                            return (
                              <div className="mt-1 flex items-baseline gap-2">
                                {pricing.hasDiscount && (
                                  <span className="text-xs text-neutral-400 line-through">
                                    AU${pricing.originalPrice.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-sm font-extrabold text-neutral-900">
                                  AU${pricing.finalPrice.toFixed(2)}
                                </span>
                              </div>
                            );
                          })()}
                          <div className="mt-1 text-xs font-semibold text-neutral-500">
                            {product.category === "car"
                              ? "Automotive Remote"
                              : "Garage & Gate Remote"}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {searchResults.length >= 8 && (
                    <div className="border-t border-neutral-200 p-3">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                      >
                        View All Results
                      </button>
                    </div>
                  )}
                </div>
              )}

              {showSearchResults &&
                searchQuery.trim().length > 0 &&
                searchResults.length === 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-[1300] rounded-2xl border border-neutral-200 bg-white p-4 shadow-strong">
                    <p className="text-sm font-semibold text-neutral-900">
                      No products found for &quot;{searchQuery}&quot;
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Try searching for <span className="font-semibold">car</span>,{" "}
                      <span className="font-semibold">garage</span>, or{" "}
                      <span className="font-semibold">remote</span>.
                    </p>
                  </div>
                )}
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  <div
                    ref={accountMenuRef}
                    className="relative"
                    onMouseEnter={openAccountMenu}
                    onMouseLeave={scheduleAccountMenuClose}
                    onFocus={openAccountMenu}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        cancelAccountMenuClose();
                        setShowAccountMenu(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setShowAccountMenu(false);
                    }}
                  >
                    <Link
                      href="/account"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100"
                      aria-haspopup="menu"
                      aria-expanded={showAccountMenu}
                      aria-label="Account menu"
                      onClick={handleAccountTriggerClick}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </Link>

                    {showAccountMenu && (
                      <div
                        className="absolute right-0 top-[calc(100%+0.6rem)] z-[1400] w-[18rem] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-strong"
                        role="menu"
                        onMouseEnter={cancelAccountMenuClose}
                        onMouseLeave={scheduleAccountMenuClose}
                      >
                        <div className="border-b border-neutral-200 px-4 py-3">
                          <div className="text-sm font-semibold text-neutral-900">{user.name}</div>
                          {user.email && (
                            <div className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
                              {user.email}
                            </div>
                          )}
                        </div>

                        <Link
                          href="/account?tab=basics"
                          className="block px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                          role="menuitem"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Account Settings
                        </Link>
                        <Link
                          href="/account?tab=orders"
                          className="block px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                          role="menuitem"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Orders
                        </Link>
                        <Link
                          href="/account?tab=notifications"
                          className="block px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                          role="menuitem"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Notifications
                        </Link>
                        <Link
                          href="/account?tab=help"
                          className="block px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                          role="menuitem"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Help & Support
                        </Link>

                        <div className="h-px bg-neutral-200" />

                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountMenu(false);
                            handleLogout();
                          }}
                          className="block w-full px-4 py-3 text-left text-sm font-semibold text-primary-dark hover:bg-primary/5"
                          role="menuitem"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
              <Link href="/cart" className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100" aria-label="Cart">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 6h15l-1.5 9h-13L6 6Z" />
                    <path d="M6 6 5 3H2" />
                    <circle cx="9" cy="20" r="1.3" />
                    <circle cx="18" cy="20" r="1.3" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-extrabold text-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
              </Link>

              {/* Hamburger Button - Mobile Only */}
              <button
                ref={hamburgerRef}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100 md:hidden"
                onClick={openDrawer}
                aria-expanded={mobileDrawerOpen}
                aria-controls="mobile-drawer"
                aria-label="Toggle navigation menu"
              >
                <span className="sr-only">Open menu</span>
                <div className="grid gap-1.5">
                  <span className="h-0.5 w-5 rounded-full bg-neutral-800" />
                  <span className="h-0.5 w-5 rounded-full bg-neutral-800" />
                  <span className="h-0.5 w-5 rounded-full bg-neutral-800" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={mobileDrawerOpen}
        onOpenChange={(open) => {
          setMobileDrawerOpen(open);
          if (!open) {
            window.requestAnimationFrame(() => {
              if (hamburgerRef.current) hamburgerRef.current.focus();
            });
          }
        }}
      >
        <SheetContent id="mobile-drawer" className="md:hidden">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Browse categories, shop products, and access your account.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid gap-6">
            <nav className="grid gap-1">
              {navItems.map((menuItem) => {
                const isActive = isRouteActive(menuItem.path);
                return (
                  <Link
                    key={menuItem.key}
                    href={menuItem.path}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? "bg-accent/10 text-accent-dark" : "text-neutral-800 hover:bg-neutral-100"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={handleNavLinkClick}
                  >
                    {menuItem.title}
                  </Link>
                );
              })}
              <Link
                href="/products/all"
                className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                  isRouteActive("/products/all") ? "bg-primary text-white" : "bg-primary text-white hover:bg-primary-dark"
                }`}
                aria-current={isRouteActive("/products/all") ? "page" : undefined}
                onClick={handleNavLinkClick}
              >
                View Products
              </Link>
            </nav>

            <div className="grid gap-2">
              {user ? (
                <>
                  <Link
                    href="/account"
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      pathname === "/account" ? "bg-accent/10 text-accent-dark" : "text-neutral-800 hover:bg-neutral-100"
                    }`}
                    onClick={handleNavLinkClick}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeDrawer();
                    }}
                    className="rounded-2xl bg-primary/10 px-4 py-3 text-left text-sm font-semibold text-primary-dark hover:bg-primary/15"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold transition ${
                      pathname === "/login" ? "border-accent/30 bg-accent/5 text-accent-dark" : "text-neutral-800 hover:bg-neutral-100"
                    }`}
                    onClick={handleNavLinkClick}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={`rounded-2xl bg-accent px-4 py-3 text-sm font-extrabold text-white transition ${
                      pathname === "/register" ? "bg-accent-dark" : "hover:bg-accent-dark"
                    }`}
                    onClick={handleNavLinkClick}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <nav className="hidden border-t border-neutral-200 bg-white/70 md:block" ref={dropdownRef}>
        <div className="container">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-1">
              {navItems.map((menuItem, index) => {
                  const visibleColumns = getVisibleColumns(menuItem);
                  const isDropdownOpen = activeDropdown === menuItem.key;
                  const isCurrentRoute = isRouteActive(menuItem.path);
                  const shouldAlignRight = index >= Math.max(navItems.length - 2, 0);

                  return (
                    <div
                      key={menuItem.key}
                      className={`relative ${shouldAlignRight ? "ml-auto" : ""}`}
                      onMouseEnter={() => openDropdown(menuItem.key)}
                      onMouseLeave={scheduleDropdownClose}
                      onFocus={() => openDropdown(menuItem.key)}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          cancelDropdownClose();
                          setActiveDropdown(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          cancelDropdownClose();
                          setActiveDropdown(null);
                        }
                      }}
                    >
                      <Link
                        href={menuItem.path}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                          isCurrentRoute || isDropdownOpen
                            ? "bg-accent/10 text-accent-dark"
                            : "text-neutral-800 hover:bg-neutral-100"
                        }`}
                        aria-current={isCurrentRoute ? "page" : undefined}
                        aria-haspopup={visibleColumns.length > 0 ? "menu" : undefined}
                        aria-expanded={visibleColumns.length > 0 ? isDropdownOpen : undefined}
                        onClick={(e) => {
                          if (visibleColumns.length > 0 && !isDropdownOpen) {
                            e.preventDefault();
                            openDropdown(menuItem.key);
                          }
                        }}
                      >
                        {menuItem.title}
                        {visibleColumns.length > 0 && (
                          <svg
                            className={`transition ${isDropdownOpen ? "rotate-180" : "rotate-0"}`}
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M2 4l4 4 4-4" />
                          </svg>
                        )}
                      </Link>

                      {isDropdownOpen && visibleColumns.length > 0 && (
                        <div
                          className={`absolute top-[calc(100%+0.6rem)] z-[1400] ${
                            shouldAlignRight ? "right-0" : "left-0"
                          }`}
                          onMouseEnter={cancelDropdownClose}
                          onMouseLeave={scheduleDropdownClose}
                        >
                          <div className="w-[44rem] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-strong">
                            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                              {visibleColumns.map((column, colIndex) => (
                                <div
                                  key={colIndex}
                                  className="min-w-0"
                                >
                                  <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                                    {column.title}
                                  </h3>
                                  <ul className="mt-4 grid gap-2">
                                    {column.items.map((item, itemIndex) => (
                                      <li key={itemIndex}>
                                        <Link
                                          href={item.path}
                                          className={`group flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-neutral-100 ${
                                            item.isShopAll ? "bg-primary/5 hover:bg-primary/10" : ""
                                          }`}
                                          onClick={() =>
                                            setActiveDropdown(null)
                                          }
                                        >
                                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-xs">
                                            <img
                                              src={item.icon}
                                              alt={item.name}
                                              className="h-6 w-6 object-contain"
                                            />
                                          </span>
                                          <span className={`min-w-0 truncate text-sm font-semibold ${
                                            item.isShopAll ? "text-primary-dark" : "text-neutral-900"
                                          }`}>
                                            {item.name}
                                          </span>
                                          {item.isShopAll && (
                                            <svg
                                              className="ml-auto text-primary-dark"
                                              width="16"
                                              height="16"
                                              viewBox="0 0 16 16"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <path d="M6 3l5 5-5 5" />
                                            </svg>
                                          )}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
            <Link
              href="/products/all"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark"
            >
              View Products
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

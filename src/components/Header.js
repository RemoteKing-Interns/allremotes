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
    <header className="header">
      {promotions?.topInfoBar?.enabled && (promotions?.topInfoBar?.items || []).length > 0 && (
        <div className="top-info-bar">
          <div className="container">
            <div className="info-items">
              {(promotions.topInfoBar.items || []).map((text, idx) => (
                  <span key={`${idx}-${text}`} className="info-item">
                    {text}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="main-header">
        <div className="container">
          <div className="header-content">
            <Link href="/" className="logo-container">
              <img src="/images/mainlogo.png" alt="ALLREMOTES" className="logo" />
            </Link>

            <div className="search-container" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="search-form">
                <input
                  type="text"
                  placeholder="Search remote, brand, or model"
                  className="search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                <button type="submit" className="search-submit-btn">
                  <svg
                    className="search-icon"
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
                <div className="search-results">
                  <div className="search-results-header">
                    <span>Search Results ({searchResults.length})</span>
                  </div>
                  <div className="search-results-list">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="search-result-item"
                        onClick={handleProductClick}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="search-result-image"
                          onError={(e) => {
                            e.currentTarget.src = "/images/mainlogo.png";
                          }}
                        />
                        <div className="search-result-info">
                          <div className="search-result-name">
                            {product.name}
                          </div>
                          {(() => {
                            const pricing = getPriceBreakdown(
                              product.price,
                              isDiscountEligible(user),
                              { promotions, product },
                            );
                            return (
                              <div className="search-result-price">
                                {pricing.hasDiscount && (
                                  <span className="search-result-price-old">
                                    AU${pricing.originalPrice.toFixed(2)}
                                  </span>
                                )}
                                <span className="search-result-price-new">
                                  AU${pricing.finalPrice.toFixed(2)}
                                </span>
                              </div>
                            );
                          })()}
                          <div className="search-result-category">
                            {product.category === "car"
                              ? "Automotive Remote"
                              : "Garage & Gate Remote"}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {searchResults.length >= 8 && (
                    <div className="search-results-footer">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="search-view-all"
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
                  <div className="search-results">
                    <div className="search-no-results">
                      <p>No products found for "{searchQuery}"</p>
                      <p className="search-suggestion">
                        Try searching for "car", "garage", or "remote"
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <div className="header-actions">
              {user ? (
                <>
                  <div
                    ref={accountMenuRef}
                    className="account-menu-container"
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
                      className="user-icon"
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
                        className="account-menu-dropdown"
                        role="menu"
                        onMouseEnter={cancelAccountMenuClose}
                        onMouseLeave={scheduleAccountMenuClose}
                      >
                        <div className="account-menu-header">
                          <div className="account-menu-name">{user.name}</div>
                          {user.email && (
                            <div className="account-menu-email">
                              {user.email}
                            </div>
                          )}
                        </div>

                        <Link
                          href="/account?tab=basics"
                          className="account-menu-item"
                          role="menuitem"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Account Settings
                        </Link>
                        <Link
                          href="/account?tab=orders"
                          className="account-menu-item"
                          role="menuitem"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Orders
                        </Link>
                        <Link
                          href="/account?tab=notifications"
                          className="account-menu-item"
                          role="menuitem"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Notifications
                        </Link>
                        <Link
                          href="/account?tab=help"
                          className="account-menu-item"
                          role="menuitem"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Help & Support
                        </Link>

                        <div className="account-menu-divider" />

                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountMenu(false);
                            handleLogout();
                          }}
                          className="account-menu-item account-menu-logout"
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
              <Link href="/cart" className="cart-icon-new">
                <div className="cart-icon-wrapper">
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
                    <span className="cart-badge-new">{cartCount}</span>
                  )}
                </div>
              </Link>

              {/* Hamburger Button - Mobile Only */}
              <button
                ref={hamburgerRef}
                className="hamburger-btn"
                onClick={openDrawer}
                aria-expanded={mobileDrawerOpen}
                aria-controls="mobile-drawer"
                aria-label="Toggle navigation menu"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
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
        <SheetContent id="mobile-drawer" className="mobile-drawer">
          <SheetHeader className="drawer-content-header">
            <SheetTitle className="drawer-title">Menu</SheetTitle>
            <SheetDescription>
              Browse categories, shop products, and access your account.
            </SheetDescription>
          </SheetHeader>

          <div className="drawer-content">
            <nav className="drawer-nav">
              {navItems.map((menuItem) => {
                const isActive = isRouteActive(menuItem.path);
                return (
                  <Link
                    key={menuItem.key}
                    href={menuItem.path}
                    className={`drawer-nav-link ${isActive ? "active current" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={handleNavLinkClick}
                  >
                    {menuItem.title}
                  </Link>
                );
              })}
              <Link
                href="/products/all"
                className={`drawer-nav-link drawer-nav-cta ${isRouteActive("/products/all") ? "active current" : ""}`}
                aria-current={isRouteActive("/products/all") ? "page" : undefined}
                onClick={handleNavLinkClick}
              >
                View Products
              </Link>
            </nav>

            <div className="drawer-auth-section">
              {user ? (
                <>
                  <Link
                    href="/account"
                    className={`drawer-auth-link ${pathname === "/account" ? "active" : ""}`}
                    onClick={handleNavLinkClick}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeDrawer();
                    }}
                    className="drawer-auth-btn drawer-logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`drawer-auth-btn drawer-auth-outline ${pathname === "/login" ? "active" : ""}`}
                    onClick={handleNavLinkClick}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={`drawer-auth-btn drawer-auth-primary ${pathname === "/register" ? "active" : ""}`}
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

      <nav className="main-nav" ref={dropdownRef}>
        <div className="container">
          <div className="nav-inner">
            <div className="nav-links">
              {navItems.map((menuItem, index) => {
                  const visibleColumns = getVisibleColumns(menuItem);
                  const isDropdownOpen = activeDropdown === menuItem.key;
                  const isCurrentRoute = isRouteActive(menuItem.path);
                  const shouldAlignRight = index >= Math.max(navItems.length - 2, 0);

                  return (
                    <div
                      key={menuItem.key}
                      className={`nav-item-wrapper ${shouldAlignRight ? "nav-item-wrapper--right" : ""}`}
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
                        className={`nav-link ${isDropdownOpen ? "active" : ""} ${isCurrentRoute ? "current" : ""}`}
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
                            className={`chevron ${isDropdownOpen ? "up" : "down"}`}
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            {isDropdownOpen ? (
                              <path d="M2 8l4-4 4 4" />
                            ) : (
                              <path d="M2 4l4 4 4-4" />
                            )}
                          </svg>
                        )}
                      </Link>

                      {isDropdownOpen && visibleColumns.length > 0 && (
                        <div
                          className="mega-menu-wrapper"
                          onMouseEnter={cancelDropdownClose}
                          onMouseLeave={scheduleDropdownClose}
                        >
                          <div className="mega-menu">
                            <div className="mega-menu-content">
                              {visibleColumns.map((column, colIndex) => (
                                <div
                                  key={colIndex}
                                  className="mega-menu-column"
                                >
                                  <h3 className="column-title">
                                    {column.title}
                                  </h3>
                                  <ul className="column-items">
                                    {column.items.map((item, itemIndex) => (
                                      <li key={itemIndex}>
                                        <Link
                                          href={item.path}
                                          className={`menu-item-link ${item.isShopAll ? "shop-all" : ""}`}
                                          onClick={() =>
                                            setActiveDropdown(null)
                                          }
                                        >
                                          <span className="menu-item-icon">
                                            <img
                                              src={item.icon}
                                              alt={item.name}
                                            />
                                          </span>
                                          <span className="menu-item-text">
                                            {item.name}
                                          </span>
                                          {item.isShopAll && (
                                            <svg
                                              className="arrow-icon"
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
              <Link href="/products/all" className="nav-cta">
                View Products
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

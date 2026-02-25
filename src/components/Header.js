"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { getPriceBreakdown, isDiscountEligible } from "../utils/pricing";

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
  const drawerRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleMouseEnter = (key) => {
    const section = navigationMenu[key];
    if (!section || section.hidden) return;
    const visibleColumns = (section.columns || [])
      .map((col) => ({
        ...col,
        items: (col.items || []).filter((i) => !i?.hidden),
      }))
      .filter((col) => (col.items || []).length > 0);

    if (visibleColumns.length > 0) {
      setActiveDropdown(key);
    }
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  // Open drawer and focus first element
  const openDrawer = () => {
    setMobileDrawerOpen(true);
    setTimeout(() => {
      // Try to focus the active link first
      const activeLink = document.querySelector(".drawer-nav-link.active");
      if (activeLink) {
        activeLink.focus();
      } else if (firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }
    }, 100);
  };

  // Close drawer and return focus to hamburger
  const closeDrawer = () => {
    setMobileDrawerOpen(false);
    if (hamburgerRef.current) {
      hamburgerRef.current.focus();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        closeDrawer();
      }
    };

    if (mobileDrawerOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setShowAccountMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      {promotions?.topInfoBar?.enabled && (promotions?.topInfoBar?.items || []).length > 0 && (
        <div className="top-info-bar">
          <div className="container">
            <div className="info-items">
              {(promotions.topInfoBar.items || [])
                .concat(promotions.topInfoBar.items || [])
                .map((text, idx) => (
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
                  placeholder="Search Products"
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
                            e.target.src =
                              "https://via.placeholder.com/60x60?text=Remote";
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
                              ? "🚗 Car Remote"
                              : "🚪 Garage Remote"}
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
                    onMouseEnter={() => setShowAccountMenu(true)}
                    onMouseLeave={() => setShowAccountMenu(false)}
                    onFocus={() => setShowAccountMenu(true)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
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
                      <div className="account-menu-dropdown" role="menu">
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
                  <Link href="/login" className="btn btn-outline btn-small">
                    Login
                  </Link>
                  <Link href="/register" className="btn btn-primary btn-small">
                    Register
                  </Link>
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

      {/* Mobile Drawer Menu */}
      {mobileDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="drawer-overlay"
            onClick={closeDrawer}
            aria-hidden="true"
          ></div>

          {/* Drawer */}
          <div
            ref={drawerRef}
            id="mobile-drawer"
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            {/* Close Button */}
            <button
              className="drawer-close-btn"
              onClick={closeDrawer}
              aria-label="Close navigation menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Drawer Content */}
            <div className="drawer-content">
              <h2 id="drawer-title" className="drawer-title">
                Menu
              </h2>

              {/* Navigation Links */}
              <nav className="drawer-nav">
                {Object.keys(navigationMenu)
                  .filter((key) => !navigationMenu[key]?.hidden)
                  .map((key, index) => {
                    const menuItem = navigationMenu[key];
                    const isFirst = index === 0;
                    const isActive = pathname === menuItem.path;
                    return (
                      <Link
                        key={key}
                        ref={isFirst ? firstFocusableRef : null}
                        href={menuItem.path}
                        className={`drawer-nav-link ${isActive ? "active" : ""}`}
                        onClick={handleNavLinkClick}
                      >
                        {menuItem.title}
                      </Link>
                    );
                  })}
                <Link
                  href="/products/all"
                  className={`drawer-nav-link drawer-nav-cta ${pathname === "/products/all" ? "active" : ""}`}
                  onClick={handleNavLinkClick}
                >
                  View Products
                </Link>
              </nav>

              {/* Auth Links - Mobile */}
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
          </div>
        </>
      )}

      <nav className="main-nav" ref={dropdownRef}>
        <div className="container">
          <div className="nav-inner">
            <div className="nav-links">
              {Object.keys(navigationMenu)
                .filter((key) => !navigationMenu[key]?.hidden)
                .map((key) => {
                  const menuItem = navigationMenu[key];
                  const visibleColumns = (menuItem.columns || [])
                    .map((col) => ({
                      ...col,
                      items: (col.items || []).filter((i) => !i?.hidden),
                    }))
                    .filter((col) => (col.items || []).length > 0);
                  const isActive = activeDropdown === key;

                  return (
                    <div
                      key={key}
                      className="nav-item-wrapper"
                      onMouseEnter={() => handleMouseEnter(key)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Link
                        href={menuItem.path}
                        className={`nav-link ${isActive ? "active" : ""}`}
                      >
                        {menuItem.title}
                        {visibleColumns.length > 0 && (
                          <svg
                            className={`chevron ${isActive ? "up" : "down"}`}
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            {isActive ? (
                              <path d="M2 8l4-4 4 4" />
                            ) : (
                              <path d="M2 4l4 4 4-4" />
                            )}
                          </svg>
                        )}
                      </Link>

                      {isActive && visibleColumns.length > 0 && (
                        <div className="mega-menu-wrapper">
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

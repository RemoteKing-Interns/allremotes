"use client";

import React from "react";
import Link from "next/link";
import { getPriceBreakdown, isDiscountEligible } from "../../utils/pricing";
import { Button } from "../ui/button";

const MainHeaderBar = ({
  user,
  promotions,
  cartCount,
  searchQuery,
  searchResults,
  showSearchResults,
  showAccountMenu,
  setShowSearchResults,
  searchRef,
  accountMenuRef,
  hamburgerRef,
  mobileDrawerOpen,
  handleSearchSubmit,
  handleSearchChange,
  handleProductClick,
  openAccountMenu,
  scheduleAccountMenuClose,
  cancelAccountMenuClose,
  handleAccountTriggerClick,
  setShowAccountMenu,
  handleLogout,
  openDrawer,
}) => {
  const hasDiscount = isDiscountEligible(user);

  return (
    <div>
      <div className="container">
        <div className="flex items-center gap-4 py-4 md:gap-6">
          <Link href="/" className="shrink-0" aria-label="ALLREMOTES home">
            <img src="/images/mainlogo.png" alt="ALLREMOTES" className="h-12 w-auto sm:h-14" />
          </Link>

          <div className="relative hidden w-full max-w-2xl mx-auto md:block" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search remote, brand, or model"
                className="h-12 w-full rounded-lg border border-neutral-300 bg-white pl-5 pr-12 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowSearchResults(true)}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white transition hover:bg-accent-dark"
                aria-label="Search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[1300] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-strong">
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 text-xs font-semibold text-neutral-700">
                  <span>Search Results ({searchResults.length})</span>
                  <span className="text-neutral-400">Top matches</span>
                </div>
                <div className="max-h-[22rem] overflow-auto">
                  {searchResults.map((product) => {
                    const pricing = getPriceBreakdown(product.price, hasDiscount, {
                      promotions,
                      product,
                    });

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-100"
                        onClick={handleProductClick}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg border border-neutral-200 bg-white object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.src = "/images/mainlogo.png";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-neutral-900">
                            {product.name}
                          </div>
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
                          <div className="mt-1 text-xs font-semibold text-neutral-500">
                            {product.category === "car"
                              ? "Automotive Remote"
                              : "Garage & Gate Remote"}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {searchResults.length >= 8 && (
                  <div className="border-t border-neutral-200 p-3">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                    >
                      View All Results
                    </button>
                  </div>
                )}
              </div>
            )}

            {showSearchResults && searchQuery.trim().length > 0 && searchResults.length === 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[1300] rounded-lg border border-neutral-200 bg-white p-4 shadow-strong">
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100"
                  aria-haspopup="menu"
                  aria-expanded={showAccountMenu}
                  aria-label="Account menu"
                  onClick={handleAccountTriggerClick}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Link>

                {showAccountMenu && (
                  <div
                    className="absolute right-0 top-[calc(100%+0.4rem)] z-[1400] w-[18rem] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-strong"
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

            <Link
              href="/cart"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100"
              aria-label="Cart"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

            <button
              ref={hamburgerRef}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white/80 text-neutral-800 shadow-sm transition hover:bg-neutral-100 md:hidden"
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
  );
};

export default MainHeaderBar;

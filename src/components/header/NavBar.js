"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { ChevronDown } from "lucide-react";

const CATEGORY_DISPLAY_NAMES = {
  garage: 'Garage & Gate',
  car: 'Automotive',
  home: 'For The Home',
  locksmith: 'Locksmithing',
};

const NavBar = ({
  user,
  pathname,
  navItems,
  hamburgerRef,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  isRouteActive,
  handleNavLinkClick,
  handleLogout,
  closeDrawer,
}) => {
  const handleMobileLinkClick = () => {
    handleNavLinkClick();
  };

  // Desktop dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Fetch categories from dedicated API
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        setCategories(data.map(c => ({
          ...c,
          path: `/products/all?category=${encodeURIComponent(c.key)}`,
        })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
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
        <SheetContent id="mobile-drawer" className="xl:hidden">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Browse categories, shop products, and access your account.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid gap-6">
            <nav className="grid gap-2">

              {/* Products section with categories */}
              <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Products
                </div>
                {categories.length === 0 ? (
                  <div className="px-4 pb-3 space-y-2">
                    {[140, 110, 120].map((w, i) => (
                      <div key={i} className="h-7 rounded bg-neutral-100 animate-pulse" style={{ width: w }} />
                    ))}
                  </div>
                ) : (
                  <div className="pb-2">
                    {categories.map((cat, idx) => (
                      <Link
                        key={idx}
                        href={cat.path}
                        onClick={handleMobileLinkClick}
                        className={`flex items-center justify-between px-4 py-2.5 text-sm transition ${
                          isRouteActive(cat.path) ? "bg-accent/10 text-accent-dark font-semibold" : "text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-neutral-400">{cat.count}</span>
                      </Link>
                    ))}
                    <Link
                      href="/products/all"
                      onClick={handleMobileLinkClick}
                      className="flex items-center px-4 py-2.5 text-sm font-semibold text-primary border-t border-neutral-100 hover:bg-primary/5 transition"
                    >
                      All Products
                    </Link>
                  </div>
                )}
              </div>

              {/* Shop By Brand */}
              <Link
                href="/shop-by-brand"
                onClick={handleMobileLinkClick}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isRouteActive("/shop-by-brand")
                    ? "bg-accent/10 text-accent-dark"
                    : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
                }`}
              >
                Shop By Brand
              </Link>

              {/* Support */}
              <Link
                href="/support"
                onClick={handleMobileLinkClick}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isRouteActive("/support")
                    ? "bg-accent/10 text-accent-dark"
                    : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
                }`}
              >
                Support
              </Link>

              {/* Contact */}
              <Link
                href="/contact"
                onClick={handleMobileLinkClick}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isRouteActive("/contact")
                    ? "bg-accent/10 text-accent-dark"
                    : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
                }`}
              >
                Contact
              </Link>

              {/* Browse Catalogue CTA */}
              <Link
                href="/products/all"
                className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-extrabold text-white transition hover:bg-primary-dark"
                onClick={handleMobileLinkClick}
              >
                Browse Catalogue
              </Link>
            </nav>

            <div className="grid gap-2">
              {user ? (
                <>
                  <Link
                    href="/account"
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      pathname === "/account"
                        ? "bg-accent/10 text-accent-dark"
                        : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
                    }`}
                    onClick={handleMobileLinkClick}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/wishlist"
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      pathname === "/wishlist"
                        ? "bg-accent/10 text-accent-dark"
                        : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
                    }`}
                    onClick={handleMobileLinkClick}
                  >
                    Wishlist
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
                      pathname === "/login"
                        ? "border-accent/30 bg-accent/5 text-accent-dark"
                        : "text-neutral-800 hover:bg-neutral-100"
                    }`}
                    onClick={handleMobileLinkClick}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={`rounded-2xl bg-accent px-4 py-3 text-sm font-extrabold text-white transition ${
                      pathname === "/register" ? "bg-accent-dark" : "hover:bg-accent-dark"
                    }`}
                    onClick={handleMobileLinkClick}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <nav className="hidden border-t border-neutral-200 bg-white/70 xl:block" ref={dropdownRef}>
        <div className="container">
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-1">

              {/* Products dropdown - categories loaded from DB */}
              <div className="relative">
                <button
                  onMouseEnter={() => setOpenDropdown('products')}
                  onClick={() => setOpenDropdown(openDropdown === 'products' ? null : 'products')}
                  className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isRouteActive('/products') ? 'bg-accent/10 text-accent-dark' : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  aria-expanded={openDropdown === 'products'}
                  aria-haspopup="true"
                >
                  Products
                  <ChevronDown size={14} className={`transition-transform ${openDropdown === 'products' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'products' && (
                  <div
                    className="absolute left-0 top-full z-[1200] mt-1 w-56 rounded-xl border border-neutral-200 bg-white shadow-lg"
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <div className="p-2">
                      {categories.length === 0 ? (
                        <div className="space-y-1 p-1">
                          {[120, 90, 100].map((w, i) => (
                            <div key={i} className="h-8 rounded bg-neutral-100 animate-pulse" style={{ width: w }} />
                          ))}
                        </div>
                      ) : (
                        <>
                          {categories.map((cat, idx) => (
                            <Link
                              key={idx}
                              href={cat.path}
                              onClick={() => setOpenDropdown(null)}
                              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100"
                            >
                              <span>{cat.name}</span>
                              <span className="text-xs text-neutral-400">{cat.count}</span>
                            </Link>
                          ))}
                          <Link
                            href="/products/all"
                            onClick={() => setOpenDropdown(null)}
                            className="mt-1 flex items-center justify-between rounded-lg border-t border-neutral-100 px-3 py-2 pt-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
                          >
                            All Products
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Shop By Brand - plain link to brands page */}
              <Link
                href="/shop-by-brand"
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isRouteActive('/shop-by-brand') ? 'bg-accent/10 text-accent-dark' : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                Shop By Brand
              </Link>

              {/* Support dropdown */}
              <div className="relative">
                <button
                  onMouseEnter={() => setOpenDropdown('support')}
                  onClick={() => setOpenDropdown(openDropdown === 'support' ? null : 'support')}
                  className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                  aria-expanded={openDropdown === 'support'}
                  aria-haspopup="true"
                >
                  Support
                  <ChevronDown size={14} className={`transition-transform ${openDropdown === 'support' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'support' && (
                  <div
                    className="absolute left-0 top-full z-[1200] mt-1 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg"
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <div className="p-2">
                      {[
                        { name: 'Contact Us', path: '/contact' },
                        { name: 'Return Policy', path: '/return-policy' },
                        { name: 'FAQ', path: '/support/faq' },
                      ].map((item, idx) => (
                        <Link
                          key={idx}
                          href={item.path}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center rounded-lg px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA button */}
              <Link
                href="/products/all"
                className="ml-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-primary-dark"
              >
                Shop All
              </Link>

            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;

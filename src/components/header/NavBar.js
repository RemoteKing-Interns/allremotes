"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";

const PANEL_COLUMN_MIN_REM = 15.5;
const PANEL_GAP_REM = 1;
const PANEL_PADDING_REM = 2.5;
const PANEL_MIN_WIDTH_REM = 22;

const splitColumnItems = (column) => {
  const visibleItems = (column?.items || []).filter((item) => !item?.hidden);
  return {
    regularItems: visibleItems.filter((item) => !item?.isShopAll),
    shopItem: visibleItems.find((item) => item?.isShopAll) || null,
  };
};

const getDesktopPanelWidth = (columnCount) => {
  const safeCount = Math.max(1, columnCount);
  const columnsWidth =
    safeCount * PANEL_COLUMN_MIN_REM + Math.max(0, safeCount - 1) * PANEL_GAP_REM;
  const preferredWidth = Math.max(
    PANEL_MIN_WIDTH_REM,
    columnsWidth + PANEL_PADDING_REM,
  );

  return `min(${preferredWidth}rem, calc(100vw - 2rem))`;
};

const HeaderMenuItem = ({
  item,
  onClick,
  emphasized = false,
  compact = false,
}) => (
  <Link
    href={item.path}
    className={`group flex w-full items-center gap-3 rounded-2xl border transition ${
      emphasized
        ? "border-primary/20 bg-[linear-gradient(135deg,rgba(192,57,43,0.10),rgba(231,76,60,0.08))] hover:border-primary/30 hover:bg-[linear-gradient(135deg,rgba(192,57,43,0.14),rgba(231,76,60,0.12))]"
        : "border-neutral-200 bg-white hover:border-accent/20 hover:bg-neutral-50"
    } ${compact ? "px-2.5 py-2.5" : "px-3 py-3"}`}
    onClick={onClick}
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-xs">
      <img
        src={item.icon}
        alt={item.name}
        className="h-6 w-6 object-contain"
        onError={(e) => {
          e.currentTarget.src = "/images/mainlogo.png";
        }}
      />
    </span>
    <span className="min-w-0 flex-1 pr-1 text-sm font-semibold leading-snug text-neutral-900">
      {item.name}
    </span>
    <svg
      className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
        emphasized ? "text-primary-dark" : "text-neutral-400 group-hover:text-neutral-700"
      }`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  </Link>
);

const DesktopMenuColumn = ({ column, onItemClick }) => {
  const { regularItems, shopItem } = splitColumnItems(column);

  return (
    <section className="flex h-full min-w-0 flex-col rounded-[1.4rem] border border-neutral-200 bg-white/96 p-4 shadow-panel">
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-500">
        {column.title}
      </h3>
      <div className="mt-3 grid gap-2">
        {regularItems.map((item) => (
          <HeaderMenuItem key={item.path} item={item} onClick={onItemClick} />
        ))}
      </div>
      {shopItem && (
        <div className="mt-auto pt-3">
          <HeaderMenuItem item={shopItem} emphasized onClick={onItemClick} />
        </div>
      )}
    </section>
  );
};

const MobileMenuColumn = ({ column, onItemClick }) => {
  const { regularItems, shopItem } = splitColumnItems(column);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-xs">
      <h3 className="px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-500">
        {column.title}
      </h3>
      <div className="mt-2 grid gap-1.5">
        {regularItems.map((item) => (
          <HeaderMenuItem
            key={item.path}
            item={item}
            compact
            onClick={onItemClick}
          />
        ))}
        {shopItem && (
          <HeaderMenuItem
            item={shopItem}
            compact
            emphasized
            onClick={onItemClick}
          />
        )}
      </div>
    </section>
  );
};

const NavBar = ({
  user,
  pathname,
  navItems,
  dropdownRef,
  hamburgerRef,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  activeDropdown,
  setActiveDropdown,
  getVisibleColumns,
  isRouteActive,
  openDropdown,
  scheduleDropdownClose,
  cancelDropdownClose,
  handleNavLinkClick,
  handleLogout,
  closeDrawer,
}) => {
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState(null);

  const activeDesktopMenu =
    navItems.find((menuItem) => menuItem.key === activeDropdown) || null;
  const activeDesktopColumns = activeDesktopMenu
    ? getVisibleColumns(activeDesktopMenu)
    : [];

  const handleMobileLinkClick = () => {
    setMobileExpandedMenu(null);
    handleNavLinkClick();
  };

  return (
    <>
      <Sheet
        open={mobileDrawerOpen}
        onOpenChange={(open) => {
          setMobileDrawerOpen(open);
          if (!open) {
            setMobileExpandedMenu(null);
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
            <nav className="grid gap-2">
              {navItems.map((menuItem) => {
                const visibleColumns = getVisibleColumns(menuItem);
                const isExpandable = visibleColumns.length > 0;
                const isExpanded = mobileExpandedMenu === menuItem.key;
                const isActive = isRouteActive(menuItem.path);

                if (!isExpandable) {
                  return (
                    <Link
                      key={menuItem.key}
                      href={menuItem.path}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-accent/10 text-accent-dark"
                          : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                      onClick={handleMobileLinkClick}
                    >
                      {menuItem.title}
                    </Link>
                  );
                }

                return (
                  <section
                    key={menuItem.key}
                    className={`overflow-hidden rounded-[1.4rem] border transition ${
                      isExpanded || isActive
                        ? "border-accent/25 bg-[linear-gradient(180deg,rgba(26,122,110,0.08),rgba(255,255,255,0.96))]"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                      aria-expanded={isExpanded}
                      aria-controls={`mobile-menu-${menuItem.key}`}
                      onClick={() =>
                        setMobileExpandedMenu((current) =>
                          current === menuItem.key ? null : menuItem.key,
                        )
                      }
                    >
                      <span className="text-sm font-semibold text-neutral-900">
                        {menuItem.title}
                      </span>
                      <svg
                        className={`h-4 w-4 text-neutral-500 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M2 4l4 4 4-4" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div
                        id={`mobile-menu-${menuItem.key}`}
                        className="border-t border-neutral-200 px-3 pb-3 pt-3"
                      >
                        <div className="mb-3">
                          <Link
                            href={menuItem.path}
                            className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-accent-dark"
                            onClick={handleMobileLinkClick}
                          >
                            Explore {menuItem.title}
                          </Link>
                        </div>
                        <div className="grid gap-3">
                          {visibleColumns.map((column) => (
                            <MobileMenuColumn
                              key={`${menuItem.key}-${column.title}`}
                              column={column}
                              onItemClick={handleMobileLinkClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}

              <Link
                href="/products/all"
                className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                  isRouteActive("/products/all")
                    ? "bg-primary text-white"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
                aria-current={isRouteActive("/products/all") ? "page" : undefined}
                onClick={handleMobileLinkClick}
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
                      pathname === "/account"
                        ? "bg-accent/10 text-accent-dark"
                        : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
                    }`}
                    onClick={handleMobileLinkClick}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setMobileExpandedMenu(null);
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

      <nav className="hidden border-t border-neutral-200 bg-white/70 md:block" ref={dropdownRef}>
        <div
          className="container relative"
          onMouseEnter={cancelDropdownClose}
          onMouseLeave={scheduleDropdownClose}
        >
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-1">
              {navItems.map((menuItem) => {
                const visibleColumns = getVisibleColumns(menuItem);
                const isDropdownOpen = activeDropdown === menuItem.key;
                const isCurrentRoute = isRouteActive(menuItem.path);

                return (
                  <div
                    key={menuItem.key}
                    className="relative"
                    onMouseEnter={() => openDropdown(menuItem.key)}
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
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        isCurrentRoute || isDropdownOpen
                          ? "bg-accent/10 text-accent-dark"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
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
                  </div>
                );
              })}

              <Link
                href="/products/all"
                className="ml-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-primary-dark"
              >
                View Products
              </Link>
            </div>
          </div>

          {activeDesktopMenu && activeDesktopColumns.length > 0 && (
            <div
              className="absolute left-1/2 top-[calc(100%+0.65rem)] z-[1400] -translate-x-1/2"
              style={{ maxWidth: "calc(100vw - 2rem)" }}
              onMouseEnter={cancelDropdownClose}
              onMouseLeave={scheduleDropdownClose}
              role="menu"
            >
              <div
                className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,248,245,0.98))] shadow-strong"
                style={{ width: getDesktopPanelWidth(activeDesktopColumns.length) }}
              >
                <div className="border-b border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.10),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,248,245,0.96))] px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-500">
                        {activeDesktopMenu.title}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">
                        Browse collections
                      </h3>
                    </div>
                    <Link
                      href={activeDesktopMenu.path}
                      className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-accent-dark transition hover:bg-accent/15"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Explore All
                    </Link>
                  </div>
                </div>

                <div className="max-h-[72vh] overflow-y-auto overflow-x-hidden p-4">
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 15.5rem), 1fr))",
                    }}
                  >
                    {activeDesktopColumns.map((column) => (
                      <DesktopMenuColumn
                        key={`${activeDesktopMenu.key}-${column.title}`}
                        column={column}
                        onItemClick={() => setActiveDropdown(null)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default NavBar;

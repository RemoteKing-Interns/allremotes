"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "../../../../context/StoreContext";
import { useCart } from "../../../../context/CartContext";
import { useAuth } from "../../../../context/AuthContext";
import { getPriceBreakdown, isDiscountEligible } from "../../../../utils/pricing";
import { Button } from "../../../../components/ui/button";
import ProductCard from "../../../../components/ProductCard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../../../components/ui/sheet";

const PAGE_SIZE = 15;

function applyParam(searchParams: URLSearchParams, key: string, value: string | null) {
  if (value == null || value === "") searchParams.delete(key);
  else searchParams.set(key, value);
}

function FiltersPanel({
  brands,
  searchQuery,
  selectedCategory,
  selectedBrand,
  stockStatus,
  onSearchQueryChange,
  onSelectedCategoryChange,
  onSelectedBrandChange,
  onStockStatusChange,
  onClear,
}: {
  brands: string[];
  searchQuery: string;
  selectedCategory: string;
  selectedBrand: string;
  stockStatus: string;
  onSearchQueryChange: (next: string) => void;
  onSelectedCategoryChange: (next: string) => void;
  onSelectedBrandChange: (next: string) => void;
  onStockStatusChange: (next: string) => void;
  onClear: () => void;
}) {
  return (
    <>
      <h3>Filters</h3>

      <label>Search</label>
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
      />

      <label>Category</label>
      <select value={selectedCategory} onChange={(e) => onSelectedCategoryChange(e.target.value)}>
        <option value="all">All Products</option>
        <option value="garage">Garage & Gate</option>
        <option value="car">Automotive</option>
        <option value="home">For The Home</option>
        <option value="locksmith">Locksmithing</option>
      </select>

      <label>Brand</label>
      <select value={selectedBrand} onChange={(e) => onSelectedBrandChange(e.target.value)}>
        {brands.map((brand) => {
          const b = String(brand);
          return (
            <option key={b} value={b}>
              {b === "all" ? "All Brands" : b}
            </option>
          );
        })}
      </select>

      <label>Stock</label>
      <select value={stockStatus} onChange={(e) => onStockStatusChange(e.target.value)}>
        <option value="all">All</option>
        <option value="in">In Stock</option>
        <option value="out">Out of Stock</option>
      </select>

      <Button type="button" variant="outline" width="full" className="clear-btn" onClick={onClear}>
        Clear Filters
      </Button>
    </>
  );
}

export default function ProductListClient({
  routeCategory,
}: {
  routeCategory: string;
}) {
  const { getProducts, getPromotions } = useStore();
  const promotions = getPromotions();
  const { cart, addToCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const products = getProducts() || [];
  const initialBrand = searchParams.get("brand") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialCategoryFromUrl = searchParams.get("category") || "all";

  const initialCategory =
    routeCategory && routeCategory !== "all"
      ? routeCategory
      : initialCategoryFromUrl;

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [stockStatus, setStockStatus] = useState("all");
  const [addedItem, setAddedItem] = useState<any>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const isModalOpen = Boolean(addedItem);

  const pageFromUrl = Number(searchParams.get("page") || "1");
  const [currentPage, setCurrentPage] = useState(
    Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1,
  );

  // Keep state in sync when navigating via back/forward or external links.
  useEffect(() => {
    const urlBrand = searchParams.get("brand") || "all";
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || "all";
    const urlPage = Number(searchParams.get("page") || "1");

    setSelectedBrand(urlBrand);
    setSearchQuery(urlSearch);
    if (!routeCategory || routeCategory === "all") setSelectedCategory(urlCategory);
    setCurrentPage(Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), routeCategory]);

  const brands = useMemo<string[]>(() => {
    const brandValues = (products || [])
      .map((p: any) => (p?.brand ? String(p.brand) : ""))
      .filter(Boolean) as string[];
    const unique = Array.from(new Set<string>(brandValues));
    return ["all", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result =
      selectedCategory === "all"
        ? products
        : products.filter((p) => p.category === selectedCategory);

    if (selectedBrand !== "all") {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }

    if (stockStatus !== "all") {
      const wantInStock = stockStatus === "in";
      result = result.filter((p) => Boolean(p.inStock) === wantInStock);
    }

    return result;
  }, [products, selectedCategory, selectedBrand, searchQuery, stockStatus]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  }, [filteredProducts.length]);

  const clampedPage = useMemo(() => {
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentPage === clampedPage) return;
    setCurrentPage(clampedPage);
  }, [clampedPage, currentPage]);

  const pageProducts = useMemo(() => {
    const start = (clampedPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, clampedPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrand, searchQuery, stockStatus]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddedItem(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Persist brand/search/category/page into the URL without triggering Next.js navigation,
  // to avoid remounting this component (which can drop focus while typing in the filter input).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const next = new URLSearchParams(window.location.search);
    applyParam(next, "brand", selectedBrand);
    applyParam(next, "search", searchQuery || null);
    applyParam(next, "page", String(clampedPage));

    if (!routeCategory || routeCategory === "all") {
      applyParam(next, "category", selectedCategory === "all" ? null : selectedCategory);
    }

    const nextQs = next.toString();
    const nextUrl = nextQs ? `${pathname}?${nextQs}` : pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) window.history.replaceState(null, "", nextUrl);
  }, [pathname, selectedBrand, searchQuery, selectedCategory, clampedPage, routeCategory]);

  const visiblePages = useMemo(() => {
    const pages = new Set<number | string>([1, totalPages]);
    for (let p = clampedPage - 2; p <= clampedPage + 2; p += 1) {
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
    const sorted = Array.from(pages).sort((a: any, b: any) => a - b) as number[];
    const out: Array<number | string> = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const p = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && p - prev > 1) out.push("…");
      out.push(p);
    }
    return out;
  }, [clampedPage, totalPages]);

  const modalCartItem = useMemo(() => {
    if (!addedItem) return null;
    return (cart || []).find((item) => item.id === addedItem.id) || null;
  }, [addedItem, cart]);

  const modalQuantity = modalCartItem?.quantity ?? 1;
  const hasDiscount = isDiscountEligible(user);
  const modalPrice = getPriceBreakdown(addedItem?.price || 0, hasDiscount, { promotions, product: addedItem });

  const handleModalQuantityChange = (nextQuantity: any) => {
    if (!addedItem) return;
    const parsed = Number(nextQuantity);
    if (!Number.isFinite(parsed)) return;
    updateQuantity(addedItem.id, Math.max(1, Math.floor(parsed)));
  };

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <div className="container">
          <h1>Shop All Products</h1>
          <p>Browse our complete range of remotes and accessories</p>

          <div className="hero-badges">
            <span>Quality Tested</span>
            <span>Fast Shipping</span>
          </div>
        </div>
      </div>

	      <div className="shop-content">
	        <div className="container shop-grid">
	          <aside className="filters filters-desktop">
	            <FiltersPanel
	              brands={brands}
	              searchQuery={searchQuery}
	              selectedCategory={selectedCategory}
	              selectedBrand={selectedBrand}
	              stockStatus={stockStatus}
	              onSearchQueryChange={(next) => setSearchQuery(next)}
	              onSelectedCategoryChange={(next) => {
	                setSelectedCategory(next);
	                if (routeCategory && routeCategory !== "all") {
	                  router.push(`/products/${next === "all" ? "all" : next}`);
	                }
	              }}
	              onSelectedBrandChange={(next) => setSelectedBrand(next)}
	              onStockStatusChange={(next) => setStockStatus(next)}
	              onClear={() => {
	                setSearchQuery("");
	                setSelectedCategory(routeCategory && routeCategory !== "all" ? routeCategory : "all");
	                setSelectedBrand("all");
	                setStockStatus("all");
	              }}
	            />
	          </aside>

            <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
              <SheetContent className="filter-drawer">
                <SheetHeader className="filter-drawer-header">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow the catalog by brand, category, and stock status.
                  </SheetDescription>
                </SheetHeader>
                <div className="filter-drawer-content">
                  <FiltersPanel
                    brands={brands}
                    searchQuery={searchQuery}
                    selectedCategory={selectedCategory}
                    selectedBrand={selectedBrand}
                    stockStatus={stockStatus}
                    onSearchQueryChange={(next) => setSearchQuery(next)}
                    onSelectedCategoryChange={(next) => {
                      setSelectedCategory(next);
                      if (routeCategory && routeCategory !== "all") {
                        router.push(`/products/${next === "all" ? "all" : next}`);
                      }
                    }}
                    onSelectedBrandChange={(next) => setSelectedBrand(next)}
                    onStockStatusChange={(next) => setStockStatus(next)}
                    onClear={() => {
                      setSearchQuery("");
                      setSelectedCategory(
                        routeCategory && routeCategory !== "all" ? routeCategory : "all",
                      );
                      setSelectedBrand("all");
                      setStockStatus("all");
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>

          <main>
            <div className="products-header">
              <p className="product-count">
                Showing{" "}
                {filteredProducts.length === 0 ? 0 : (clampedPage - 1) * PAGE_SIZE + 1}{" "}
                – {Math.min(clampedPage * PAGE_SIZE, filteredProducts.length)} of{" "}
                {filteredProducts.length} products
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="filter-toggle-btn"
                onClick={() => setIsFilterDrawerOpen(true)}
                aria-label="Open filters"
              >
                ☰ Filters
              </Button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="no-products">No products found.</div>
            ) : (
              <>
                <div className="products-grid">
                  {pageProducts.map((product) => (
                    <div
                      key={product.id}
                      className="product-card-animated"
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={(nextProduct) => {
                          addToCart(nextProduct);
                          setAddedItem(nextProduct);
                        }}
                      />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pager" aria-label="Pagination">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="pager-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={clampedPage <= 1}
                    >
                      Prev
                    </Button>

                    <div className="pager-pages">
                      {visiblePages.map((p, idx) =>
                        p === "…" ? (
                          <span key={`dots-${idx}`} className="pager-dots">
                            …
                          </span>
                        ) : (
                          <Button
                            key={p}
                            type="button"
                            variant={p === clampedPage ? "default" : "outline"}
                            size="sm"
                            className={`pager-page ${p === clampedPage ? "active" : ""}`}
                            onClick={() => setCurrentPage(Number(p))}
                          >
                            {p}
                          </Button>
                        ),
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="pager-btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={clampedPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {isModalOpen && (
        <div className="cart-modal-backdrop" onClick={() => setAddedItem(null)}>
          <div
            className="cart-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Added to cart"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cart-modal-close"
              onClick={() => setAddedItem(null)}
              aria-label="Close"
            >
              x
            </button>
            <div className="cart-modal-body">
              <img
                src={addedItem?.image}
                alt={addedItem?.name || "Product"}
                onError={(e: any) => {
                  e.currentTarget.src = "/images/mainlogo.png";
                }}
              />
              <div className="cart-modal-info">
                <p className="cart-modal-brand">{addedItem?.brand || "Remote Pro"}</p>
                <h3>{addedItem?.name}</h3>
                {addedItem?.description && (
                  <p className="cart-modal-description">{addedItem.description}</p>
                )}
                <div className="cart-modal-meta">
                  <div>
                    <span>Category</span>
                    <strong>
                      {addedItem?.category === "car" ? "Car Remote" : "Garage Remote"}
                    </strong>
                  </div>
                  <div>
                    <span>Condition</span>
                    <strong>{addedItem?.condition || "Brand New"}</strong>
                  </div>
                </div>
                <div className="cart-modal-pricing">
                  <div>
                    <span>Price</span>
                    {modalPrice.hasDiscount ? (
                      <div className="modal-price-stack">
                        <span className="modal-price-original">
                          AU${modalPrice.originalPrice.toFixed(2)}
                        </span>
                        <strong className="modal-price-discounted">
                          AU${modalPrice.finalPrice.toFixed(2)}
                        </strong>
                      </div>
                    ) : (
                      <strong>AU${modalPrice.finalPrice.toFixed(2)}</strong>
                    )}
                  </div>
                  <div className="cart-modal-pricing-qty">
                    <span>Quantity</span>
                    <div className="cart-modal-qty-controls">
                      <button
                        type="button"
                        className="cart-modal-qty-btn"
                        onClick={() => handleModalQuantityChange(modalQuantity - 1)}
                        disabled={modalQuantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={modalQuantity}
                        onChange={(e) => handleModalQuantityChange(e.target.value)}
                        aria-label="Quantity"
                      />
                      <button
                        type="button"
                        className="cart-modal-qty-btn"
                        onClick={() => handleModalQuantityChange(modalQuantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="cart-modal-actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddedItem(null)}
                  >
                    Continue Shopping
                  </Button>
                  <Button asChild>
                    <Link href="/cart">View Cart</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

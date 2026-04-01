"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "../../../../context/StoreContext";
import { useCart } from "../../../../context/CartContext";
import { useAuth } from "../../../../context/AuthContext";
import {
  getPriceBreakdown,
  isDiscountEligible,
} from "../../../../utils/pricing";
import {
  getCategoryPageTitle,
  matchesProductToCategory,
  resolveProductCategory,
} from "../../../../lib/category";
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

function applyParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | null,
) {
  if (value == null || value === "") searchParams.delete(key);
  else searchParams.set(key, value);
}

function normalizeBrand(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeSearchTerm(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getProductBrandSearchText(product: any) {
  return [
    product?.brand,
    product?.name,
    product?.title,
    product?.model,
    product?.description,
    product?.sku,
    product?.product_code,
    product?.product_description,
    product?.product_group,
  ]
    .filter(Boolean)
    .map((value) => normalizeSearchTerm(value))
    .join(" ");
}

function matchesBrandFilter(product: any, selectedBrand: string) {
  if (!selectedBrand || selectedBrand === "all") return true;

  const selectedBrandKey = normalizeBrand(selectedBrand);
  if (!selectedBrandKey) return true;

  if (normalizeBrand(product?.brand) === selectedBrandKey) return true;

  const selectedTerm = normalizeSearchTerm(selectedBrand);
  if (!selectedTerm) return false;

  const productText = getProductBrandSearchText(product);
  if (!productText) return false;

  const paddedText = ` ${productText} `;
  const paddedTerm = ` ${selectedTerm} `;

  if (paddedText.includes(paddedTerm) || productText.includes(selectedTerm)) {
    return true;
  }

  // Fallback: support brand labels that include extra words (e.g. "ELSEMA RECEIVERS").
  const tokens = selectedTerm.split(" ").filter((token) => token.length >= 3);
  if (tokens.length === 0) return false;
  return tokens.some((token) => productText.includes(token));
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
    <div className="grid gap-4">
      <h3 className="text-lg font-semibold text-neutral-900">Filters</h3>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-neutral-700">Search</label>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:outline-none transition"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-neutral-700">
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onSelectedCategoryChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:outline-none transition"
        >
          <option value="all">All Products</option>
          <option value="garage">Garage & Gate</option>
          <option value="car">Automotive</option>
          <option value="home">For The Home</option>
          <option value="locksmith">Locksmithing</option>
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-neutral-700">Brand</label>
        <select
          value={selectedBrand}
          onChange={(e) => onSelectedBrandChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:outline-none transition"
        >
          {brands.map((brand) => {
            const b = String(brand);
            return (
              <option key={b} value={b}>
                {b === "all" ? "All Brands" : b}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-neutral-700">Stock</label>
        <select
          value={stockStatus}
          onChange={(e) => onStockStatusChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary focus:ring-1 focus:outline-none transition"
        >
          <option value="all">All</option>
          <option value="in">In Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full mt-2"
        onClick={onClear}
      >
        Clear Filters
      </Button>
    </div>
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
  const initialCategoryFromUrl = resolveProductCategory(
    searchParams.get("category") || "all",
  );
  const routeCategoryKey = useMemo(
    () => resolveProductCategory(routeCategory || "all"),
    [routeCategory],
  );

  const initialCategory =
    routeCategoryKey !== "all" ? routeCategoryKey : initialCategoryFromUrl;

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
    const urlCategory = resolveProductCategory(
      searchParams.get("category") || "all",
    );
    const urlPage = Number(searchParams.get("page") || "1");

    setSelectedBrand(urlBrand);
    setSearchQuery(urlSearch);
    if (routeCategoryKey === "all") setSelectedCategory(urlCategory);
    else setSelectedCategory(routeCategoryKey);
    setCurrentPage(Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), routeCategoryKey]);

  const brands = useMemo<string[]>(() => {
    const brandValues = (products || [])
      .map((p: any) => (p?.brand ? String(p.brand) : ""))
      .filter(Boolean) as string[];
    const unique = Array.from(new Set<string>(brandValues));
    return ["all", ...unique];
  }, [products]);

  const brandsWithSelected = useMemo(() => {
    if (!selectedBrand || selectedBrand === "all") return brands;
    const selectedKey = normalizeBrand(selectedBrand);
    const hasSelected = brands.some((b) => normalizeBrand(b) === selectedKey);
    if (hasSelected) return brands;
    return ["all", selectedBrand, ...brands.filter((b) => b !== "all")];
  }, [brands, selectedBrand]);

  // Keep brand query param case-insensitive while still selecting a visible option value.
  useEffect(() => {
    if (!selectedBrand || selectedBrand === "all") return;
    const selectedKey = normalizeBrand(selectedBrand);
    const matched = brands.find((b) => normalizeBrand(b) === selectedKey);
    if (matched && matched !== selectedBrand) {
      setSelectedBrand(matched);
    }
  }, [brands, selectedBrand]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) =>
      matchesProductToCategory(p, selectedCategory),
    );

    if (selectedBrand !== "all") {
      result = result.filter((p) => matchesBrandFilter(p, selectedBrand));
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

    if (routeCategoryKey === "all") {
      applyParam(
        next,
        "category",
        selectedCategory === "all" ? null : selectedCategory,
      );
    }

    const nextQs = next.toString();
    const nextUrl = nextQs ? `${pathname}?${nextQs}` : pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) window.history.replaceState(null, "", nextUrl);
  }, [
    pathname,
    selectedBrand,
    searchQuery,
    selectedCategory,
    clampedPage,
    routeCategoryKey,
  ]);

  const visiblePages = useMemo(() => {
    const pages = new Set<number | string>([1, totalPages]);
    for (let p = clampedPage - 2; p <= clampedPage + 2; p += 1) {
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
    const sorted = Array.from(pages).sort(
      (a: any, b: any) => a - b,
    ) as number[];
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
  const modalPrice = getPriceBreakdown(addedItem?.price || 0, hasDiscount, {
    promotions,
    product: addedItem,
  });

  const handleModalQuantityChange = (nextQuantity: any) => {
    if (!addedItem) return;
    const parsed = Number(nextQuantity);
    if (!Number.isFinite(parsed)) return;
    updateQuantity(addedItem.id, Math.max(1, Math.floor(parsed)));
  };

  const handleCategorySelectChange = (next: string) => {
    const nextCategory = resolveProductCategory(next);
    setSelectedCategory(nextCategory);
    if (routeCategoryKey !== "all") {
      router.push(`/products/${nextCategory === "all" ? "all" : nextCategory}`);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(routeCategoryKey !== "all" ? routeCategoryKey : "all");
    setSelectedBrand("all");
    setStockStatus("all");
  };

  const pageTitle = (() => {
    const brandTitle = String(selectedBrand || "").trim();
    if (brandTitle && selectedBrand !== "all") return brandTitle;
    if (routeCategoryKey !== "all")
      return getCategoryPageTitle(routeCategory || selectedCategory);
    if (selectedCategory !== "all")
      return getCategoryPageTitle(selectedCategory);
    return "Shop All Products";
  })();

  return (
    <div className="animate-fadeIn">
      <div className="container py-8 sm:py-10">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(26,122,110,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,57,43,0.10),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(251,248,245,0.88))] p-7 shadow-panel backdrop-blur sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {pageTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Browse our complete range of remotes and accessories.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-4 py-2 text-xs font-extrabold text-accent-dark">
              Quality Tested
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-xs font-extrabold text-primary-dark">
              Fast Shipping
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:items-start">
          <aside className="hidden rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur xl:block">
            <FiltersPanel
              brands={brandsWithSelected}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedBrand={selectedBrand}
              stockStatus={stockStatus}
              onSearchQueryChange={(next) => setSearchQuery(next)}
              onSelectedCategoryChange={handleCategorySelectChange}
              onSelectedBrandChange={(next) => setSelectedBrand(next)}
              onStockStatusChange={(next) => setStockStatus(next)}
              onClear={resetFilters}
            />
          </aside>

          <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
            <SheetContent className="xl:hidden">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow the catalog by brand, category, and stock status.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 grid gap-4">
                <FiltersPanel
                  brands={brandsWithSelected}
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  selectedBrand={selectedBrand}
                  stockStatus={stockStatus}
                  onSearchQueryChange={(next) => setSearchQuery(next)}
                  onSelectedCategoryChange={handleCategorySelectChange}
                  onSelectedBrandChange={(next) => setSelectedBrand(next)}
                  onStockStatusChange={(next) => setStockStatus(next)}
                  onClear={resetFilters}
                />
              </div>
            </SheetContent>
          </Sheet>

          <main className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-600">
                Showing{" "}
                {filteredProducts.length === 0
                  ? 0
                  : (clampedPage - 1) * PAGE_SIZE + 1}{" "}
                – {Math.min(clampedPage * PAGE_SIZE, filteredProducts.length)}{" "}
                of {filteredProducts.length} products
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="xl:hidden"
                onClick={() => setIsFilterDrawerOpen(true)}
                aria-label="Open filters"
              >
                ☰ Filters
              </Button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/70 p-6 text-sm font-semibold text-neutral-700">
                No products found.
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
                  {pageProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(nextProduct) => {
                        addToCart(nextProduct);
                        setAddedItem(nextProduct);
                      }}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div
                    className="mt-8 flex flex-wrap items-center justify-center gap-2"
                    aria-label="Pagination"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={clampedPage <= 1}
                    >
                      Prev
                    </Button>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {visiblePages.map((p, idx) =>
                        p === "…" ? (
                          <span
                            key={`dots-${idx}`}
                            className="px-2 text-sm font-semibold text-neutral-400"
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={p}
                            type="button"
                            variant={p === clampedPage ? "default" : "outline"}
                            size="sm"
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
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
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
        <div
          className="fixed inset-0 z-[1600] flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setAddedItem(null)}
        >
          <div
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-strong max-sm:max-h-[calc(100vh-2rem)] max-sm:overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Added to cart"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 p-4">
              <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-neutral-600">
                Added to cart
              </div>
              <button
                type="button"
                className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-200"
                onClick={() => setAddedItem(null)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start sm:p-6">
              <img
                src={addedItem?.image}
                alt={addedItem?.name || "Product"}
                className="mx-auto h-28 w-28 rounded-2xl border border-neutral-200 bg-neutral-50 object-contain p-3 sm:mx-0 sm:h-32 sm:w-32"
                onError={(e: any) => {
                  e.currentTarget.src = "/images/mainlogo.png";
                }}
              />
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-dark">
                  {addedItem?.brand || "Remote Pro"}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">
                  {addedItem?.name}
                </h3>
                {addedItem?.description && (
                  <p className="mt-2 text-sm leading-7 text-neutral-600 line-clamp-3">
                    {addedItem.description}
                  </p>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                      Price
                    </div>
                    <div className="mt-2">
                      {modalPrice.hasDiscount ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-neutral-400 line-through">
                            AU${modalPrice.originalPrice.toFixed(2)}
                          </span>
                          <strong className="text-lg font-extrabold text-neutral-900">
                            AU${modalPrice.finalPrice.toFixed(2)}
                          </strong>
                        </div>
                      ) : (
                        <strong className="text-lg font-extrabold text-neutral-900">
                          AU${modalPrice.finalPrice.toFixed(2)}
                        </strong>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                      Quantity
                    </div>
                    <div className="mt-2 inline-flex items-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
                      <button
                        type="button"
                        className="h-10 w-10 text-lg font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
                        onClick={() =>
                          handleModalQuantityChange(modalQuantity - 1)
                        }
                        disabled={modalQuantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={modalQuantity}
                        onChange={(e) =>
                          handleModalQuantityChange(e.target.value)
                        }
                        aria-label="Quantity"
                        className="h-10 w-14 border-x border-neutral-200 text-center text-sm font-extrabold text-neutral-900 outline-none"
                      />
                      <button
                        type="button"
                        className="h-10 w-10 text-lg font-semibold text-neutral-800 hover:bg-neutral-100"
                        onClick={() =>
                          handleModalQuantityChange(modalQuantity + 1)
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setAddedItem(null)}
                  >
                    Continue Shopping
                  </Button>
                  <Button asChild className="w-full sm:w-auto">
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

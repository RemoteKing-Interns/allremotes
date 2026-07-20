"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "../../../context/StoreContext";
import ProductCard from "../../../components/ProductCard";
import {
  matchesProductToCategory,
  resolveProductsCategoryFromMenu,
  toProductsCategoryPath,
} from "../../../lib/category";

const CATEGORY_SUBTITLES: Record<string, string> = {
  garage: "Explore our wide range of garage and gate automation products",
  car: "Find the perfect automotive keys and remotes for your vehicle",
  home: "Discover home automation solutions and remotes",
  locksmith: "Professional locksmithing tools and equipment",
  all: "Browse all products",
};

const CATEGORY_TITLES: Record<string, string> = {
  garage: "Garage & Gate",
  car: "Automotive",
  home: "For The Home",
  locksmith: "Locksmithing",
  all: "All Products",
};

export default function CategoryPageClient({ category }: { category: string }) {
  const { getNavigation, getProducts } = useStore();
  const navigationMenu = getNavigation();
  const allProducts = getProducts() || [];

  const menuCategoryKey = category;
  const productsCategory = resolveProductsCategoryFromMenu(menuCategoryKey);
  const productsListingPath = toProductsCategoryPath(menuCategoryKey);

  // Try nav first, then fall back to a synthetic menuItem based on resolved category
  const navMenuItem = navigationMenu[menuCategoryKey];
  const resolvedKey = productsCategory === "all" ? "all" : productsCategory;
  const menuItem = navMenuItem || {
    title: CATEGORY_TITLES[resolvedKey] || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    path: productsListingPath,
  };

  const visibleColumns = (menuItem?.columns || [])
    .map((col: any) => ({
      ...col,
      items: (col.items || []).filter((i: any) => !i?.hidden),
    }))
    .filter((col: any) => (col.items || []).length > 0);

  const products = allProducts.filter((p: any) =>
    matchesProductToCategory(p, productsCategory),
  );

  const subtitle = CATEGORY_SUBTITLES[resolvedKey] || "Browse our products";

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      {category !== "contact" && (
        <div className="border-b border-neutral-200 bg-white">
          <div className="container mx-auto max-w-6xl px-4 py-14 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
              {menuItem.title}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-neutral-500">
              {subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Category Sections / Sub-navigation */}
      {visibleColumns.length > 0 && (
        <div className="border-b border-neutral-100 bg-white">
          <div className="container mx-auto max-w-6xl px-4 py-12">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {visibleColumns.map((column: any, index: number) => (
                <div key={index}>
                  <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                    {column.title}
                  </h2>
                  <div className="grid gap-2">
                    {column.items.map((item: any, itemIndex: number) => (
                      <Link
                        key={itemIndex}
                        href={
                          category === "shop-by-brand"
                            ? `/brands/${encodeURIComponent(item.name)}`
                            : productsListingPath
                        }
                        className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50">
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="h-6 w-6 object-contain"
                            onError={(e: any) => {
                              e.currentTarget.src = "/images/mainlogo.png";
                            }}
                          />
                        </span>
                        <span className="min-w-0 flex-1 break-words text-sm font-semibold text-neutral-800 transition-colors group-hover:text-primary">
                          {item.name}
                        </span>
                        <svg className="ml-auto h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 && category !== "contact" && (
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Featured Products</h2>
            <Link
              href={productsListingPath}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              View All
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {products.slice(0, 8).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

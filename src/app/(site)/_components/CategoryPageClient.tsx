"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "../../../context/StoreContext";
import ProductCard from "../../../components/ProductCard";
import {
  matchesSelectedCategory,
  resolveProductsCategoryFromMenu,
  toProductsCategoryPath,
} from "../../../lib/category";

export default function CategoryPageClient({ category }: { category: string }) {
  const { getNavigation, getProducts } = useStore();
  const navigationMenu = getNavigation();
  const allProducts = getProducts() || [];

  const categoryMap: Record<string, string> = {
    "garage-gate": "garage-gate",
    automotive: "automotive",
    "for-the-home": "for-the-home",
    locksmithing: "locksmithing",
    "shop-by-brand": "shop-by-brand",
    support: "support",
    contact: "contact",
  };

  const menuCategoryKey = categoryMap[category] || category;
  const menuItem = navigationMenu[menuCategoryKey];
  const productsCategory = resolveProductsCategoryFromMenu(menuCategoryKey);
  const productsListingPath = toProductsCategoryPath(menuCategoryKey);

  const visibleColumns = (menuItem?.columns || [])
    .map((col: any) => ({
      ...col,
      items: (col.items || []).filter((i: any) => !i?.hidden),
    }))
    .filter((col: any) => (col.items || []).length > 0);

  const products = allProducts.filter((p: any) =>
    matchesSelectedCategory(p?.category, productsCategory),
  );

  const subtitleMap: Record<string, string> = {
    "garage-gate": "Explore our wide range of garage and gate automation products",
    automotive: "Find the perfect automotive keys and remotes for your vehicle",
    "for-the-home": "Discover home automation solutions and remotes",
    locksmithing: "Professional locksmithing tools and equipment",
    "shop-by-brand": "Shop by your favorite brand",
    support: "Get help, find manuals, and access support resources",
    contact: "Get in touch with our team",
  };

  if (!menuItem || menuItem.hidden) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-3xl font-extrabold text-neutral-900">Page Not Found</h1>
          <p className="mt-3 text-neutral-500">The page you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

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
              {subtitleMap[category] || "Browse our products"}
            </p>
          </div>
        </div>
      )}

      {/* Category Sections / Sub-navigation */}
      {visibleColumns.length > 0 && (
        <div className="border-b border-neutral-100 bg-white/50">
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
                            ? `/products/all?brand=${encodeURIComponent(
                                String(item.name || "").toUpperCase(),
                              )}`
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

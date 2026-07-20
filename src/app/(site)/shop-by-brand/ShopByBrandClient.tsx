"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ArrowLeft, Building2, Package } from "lucide-react";
import ProductCard from "../../../components/ProductCard";
import ProductImage from "../../../components/images/ProductImage";

interface Brand {
  name: string;
  image: string | null;
  productCount: number;
}

interface Product {
  id: string;
  brand?: string;
  brandImage?: string;
  [key: string]: any;
}

export default function ShopByBrandClient() {
  const searchParams = useSearchParams();
  const selectedBrand = searchParams.get("brand");

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setAllProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Derive unique brands from products
  const brands = useMemo<Brand[]>(() => {
    const map = new Map<string, Brand>();
    allProducts.forEach((p) => {
      const name = p.brand?.trim();
      if (!name) return;
      const key = name.toUpperCase();
      if (!map.has(key)) {
        map.set(key, { name, image: p.brandImage || null, productCount: 0 });
      } else {
        // Prefer product with a brandImage
        if (!map.get(key)!.image && p.brandImage) {
          map.get(key)!.image = p.brandImage;
        }
      }
      map.get(key)!.productCount++;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  // Filter brands by search
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(query));
  }, [brands, searchQuery]);

  // Get products for selected brand
  const brandProducts = useMemo(() => {
    if (!selectedBrand) return [];
    return allProducts.filter(
      (p: any) => p.brand?.toUpperCase() === selectedBrand.toUpperCase()
    );
  }, [allProducts, selectedBrand]);

  const selectedBrandInfo = useMemo(() => {
    return brands.find((b) => b.name.toUpperCase() === selectedBrand?.toUpperCase());
  }, [brands, selectedBrand]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500">
          <div className="w-6 h-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
          Loading brands...
        </div>
      </div>
    );
  }

  // Show products view when brand is selected
  if (selectedBrand) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        {/* Header */}
        <div className="border-b border-neutral-200 bg-white">
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <Link
              href="/shop-by-brand"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} />
              Back to All Brands
            </Link>
          </div>
        </div>

        {/* Brand Hero */}
        <div className="bg-white border-b border-neutral-200">
          <div className="container mx-auto max-w-6xl px-4 py-12 text-center">
            {selectedBrandInfo?.image ? (
              <img
                src={selectedBrandInfo.image}
                alt={selectedBrand}
                className="h-20 w-auto mx-auto mb-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-20 h-20 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 size={40} className="text-neutral-400" />
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
              {selectedBrand}
            </h1>
            <p className="mt-2 text-lg text-neutral-500">
              {brandProducts.length} {brandProducts.length === 1 ? "product" : "products"} available
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto max-w-6xl px-4 py-12">
          {brandProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {brandProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package size={64} className="mx-auto text-neutral-300 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">
                No products found
              </h3>
              <p className="text-neutral-500">
                We couldn&apos;t find any products for {selectedBrand}.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show brands grid view
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            Shop by Brand
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500">
            Browse all {brands.length} brands and find the perfect products for your needs
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-neutral-500">
                {filteredBrands.length} {filteredBrands.length === 1 ? "brand" : "brands"} found
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {filteredBrands.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.name}
                href={`/shop-by-brand?brand=${encodeURIComponent(brand.name.toUpperCase())}`}
                className="group bg-white rounded-xl border border-neutral-200 p-4 hover:border-primary/30 hover:shadow-md transition-all text-center"
              >
                {/* Brand Logo */}
                <div className="relative aspect-square bg-neutral-50 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  {brand.image ? (
                    <ProductImage
                      src={brand.image}
                      alt={brand.name}
                      fallbackLetter={brand.name?.charAt(0)?.toUpperCase()}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-contain p-3"
                    />
                  ) : (
                    <Building2 size={40} className="text-neutral-400" />
                  )}
                </div>
                {/* Brand Name */}
                <h3 className="font-semibold text-neutral-900 text-sm truncate" title={brand.name}>
                  {brand.name}
                </h3>
                {/* Product Count */}
                <p className="text-xs text-neutral-500 mt-1">
                  {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 size={64} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">
              No brands found
            </h3>
            <p className="text-neutral-500">
              {searchQuery
                ? `No brands match "${searchQuery}"`
                : "No brands available at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

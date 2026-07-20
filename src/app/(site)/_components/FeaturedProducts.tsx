"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";

export default function FeaturedProducts({ products }: { products: any[] }) {
  return (
    <section className="container py-10 sm:py-14">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Featured Products
        </h2>
        <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
          Browse our most popular remote controls across car, garage, and
          access-control categories.
        </p>
      </div>
      {products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/70 p-6 text-sm font-semibold text-neutral-700">
          No products available right now.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      <div className="mt-8">
        <Link
          href="/products/all"
          className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-extrabold text-white shadow-soft hover:bg-primary-dark"
        >
          Shop All Products
        </Link>
      </div>
    </section>
  );
}

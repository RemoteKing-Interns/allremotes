import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductListClient from "../_components/ProductListClient";
import { getCategoryPageTitle } from "@/lib/category";
import { getSiteUrl } from "@/lib/site-url";
import { getServerProducts } from "@/lib/server-products";

const REMOVED_CATEGORIES = new Set(["car", "automotive", "auto", "vehicle"]);

function redirectIfRemoved(category: string) {
  if (REMOVED_CATEGORIES.has(category.toLowerCase())) {
    redirect("/products/all");
  }
}

function getCategoryDescription(category: string) {
  const descriptions: Record<string, string> = {
    garage:
      "Shop replacement garage door remotes and gate remotes for Merlin, B&D, ATA, Chamberlain, Gliderol, Steel-Line and more. Quality-tested with 12-month warranty, fast Australia-wide shipping.",
    home:
      "Discover home remotes for TVs, air conditioners, ceiling fans, alarms and more at ALLREMOTES Australia.",
    locksmith:
      "Browse locksmith tools, key programmers, picks, decoders and key-cutting accessories at ALLREMOTES Australia.",
  };
  return (
    descriptions[category] ||
    "Browse our complete range of replacement remotes, receivers and accessories at ALLREMOTES Australia."
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  redirectIfRemoved(category);
  const display = getCategoryPageTitle(category);
  const description = getCategoryDescription(category);
  const title = `${display} Remotes for Sale Australia | ALLREMOTES`;
  const canonical = `/products/${category}`;

  return {
    title,
    description,
    keywords: [
      "remote",
      "remotes",
      `${category} remote`,
      "Australia",
      "replacement remote",
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_AU",
      siteName: "ALLREMOTES Australia",
      url: canonical,
      images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
    },
  };
}

function CategoryJsonLd({ category }: { category: string }) {
  const siteUrl = getSiteUrl();
  const display = getCategoryPageTitle(category);
  const description = getCategoryDescription(category);
  const categoryUrl = `${siteUrl}/products/${category}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: display,
      url: categoryUrl,
      description,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: display,
          item: categoryUrl,
        },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, '\\u003C') }}
    />
  );
}

export default async function ProductsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  redirectIfRemoved(category);
  const initialProducts = await getServerProducts();
  return (
    <>
      <Suspense
        fallback={
          <div className="container py-8 sm:py-10">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 p-7 shadow-panel backdrop-blur sm:p-10">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {getCategoryPageTitle(category)} Remotes
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                {getCategoryDescription(category)}
              </p>
            </div>
          </div>
        }
      >
        <ProductListClient routeCategory={category} initialProducts={initialProducts} />
      </Suspense>
      <CategoryJsonLd category={category} />
    </>
  );
}

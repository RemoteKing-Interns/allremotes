import React, { Suspense } from "react";
import type { Metadata } from "next";
import ProductListClient from "../_components/ProductListClient";
import { getCategoryPageTitle } from "@/lib/category";
import { getSiteUrl } from "@/lib/site-url";

function getCategoryDescription(category: string) {
  const descriptions: Record<string, string> = {
    garage:
      "Find garage door remotes, gate remotes, receivers and opener accessories for all major brands.",
    car:
      "Shop replacement car remotes, key fobs, transponder keys and key shells for popular vehicles.",
    home:
      "Discover home remotes for TVs, air conditioners, ceiling fans, alarms and more.",
    locksmith:
      "Browse locksmith tools, key programmers, picks, decoders and key-cutting accessories.",
  };
  return (
    descriptions[category] ||
    "Shop compatible replacement remotes and accessories at ALLREMOTES Australia."
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
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
      images: [{ url: "/images/3.jpg" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/images/3.jpg" }],
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
        <ProductListClient routeCategory={category} />
      </Suspense>
      <CategoryJsonLd category={category} />
    </>
  );
}

import React, { Suspense } from "react";
import type { Metadata } from "next";
import ProductListClient from "../_components/ProductListClient";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "All Remotes for Sale Australia | ALLREMOTES",
  description:
    "Browse all garage, gate, car and home remotes at ALLREMOTES Australia. Replacement remotes, motors and accessories with fast shipping and warranty.",
  keywords: [
    "all remotes",
    "garage remote",
    "gate remote",
    "car remote",
    "replacement remote",
    "Australia",
  ],
  alternates: {
    canonical: "/products/all",
  },
  openGraph: {
    title: "All Remotes for Sale Australia | ALLREMOTES",
    description:
      "Browse all garage, gate, car and home remotes at ALLREMOTES Australia. Replacement remotes, motors and accessories with fast shipping and warranty.",
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    url: "/products/all",
    images: [{ url: "/images/3.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Remotes for Sale Australia | ALLREMOTES",
    description:
      "Browse all garage, gate, car and home remotes at ALLREMOTES Australia. Replacement remotes, motors and accessories with fast shipping and warranty.",
    images: [{ url: "/images/3.jpg" }],
  },
};

function AllProductsJsonLd() {
  const siteUrl = getSiteUrl();
  const allUrl = `${siteUrl}/products/all`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "All Remotes for Sale",
      url: allUrl,
      description:
        "Browse all garage, gate, car and home remotes at ALLREMOTES Australia.",
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
          name: "All Remotes",
          item: allUrl,
        },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}

export default function ProductsAllPage() {
  return (
    <>
      <Suspense fallback={null}>
        <ProductListClient routeCategory="all" />
      </Suspense>
      <AllProductsJsonLd />
    </>
  );
}

import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductListClient from "../../products/_components/ProductListClient";
import { getSiteUrl } from "@/lib/site-url";

const PRIORITY_BRANDS = [
  "Merlin",
  "ATA",
  "B&D",
  "Chamberlain",
  "Gliderol",
  "Elsema",
  "Centurion",
  "Hormann",
];

function normalizeBrandParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getBrandTitle(brand: string) {
  return `${brand} Remote Controls | ALLREMOTES Australia`;
}

function getBrandDescription(brand: string) {
  return `Shop ${brand} garage door and gate remote controls at ALLREMOTES Australia. Find compatible ${brand} remote replacements with fast local shipping, warranty and expert support.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: rawBrand } = await params;
  const brand = normalizeBrandParam(rawBrand);
  const title = getBrandTitle(brand);
  const description = getBrandDescription(brand);
  const canonical = `/brands/${encodeURIComponent(brand)}`;

  return {
    title,
    description,
    keywords: [
      `${brand} remote`,
      `${brand} garage door remote`,
      `${brand} gate remote`,
      "remote control",
      "replacement remote",
      "Australia",
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

function BrandJsonLd({ brand }: { brand: string }) {
  const siteUrl = getSiteUrl();
  const brandUrl = `${siteUrl}/brands/${encodeURIComponent(brand)}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${brand} Remote Controls`,
      url: brandUrl,
      description: getBrandDescription(brand),
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
          name: `${brand} Remotes`,
          item: brandUrl,
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

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: rawBrand } = await params;
  const brand = normalizeBrandParam(rawBrand);

  const validatedBrand = PRIORITY_BRANDS.includes(brand) ? brand : null;
  if (!validatedBrand) {
    notFound();
  }

  return (
    <>
      <Suspense fallback={null}>
        <ProductListClient
          routeCategory="all"
          routeBrand={validatedBrand}
        />
      </Suspense>
      <BrandJsonLd brand={brand} />
    </>
  );
}

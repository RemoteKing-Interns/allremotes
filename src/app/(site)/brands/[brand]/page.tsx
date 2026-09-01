import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductListClient from "../../products/_components/ProductListClient";
import { getSiteUrl } from "@/lib/site-url";
import { getServerProducts } from "@/lib/server-products";

const PRIORITY_BRANDS = [
  "Merlin",
  "ATA",
  "B&D",
  "Chamberlain",
  "Gliderol",
  "Elsema",
  "Centurion",
  "Hormann",
  "Steel-Line",
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
  const brandSeoCopy: Record<string, string> = {
    Merlin:
      "Buy Merlin garage door remotes online in Australia. Compatible replacement remotes for Merlin E960M, E970M, E964M, E8003 and Merlin+ range. 433MHz, 12-month warranty, fast shipping.",
    ATA:
      "Buy ATA garage door remotes online in Australia. Compatible replacement remotes for ATA PTX5, PTX4, PTX6 and SecuraCode openers. Rolling code, 12-month warranty, fast shipping.",
    "B&D":
      "Buy B&D garage door remotes online in Australia. Compatible replacement remotes for B&D TriTran, TriTran+ and Controll-A-Door openers. 12-month warranty, fast shipping nationwide.",
    Chamberlain:
      "Buy Chamberlain garage door remotes online in Australia. Compatible replacement remotes for Chamberlain, LiftMaster and MotorLift openers. 12-month warranty, fast shipping.",
    Gliderol:
      "Buy Gliderol garage door remotes online in Australia. Compatible replacement remotes for Gliderol GTS, GTA and GRD series openers. 12-month warranty, fast shipping nationwide.",
    Steel_Line:
      "Buy Steel-Line garage door remotes online in Australia. Compatible replacement remotes for Steel-Line openers. 12-month warranty, fast shipping nationwide.",
    Elsema:
      "Buy Elsema gate and garage remotes online in Australia. Compatible replacement remotes for Elsema 433MHz receivers. 12-month warranty, fast shipping.",
    Centurion:
      "Buy Centurion gate remotes online in Australia. Compatible replacement remotes for Centurion sliding and swing gate motors. 12-month warranty, fast shipping.",
    Hormann:
      "Buy Hormann garage door remotes online in Australia. Compatible replacement remotes for Hormann openers. 12-month warranty, fast shipping nationwide.",
  };
  const key = brand.replace(/[^a-zA-Z&]/g, "").replace(/&/g, "D");
  return (
    brandSeoCopy[key] ||
    `Shop ${brand} garage door and gate remote controls at ALLREMOTES Australia. Find compatible ${brand} remote replacements with fast local shipping, warranty and expert support.`
  );
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

  const initialProducts = await getServerProducts();

  return (
    <>
      <Suspense
        fallback={
          <div className="container py-8 sm:py-10">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 p-7 shadow-panel backdrop-blur sm:p-10">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {brand} Remote Controls
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                {getBrandDescription(brand)}
              </p>
            </div>
          </div>
        }
      >
        <ProductListClient
          routeCategory="all"
          routeBrand={validatedBrand}
          initialProducts={initialProducts}
        />
      </Suspense>
      <BrandJsonLd brand={brand} />
    </>
  );
}

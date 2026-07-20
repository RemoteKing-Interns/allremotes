import React from "react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getPublicProducts } from "@/lib/public-site";
import { enrichProductWithS3Images } from "@/lib/products-json";
import { getSiteUrl } from "@/lib/site-url";

const SITE_NAME = "ALLREMOTES Australia";

function getCategoryDisplayName(category: string) {
  const names: Record<string, string> = {
    garage: "Garage & Gate",
    car: "Car",
    home: "For The Home",
    locksmith: "Locksmithing",
    all: "All",
  };
  return names[category] || category;
}

const getProductCached = unstable_cache(
  async (id: string) => {
    const products = await getPublicProducts();
    const product = products.find((p) => String(p.id) === id);
    if (!product) return null;
    return enrichProductWithS3Images(product);
  },
  ["product-detail-metadata"],
  { revalidate: 60, tags: ["product-metadata"] },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductCached(id);

  if (!product) {
    return { title: "Product not found | ALLREMOTES" };
  }

  const title = `${product.name || "Product"}${
    product.brand ? ` - ${product.brand}` : ""
  } Remote | ALLREMOTES Australia`;
  const description = `Buy ${product.name || ""} ${
    product.brand ?? ""
  } remote at ALLREMOTES Australia. SKU: ${
    product.sku || product.rk_sku || ""
  }. Compatible replacement with fast shipping, warranty and expert support.`;
  const canonical = `/product/${id}`;
  const images = product.image
    ? [{ url: product.image }]
    : [{ url: "/images/3.jpg" }];

  return {
    title,
    description,
    keywords: [
      product.name || "",
      product.brand || "",
      `${product.brand || ""} remote`,
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
      siteName: SITE_NAME,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

function buildProductJsonLd(product: any, siteUrl: string) {
  const id = String(product.id || "");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || "",
    image: Array.isArray(product.images)
      ? product.images.filter((img: any) => typeof img === "string")
      : product.image
        ? [product.image]
        : [],
    sku: product.sku || product.rk_sku || "",
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${encodeURIComponent(id)}`,
      priceCurrency: "AUD",
      price: product.price ? Number(product.price).toFixed(2) : "0.00",
      availability:
        product.inStock !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

function buildBreadcrumbJsonLd(product: any, siteUrl: string) {
  const category = String(product.category || "").toLowerCase();
  const categoryDisplay = getCategoryDisplayName(category);
  const productId = String(product.id || "");

  return {
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
        name: categoryDisplay || "Products",
        item: `${siteUrl}/products/${category || "all"}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name || "Product",
        item: `${siteUrl}/product/${encodeURIComponent(productId)}`,
      },
    ],
  };
}

async function ProductJsonLd({ id }: { id: string }) {
  const product = await getProductCached(id);
  if (!product) return null;
  const siteUrl = getSiteUrl();
  const schemas = [
    buildProductJsonLd(product, siteUrl),
    buildBreadcrumbJsonLd(product, siteUrl),
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      {children}
      <ProductJsonLd id={id} />
    </>
  );
}

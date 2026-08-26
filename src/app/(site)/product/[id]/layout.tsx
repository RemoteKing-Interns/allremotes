import React from "react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getPublicProducts } from "@/lib/public-site";
import { enrichProductWithS3Images } from "@/lib/products-json";
import { getSiteUrl } from "@/lib/site-url";
import { toAbsoluteImageUrl } from "@/lib/images";
import { getCategoryPageTitle } from "@/lib/category";
import { notFound, redirect } from "next/navigation";
import { isUuid, extractIdFromSlugParam, generateProductSlugUrl } from "@/lib/server-products";

const SITE_NAME = "ALLREMOTES Australia";

function getCategoryDisplayName(category: string) {
  return getCategoryPageTitle(category || "all");
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
  const { id: rawId } = await params;
  const id = extractIdFromSlugParam(rawId);
  const product = await getProductCached(id);

  if (!product) {
    return { title: "Product not found | ALLREMOTES" };
  }

  const siteUrl = getSiteUrl();
  const title = `Buy ${product.name || "Product"} | ALLREMOTES Australia`;
  const description = `Buy ${product.name || ""} ${
    product.brand ? `by ${product.brand}` : ""
  } at ALLREMOTES Australia. SKU: ${
    product.sku || product.rk_sku || ""
  }. Compatible replacement with fast shipping, 30-day returns and expert support.`;
  const canonical = generateProductSlugUrl(id, product.name || "", product.sku || product.rk_sku);
  const primaryImage = toAbsoluteImageUrl(
    product.image || "/images/3.jpg",
    siteUrl,
  );
  const images = [{ url: primaryImage }];

  return {
    title,
    description,
    keywords: [
      product.name || "",
      product.brand || "",
      product.sku || product.rk_sku || "",
      `${product.brand || ""} remote`,
      `${product.name || ""} remote`,
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
  const allImages = Array.isArray(product.images)
    ? product.images.filter((img: any) => typeof img === "string")
    : product.image
      ? [product.image]
      : [];
  const imageUrls = allImages.length
    ? allImages.map((img: string) => toAbsoluteImageUrl(img, siteUrl))
    : [toAbsoluteImageUrl("/images/3.jpg", siteUrl)];

  const offer = {
    "@type": "Offer" as const,
    url: `${siteUrl}${generateProductSlugUrl(id, product.name || "", product.sku || product.rk_sku)}`,
    priceCurrency: "AUD",
    price: product.price ? Number(product.price).toFixed(2) : "0.00",
    availability:
      product.inStock !== false
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };

  const aggregateRating =
    product.ratingValue && product.reviewCount
      ? {
          "@type": "AggregateRating" as const,
          ratingValue: Number(product.ratingValue).toFixed(1),
          reviewCount: Number(product.reviewCount),
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || "",
    image: imageUrls,
    description:
      product.description ||
      product.short_description ||
      `Buy ${product.name || ""} at ALLREMOTES Australia.`,
    url: `${siteUrl}${generateProductSlugUrl(id, product.name || "", product.sku || product.rk_sku)}`,
    sku: product.sku || product.rk_sku || "",
    mpn: product.sku || product.rk_sku || "",
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    ...(aggregateRating ? { aggregateRating } : {}),
    offers: offer,
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
        name: categoryDisplay,
        item: `${siteUrl}/products/${category || "all"}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name || "Product",
        item: `${siteUrl}${generateProductSlugUrl(productId, product.name || "", product.sku || product.rk_sku)}`,
      },
    ],
  };
}

function ProductJsonLd({ product }: { product: any }) {
  const siteUrl = getSiteUrl();
  const schemas = [
    buildProductJsonLd(product, siteUrl),
    buildBreadcrumbJsonLd(product, siteUrl),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is this remote compatible with my motor?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes, this ${product.name || "remote"} is a compatible replacement for the motor models listed in the product description. Check the compatibility list above or contact us if you're unsure.`,
          },
        },
        {
          "@type": "Question",
          name: "How long does shipping take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Orders placed before 2pm AEST ship the same business day. Standard delivery takes 2-5 business days to most Australian addresses. Express shipping is available at checkout.",
          },
        },
        {
          "@type": "Question",
          name: "Does this remote come with a warranty?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, all remotes come with a 12-month warranty. If your remote stops working within the warranty period, contact us for a replacement.",
          },
        },
        {
          "@type": "Question",
          name: "Can I program this remote myself?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, most remotes can be programmed in under five minutes. Programming instructions are included with every remote. Check our support guides for step-by-step videos.",
          },
        },
        {
          "@type": "Question",
          name: "What is your return policy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We offer a 30-day return policy. Items must be in original, resaleable condition. Buyer pays return shipping. Returns are only accepted within Australia.",
          },
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

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = extractIdFromSlugParam(rawId);
  const product = await getProductCached(id);
  if (!product) notFound();

  if (isUuid(rawId)) {
    const slugUrl = generateProductSlugUrl(id, product.name || "", product.sku || product.rk_sku);
    redirect(slugUrl);
  }

  return (
    <>
      {children}
      <ProductJsonLd product={product} />
    </>
  );
}

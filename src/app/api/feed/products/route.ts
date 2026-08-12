import { NextResponse } from "next/server";
import { getPrimaryImage } from "@/lib/images";
import { getCategoryPageTitle } from "@/lib/category";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { enrichProductsWithS3Images } from "@/lib/products-json";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://allremotes.com.au";

interface Product {
  id: string;
  name?: string;
  model?: string;
  description?: string;
  price: number;
  comparePrice?: number; // Maximum Retail Price (strikethrough price)
  sku?: string;
  brand?: string;
  images?: string[];
  image?: string;
  imgIndex?: number;
  inStock?: boolean;
  category?: string;
}

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif"];

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const absoluteOrRelative = /^https?:\/\//i.test(url) || url.startsWith("/");
  if (!absoluteOrRelative) return false;
  const path = url.split("?")[0].toLowerCase();
  return ALLOWED_IMAGE_EXTS.some((ext) => path.endsWith(ext));
}

function getProductImage(product: Product): string {
  const primary = getPrimaryImage(product);
  if (!primary || !isValidImageUrl(primary)) return `${BASE_URL}/images/mainlogo.png`;
  if (/^https?:\/\//i.test(primary)) return primary;
  return `${BASE_URL}${primary.startsWith("/") ? "" : "/"}${primary}`;
}

function getProductTitle(product: Product): string {
  const brand = product.brand?.trim() || "All Remotes";
  const name = product.name?.trim() || "";
  if (name.toLowerCase().startsWith(brand.toLowerCase())) return name;
  const model = product.model?.trim();
  if (model) return `${brand} ${model}`;
  if (name) return `${brand} ${name}`;
  return `${brand} Replacement Remote`;
}

function getProductDescription(product: Product): string {
  const raw =
    product.description?.trim() ||
    product.model?.trim() ||
    product.name?.trim() ||
    "";
  const text = stripHtml(raw);
  if (text) {
    return `${text} High-quality professional replacement remote with reliable performance. Free shipping Australia-wide, 30-day returns and 12-month warranty.`;
  }
  return `High-quality ${getProductTitle(product)}. Professional replacement remote with reliable performance.`;
}

function getAvailability(product: Product): string {
  const inStock = product.inStock ?? true;
  return inStock ? "in stock" : "out of stock";
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)} AUD`;
}

function getAdditionalImageLinks(product: Product): string {
  const allImages = Array.isArray(product.images) ? product.images : [];
  return allImages
    .slice(1, 5)
    .filter(isValidImageUrl)
    .map((img) => {
      const absolute = /^https?:\/\//i.test(img)
        ? img
        : `${BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
      return `<g:additional_image_link>${escapeXml(absolute)}</g:additional_image_link>`;
    })
    .join("\n    ");
}

const BLOCKED_TERMS = [
  "clone",
  "cloning",
  "duplicator",
  "universal",
  "hacking",
  "hack",
  "tracker",
  "tracking",
  "surveillance",
  "spy",
  "spying",
  "gps",
  "monitor",
  "monitoring",
];

function isBlockedProduct(product: Product): boolean {
  const text = [
    product.name,
    product.model,
    product.description,
    product.sku,
    product.category,
    (product as any).seo_title,
    (product as any).tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return BLOCKED_TERMS.some((term) => text.includes(term));
}

function getProductType(product: Product): string {
  return getCategoryPageTitle(product.category || "all");
}

function getShippingXml(): string {
  return `
    <g:shipping>
      <g:country>AU</g:country>
      <g:service>Standard</g:service>
      <g:price>0.00 AUD</g:price>
    </g:shipping>`;
}

function hasRealIdentifiers(product: Product): boolean {
  const mpn = String(product.sku?.trim() || "");
  const gtin = String((product as any).gtin?.trim() || "");
  // Treat the SKU as an MPN only if it looks like a real manufacturer code
  const looksLikeSku = mpn.length >= 3 && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(mpn);
  return Boolean(gtin) || looksLikeSku;
}

function generateProductXml(product: Product): string {
  const id = escapeXml(product.id);
  const title = escapeXml(getProductTitle(product));
  const description = escapeXml(getProductDescription(product));
  const link = escapeXml(`${BASE_URL}/product/${id}`);
  const imageLink = escapeXml(getProductImage(product));
  const availability = getAvailability(product);
  const price = formatPrice(product.price);
  const brand = escapeXml(product.brand?.trim() || "All Remotes");
  const sku = escapeXml(product.sku?.trim() || product.id);
  const productType = escapeXml(getProductType(product));
  const additionalImages = getAdditionalImageLinks(product);
  const shipping = getShippingXml();

  const realIdentifiers = hasRealIdentifiers(product);
  const mpn = realIdentifiers ? escapeXml(product.sku?.trim() || product.id) : "";
  const gtin = escapeXml(String((product as any).gtin?.trim() || ""));
  const identifierExists = realIdentifiers ? "yes" : "no";

  const idBlock = realIdentifiers && mpn ? `\n    <g:mpn>${mpn}</g:mpn>` : "";
  const gtinBlock = gtin ? `\n    <g:gtin>${gtin}</g:gtin>` : "";

  return `
  <item>
    <g:id>${id}</g:id>
    <g:title>${title}</g:title>
    <g:description>${description}</g:description>
    <link>${link}</link>
    <g:image_link>${imageLink}</g:image_link>
    ${additionalImages ? `${additionalImages}\n    ` : ""}<g:availability>${availability}</g:availability>
    <g:price>${price}</g:price>
    <g:brand>${brand}</g:brand>
    <g:condition>new</g:condition>
    <g:sku>${sku}</g:sku>
    <g:product_type>${productType}</g:product_type>
    ${idBlock}${gtinBlock}
    <g:identifier_exists>${identifierExists}</g:identifier_exists>
    <g:excluded_destination>local_inventory_ads</g:excluded_destination>
    <g:excluded_destination>free_local_listings</g:excluded_destination>
    ${shipping}
  </item>`;
}

export async function GET() {
  try {
    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured. Feed requires MongoDB." },
        { status: 503 }
      );
    }

    const db = await getDb();
    const col = db.collection("products");
    const mongoProducts = await col.find({}).toArray();
    const productsArray = enrichProductsWithS3Images(mongoProducts);
    
    const items = productsArray
      .filter((p: Product) => p && p.id && p.price && !isBlockedProduct(p))
      .map((p: Product) => generateProductXml(p))
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AllRemotes Products Feed</title>
    <link>${BASE_URL}</link>
    <description>Product feed for AllRemotes.com.au</description>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Error generating product feed:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Error</title>
    <description>Failed to generate product feed</description>
  </channel>
</rss>`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      }
    );
  }
}

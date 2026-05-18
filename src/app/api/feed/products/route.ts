import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://allremotes.com.au";
const PRODUCTS_JSON_PATH = path.resolve(process.cwd(), "public/allremotes.products.json");

interface Product {
  id: string;
  name?: string;
  model?: string;
  description?: string;
  price: number;
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

function getProductImage(product: Product): string {
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const imgIndex = product?.imgIndex ?? 0;
    if (Number.isFinite(imgIndex) && imgIndex >= 0 && imgIndex < product.images.length) {
      return product.images[imgIndex];
    }
    return product.images[0];
  }
  if (product?.image) {
    return product.image;
  }
  return `${BASE_URL}/images/mainlogo.png`;
}

function getProductTitle(product: Product): string {
  const brand = product.brand?.trim() || "ALLREMOTES";
  const model = product.model?.trim() || product.name?.trim() || "Replacement Remote";
  return `${brand} ${model}`;
}

function getProductDescription(product: Product): string {
  return (
    product.description?.trim() ||
    `High-quality ${getProductTitle(product)}. Professional replacement remote with reliable performance.`
  );
}

function getAvailability(product: Product): string {
  const inStock = product.inStock ?? true;
  return inStock ? "in stock" : "out of stock";
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)} AUD`;
}

function generateProductXml(product: Product): string {
  const id = escapeXml(product.id);
  const title = escapeXml(getProductTitle(product));
  const description = escapeXml(getProductDescription(product));
  const link = escapeXml(`${BASE_URL}/product/${id}`);
  const imageLink = escapeXml(getProductImage(product));
  const availability = getAvailability(product);
  const price = formatPrice(product.price);
  const brand = escapeXml(product.brand?.trim() || "ALLREMOTES");
  const sku = escapeXml(product.sku?.trim() || product.id);

  return `
  <item>
    <g:id>${id}</g:id>
    <g:title>${title}</g:title>
    <g:description>${description}</g:description>
    <link>${link}</link>
    <g:image_link>${imageLink}</g:image_link>
    <g:availability>${availability}</g:availability>
    <g:price>${price}</g:price>
    <g:brand>${brand}</g:brand>
    <g:condition>new</g:condition>
    <g:sku>${sku}</g:sku>
    ${product.category ? `<g:product_category>${escapeXml(product.category)}</g:product_category>` : ""}
  </item>`;
}

export async function GET() {
  try {
    const raw = await fs.readFile(PRODUCTS_JSON_PATH, "utf8");
    const products = JSON.parse(raw);
    const productsArray = Array.isArray(products) ? products : [];
    
    const items = productsArray
      .filter((p: Product) => p && p.id && p.price)
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

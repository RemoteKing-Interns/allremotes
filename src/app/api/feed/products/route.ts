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

function getProductImage(product: Product): string {
  const primary = getPrimaryImage(product);
  if (!primary) return `${BASE_URL}/images/mainlogo.png`;
  if (/^https?:\/\//i.test(primary)) return primary;
  return `${BASE_URL}${primary.startsWith("/") ? "" : "/"}${primary}`;
}

function getProductTitle(product: Product): string {
  const brand = product.brand?.trim() || "ALLREMOTES";
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

function getReturnPolicy(): string {
  return `Returns accepted within 30 days. Must be in original, resaleable condition. Buyer pays return shipping. Returns only accepted within Australia. Certain items (motor parts, control boards, etc.) are non-returnable.`;
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)} AUD`;
}

function getAdditionalImageLinks(product: Product): string {
  const allImages = Array.isArray(product.images) ? product.images : [];
  return allImages
    .slice(1, 5)
    .map((img) => {
      const absolute = /^https?:\/\//i.test(img)
        ? img
        : `${BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
      return `<g:additional_image_link>${escapeXml(absolute)}</g:additional_image_link>`;
    })
    .join("\n    ");
}

function getProductType(product: Product): string {
  return getCategoryPageTitle(product.category || "all");
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
  const mpn = escapeXml(product.sku?.trim() || product.id);
  const productType = escapeXml(getProductType(product));
  const returnPolicy = escapeXml(getReturnPolicy());
  const additionalImages = getAdditionalImageLinks(product);

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
    <g:mpn>${mpn}</g:mpn>
    <g:product_type>${productType}</g:product_type>
    <g:return_policy>${returnPolicy}</g:return_policy>
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

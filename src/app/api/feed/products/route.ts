import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getPrimaryImage } from "@/lib/images";
import { getCategoryPageTitle } from "@/lib/category";
import { mongoEnabled, getDb } from "@/lib/mongo";
import { enrichProductsWithS3Images } from "@/lib/products-json";
import { generateProductSlugUrl } from "@/lib/server-products";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.allremotes.com.au";

interface Product {
  id: string;
  name?: string;
  model?: string;
  description?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  rk_sku?: string;
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

function stripEmojis(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const absoluteOrRelative = /^https?:\/\//i.test(url) || url.startsWith("/");
  if (!absoluteOrRelative) return false;
  const path = url.split("?")[0].toLowerCase();
  return ALLOWED_IMAGE_EXTS.some((ext) => path.endsWith(ext));
}

const S3_BUCKET = "https://allremotes.s3.ap-southeast-2.amazonaws.com";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "allremotes";
const S3_REGION = process.env.AWS_REGION || "ap-southeast-2";

let s3Client: S3Client | null = null;
function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}

const presignCache = new Map<string, { url: string; expires: number }>();
const PRESIGN_TTL = 6 * 24 * 60 * 60 * 1000; // 6 days (URLs valid for 7)

async function presignS3Url(url: string): Promise<string> {
  if (!url.startsWith(S3_BUCKET)) return url;
  const key = url.slice(S3_BUCKET.length + 1).split("?")[0];

  const cached = presignCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.url;

  try {
    const signedUrl = await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }),
      { expiresIn: 604800 }
    );
    presignCache.set(key, { url: signedUrl, expires: Date.now() + PRESIGN_TTL });
    return signedUrl;
  } catch {
    return `${BASE_URL}/images/mainlogo.png`;
  }
}

async function getProductImage(product: Product): Promise<string> {
  const primary = getPrimaryImage(product);
  if (!primary || !isValidImageUrl(primary)) return `${BASE_URL}/images/mainlogo.png`;
  if (/^https?:\/\//i.test(primary)) return presignS3Url(primary);
  return `${BASE_URL}${primary.startsWith("/") ? "" : "/"}${primary}`;
}

function getProductTitle(product: Product): string {
  const brand = product.brand?.trim() || "All Remotes";
  const name = stripEmojis(product.name?.trim() || "");
  if (name.toLowerCase().startsWith(brand.toLowerCase())) return name;
  const model = stripEmojis(product.model?.trim() || "");
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
  const text = stripEmojis(stripHtml(raw));
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

async function getAdditionalImageLinks(product: Product): Promise<string> {
  const allImages = Array.isArray(product.images) ? product.images : [];
  const images = allImages.slice(1, 5).filter(isValidImageUrl);
  const results = await Promise.all(
    images.map(async (img) => {
      const absolute = /^https?:\/\//i.test(img)
        ? await presignS3Url(img)
        : `${BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
      return `<g:additional_image_link>${escapeXml(absolute)}</g:additional_image_link>`;
    })
  );
  return results.join("\n    ");
}

const BLOCKED_TERMS = [
  "clone",
  "cloning",
  "duplicator",
  "hacking",
  "hack",
  "surveillance",
  "spy",
  "spying",
  "gps",
];

function isBlockedProduct(product: Product): boolean {
  const text = [
    product.name,
    product.sku,
    product.category,
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

async function generateProductXml(product: Product): Promise<string> {
  const id = escapeXml(product.id);
  const title = escapeXml(getProductTitle(product));
  const description = escapeXml(getProductDescription(product));
  const link = escapeXml(`${BASE_URL}${generateProductSlugUrl(id, product.name || "", product.sku || product.rk_sku)}`);
  const imageLink = escapeXml(await getProductImage(product));
  const availability = getAvailability(product);
  const price = formatPrice(product.price);
  const brand = escapeXml(product.brand?.trim() || "All Remotes");
  const sku = escapeXml(product.sku?.trim() || product.id);
  const productType = escapeXml(getProductType(product));
  const additionalImages = await getAdditionalImageLinks(product);
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
    <g:checkout_link_template>${escapeXml(`${BASE_URL}/cart?add=${product.id}`)}</g:checkout_link_template>
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
    const mongoProducts = await col.find({
      $or: [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
        { status: "" },
      ],
    }).toArray();
    const productsArray = enrichProductsWithS3Images(mongoProducts);
    
    const filtered = productsArray.filter((p: Product) => p && p.id && p.price && !isBlockedProduct(p));
    const items = (await Promise.all(filtered.map((p: Product) => generateProductXml(p)))).join("\n");

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

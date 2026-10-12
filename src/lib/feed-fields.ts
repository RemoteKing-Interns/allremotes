// Shared product→marketplace-feed field mapping. Used by the Google/Meta
// XML feed route and the Meta Catalog Batch push so both channels list
// identical data.
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getPrimaryImage } from "@/lib/images";
import { getCategoryPageTitle } from "@/lib/category";
import { generateProductSlugUrl } from "@/lib/server-products";

export const FEED_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.allremotes.com.au";

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripEmojis(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];

export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const absoluteOrRelative = /^https?:\/\//i.test(url) || url.startsWith("/");
  if (!absoluteOrRelative) return false;
  const path = url.split("?")[0].toLowerCase();
  return ALLOWED_IMAGE_EXTS.some((ext) => path.endsWith(ext));
}

const S3_BUCKET = "https://allremotes.s3.ap-southeast-2.amazonaws.com";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "allremotes";
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "ap-southeast-2";

let s3Client: S3Client | null = null;
function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}

const presignCache = new Map<string, { url: string; expires: number }>();
const PRESIGN_TTL = 6 * 24 * 60 * 60 * 1000; // 6 days (URLs valid for 7)

export async function presignS3Url(url: string): Promise<string> {
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
    return `${FEED_BASE_URL}/images/mainlogo.png`;
  }
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

export function isBlockedProduct(product: any): boolean {
  const text = [product.name, product.sku, product.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return BLOCKED_TERMS.some((term) => text.includes(term));
}

export interface FeedFields {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImages: string[];
  availability: string;
  price: string;
  priceNumber: number;
  brand: string;
  sku: string;
  productType: string;
}

// One product -> canonical feed fields. Returns null for products that
// shouldn't be listed (blocked terms, missing id/price).
export async function buildFeedFields(product: any): Promise<FeedFields | null> {
  if (!product || !product.id || !product.price || isBlockedProduct(product)) return null;

  const brand = product.brand?.trim() || "All Remotes";
  const name = stripEmojis(product.name?.trim() || "");
  const model = stripEmojis(product.model?.trim() || "");
  const title = name.toLowerCase().startsWith(brand.toLowerCase())
    ? name
    : model
      ? `${brand} ${model}`
      : name
        ? `${brand} ${name}`
        : `${brand} Replacement Remote`;

  const rawDesc = product.description?.trim() || product.model?.trim() || product.name?.trim() || "";
  const descText = stripEmojis(stripHtml(rawDesc));
  const description = descText
    ? `${descText} High-quality professional replacement remote with reliable performance. Free shipping Australia-wide, 30-day returns and 12-month warranty.`
    : `High-quality ${title}. Professional replacement remote with reliable performance.`;

  const id = String(product.id);
  const primary = getPrimaryImage(product);
  const imageLink = !primary || !isValidImageUrl(primary)
    ? `${FEED_BASE_URL}/images/mainlogo.png`
    : /^https?:\/\//i.test(primary)
      ? await presignS3Url(primary)
      : `${FEED_BASE_URL}${primary.startsWith("/") ? "" : "/"}${primary}`;

  const additionalImages = await Promise.all(
    (Array.isArray(product.images) ? product.images : [])
      .slice(1, 5)
      .filter(isValidImageUrl)
      .map(async (img: string) =>
        /^https?:\/\//i.test(img)
          ? presignS3Url(img)
          : `${FEED_BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`
      )
  );

  return {
    id,
    title,
    description,
    link: `${FEED_BASE_URL}${generateProductSlugUrl(id, product.name || "", product.sku || product.rk_sku)}`,
    imageLink,
    additionalImages,
    availability: (product.inStock ?? true) ? "in stock" : "out of stock",
    price: `${Number(product.price).toFixed(2)} AUD`,
    priceNumber: Number(product.price),
    brand,
    sku: product.sku?.trim() || id,
    productType: getCategoryPageTitle(product.category || "all"),
  };
}

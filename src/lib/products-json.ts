import fs from "fs/promises";
import path from "path";
import { filterS3GeneratedPlaceholders } from "@/lib/images";

const PRODUCTS_JSON_PATH = path.resolve(process.cwd(), "public/allremotes.products.json");
const LEGACY_PRODUCTS_PATH = path.resolve(process.cwd(), "products.json");

// S3 Bucket configuration for product images
const S3_BUCKET_URL = "https://allremotes.s3.ap-southeast-2.amazonaws.com";
const MAX_IMAGES_PER_PRODUCT = 1; // Use only sku-1.png as a fallback; do not guess extra images

/**
 * Generate S3 image URLs for a product based on its SKU
 * Pattern: https://allremotes.s3.ap-southeast-2.amazonaws.com/images/{sku}-1.png
 * Only a single fallback image is generated to avoid broken -2..-5 placeholders.
 */
export function generateS3ImageUrlsFromSku(sku: string | undefined): string[] {
  if (!sku || typeof sku !== "string") return [];
  
  const normalizedSku = sku.trim();
  if (!normalizedSku) return [];
  
  const imageUrls: string[] = [];
  for (let i = 1; i <= MAX_IMAGES_PER_PRODUCT; i++) {
    imageUrls.push(`${S3_BUCKET_URL}/images/${normalizedSku}-${i}.png`);
  }
  
  return imageUrls;
}

/**
 * Enrich product data with S3 image URLs based on SKU
 * If product already has images, they are preserved and S3 URLs are appended
 */
export function enrichProductWithS3Images(product: any): any {
  if (!product || typeof product !== "object") return product;
  
  const sku = product.sku || product.product_code || product.SKU;
  const s3ImageUrls = generateS3ImageUrlsFromSku(sku);
  
  // Get existing images as-is (preserve database order)
  let existingImages: string[] = Array.isArray(product.images)
    ? product.images.filter((img: any) => typeof img === "string" && img.trim())
    : [];

  // Clean old S3 placeholder URLs (sku-2.png ... sku-5.png) if sku-1.png is present
  existingImages = filterS3GeneratedPlaceholders(existingImages, sku);

  // If product has a single image field that's a URL, add it to the list
  if (typeof product.image === "string" && product.image.trim() &&
      !existingImages.includes(product.image)) {
    existingImages.push(product.image);
  }

  // Preserve database image order - only add S3 URLs if product has no images
  let finalImages = existingImages;
  if (existingImages.length === 0) {
    finalImages = s3ImageUrls;
  }
  
  // Remove duplicates while preserving order
  const uniqueImages = Array.from(new Set(finalImages));
  
  return {
    ...product,
    images: uniqueImages,
    // Set primary image if not already set
    image: product.image || uniqueImages[0] || "",
    // Track that images were auto-generated from SKU
    _s3ImagesGenerated: s3ImageUrls.length > 0 && existingImages.length === 0,
    _skuUsedForImages: sku,
  };
}

/**
 * Enrich an array of products with S3 image URLs
 */
export function enrichProductsWithS3Images(products: any[]): any[] {
  if (!Array.isArray(products)) return [];
  return products.map(enrichProductWithS3Images);
}

async function ensureProductsFile() {
  try {
    await fs.access(PRODUCTS_JSON_PATH);
  } catch {
    // Try legacy path
    try {
      await fs.access(LEGACY_PRODUCTS_PATH);
      return LEGACY_PRODUCTS_PATH;
    } catch {
      await fs.writeFile(PRODUCTS_JSON_PATH, JSON.stringify([], null, 2) + "\n", "utf8");
    }
  }
  return PRODUCTS_JSON_PATH;
}

export async function readProductsJson(): Promise<any[]> {
  const filePath = await ensureProductsFile();
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

export async function writeProductsJson(products: any[]) {
  const tmpPath = `${PRODUCTS_JSON_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(products, null, 2) + "\n", "utf8");
  await fs.rename(tmpPath, PRODUCTS_JSON_PATH);
}


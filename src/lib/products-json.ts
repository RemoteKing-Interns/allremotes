import fs from "fs/promises";
import path from "path";

const PRODUCTS_JSON_PATH = path.resolve(process.cwd(), "public/allremotes.products.json");
const LEGACY_PRODUCTS_PATH = path.resolve(process.cwd(), "products.json");

// S3 Bucket configuration for product images
const S3_BUCKET_URL = "https://allremotes.s3.ap-southeast-2.amazonaws.com";
const MAX_IMAGES_PER_PRODUCT = 5; // Maximum number of images to check per SKU

/**
 * Generate S3 image URLs for a product based on its SKU
 * Pattern: https://allremotes.s3.ap-southeast-2.amazonaws.com/images/{sku}-1.png
 * Supports multiple images: sku-1.png, sku-2.png, ..., sku-5.png
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
  
  // Get existing images
  const existingImages = Array.isArray(product.images) 
    ? product.images.filter((img: any) => typeof img === "string" && img.trim())
    : [];
  
  // If product has a single image field that's a URL, add it to the list
  if (typeof product.image === "string" && product.image.trim() && !existingImages.includes(product.image)) {
    existingImages.push(product.image);
  }
  
  // Combine existing images with S3 URLs (S3 URLs come first as they are the primary source)
  const combinedImages = [...s3ImageUrls, ...existingImages];
  
  // Remove duplicates while preserving order
  const uniqueImages = Array.from(new Set(combinedImages));
  
  return {
    ...product,
    images: uniqueImages,
    // Set primary image if not already set
    image: product.image || uniqueImages[0] || "",
    // Track that images were auto-generated from SKU
    _s3ImagesGenerated: s3ImageUrls.length > 0,
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


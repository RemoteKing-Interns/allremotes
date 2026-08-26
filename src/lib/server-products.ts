import { getPublicProducts, type ProductRecord } from "./public-site";
import { matchesProductToCategory } from "./category";
export { generateSlug, isUuid, generateProductSlugUrl, extractIdFromSlugParam } from "./product-slugs";

const S3_BUCKET_URL = "https://allremotes.s3.ap-southeast-2.amazonaws.com";

function normalizeImageUrl(image: string | undefined, sku: string | undefined): string {
  if (!image) {
    if (sku) return `${S3_BUCKET_URL}/images/${sku}-1.png`;
    return "";
  }
  if (image.startsWith("http")) return image;
  if (image.startsWith("/remotes/")) {
    const filename = image.split("/").pop() || "";
    return `${S3_BUCKET_URL}/images/remotes/${filename}`;
  }
  if (image.startsWith("/images/")) {
    const filename = image.split("/").pop() || "";
    return `${S3_BUCKET_URL}/images/${filename}`;
  }
  const filename = image.split("/").pop() || "";
  return `${S3_BUCKET_URL}/images/${filename}`;
}

export type ServerProduct = {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  brand?: string;
  category?: string;
  inStock: boolean;
  image: string;
  images: string[];
  imgIndex: number;
  sku?: string;
  rk_sku?: string;
  description?: string;
  seo_title?: string;
  tags?: string;
  features?: string;
  compatibility?: string;
  condition?: string;
  mpn?: string;
  gtin?: string;
};

export function normalizeServerProduct(p: ProductRecord): ServerProduct {
  const sku = p.sku || (p as any).product_code || (p as any).SKU || "";
  const rawImages = Array.isArray(p.images)
    ? p.images.filter((img): img is string => typeof img === "string" && Boolean(img.trim()))
    : [];
  const images = rawImages.length > 0
    ? rawImages.map((img) => normalizeImageUrl(img, sku))
    : (typeof p.image === "string" && p.image.trim() ? [normalizeImageUrl(p.image, sku)] : []);

  const primaryImage = images.length > 0
    ? images[typeof p.imgIndex === "number" && p.imgIndex < images.length ? p.imgIndex : 0]
    : normalizeImageUrl(p.image, sku);

  return {
    id: String(p.id || ""),
    name: String(p.name || ""),
    price: Number(p.price) || 0,
    comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
    brand: p.brand || undefined,
    category: p.category || undefined,
    inStock: Boolean(p.inStock ?? false),
    image: primaryImage,
    images,
    imgIndex: typeof p.imgIndex === "number" ? p.imgIndex : 0,
    sku: sku || undefined,
    rk_sku: (p as any).rk_sku || undefined,
    description: p.description || undefined,
    seo_title: (p as any).seo_title || undefined,
    tags: (p as any).tags || undefined,
    features: (p as any).features || undefined,
    compatibility: (p as any).compatibility || undefined,
    condition: p.condition || undefined,
    mpn: p.mpn || undefined,
    gtin: p.gtin || undefined,
  };
}

export async function getServerProducts(): Promise<ServerProduct[]> {
  const raw = await getPublicProducts();
  return raw.map(normalizeServerProduct);
}

export async function getServerProductsByCategory(category: string): Promise<ServerProduct[]> {
  const all = await getServerProducts();
  if (category === "all") return all;
  return all.filter((p) => matchesProductToCategory(p, category));
}

export async function getServerProductsByBrand(brand: string): Promise<ServerProduct[]> {
  const all = await getServerProducts();
  const normalizedBrand = brand.toLowerCase().replace(/&/g, "and");
  return all.filter((p) => {
    const pb = (p.brand || "").toLowerCase().replace(/&/g, "and");
    return pb === normalizedBrand;
  });
}

export async function getServerProductById(id: string): Promise<ServerProduct | null> {
  const all = await getServerProducts();
  return all.find((p) => p.id === id) || null;
}

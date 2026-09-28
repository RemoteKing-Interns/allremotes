import { guessCategory } from "@/lib/channels/ebay";
import { getProductSkuForKey } from "@/lib/products-import";
import { toPublicImageUrls } from "@/lib/channels/images";
import { buildFullDescription } from "@/lib/channels/description";
import { getDb } from "@/lib/mongo";
import type { ListingPayload, Marketplace } from "./core";

export async function buildListingPayload(product: any, channel?: Marketplace): Promise<ListingPayload> {
  const sku = product.sku || getProductSkuForKey(product) || product.id;
  const price = Number(product.price || 0);
  const quantity = Number(product.quantity || product.stock || (product.inStock ? 1 : 0));
  const images = await toPublicImageUrls(
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : []
  );
  const brand = (product.brand || "ALLREMOTES").trim();
  const name = (product.model || product.name || sku || "").trim();
  const title = name.toLowerCase().startsWith(brand.toLowerCase())
    ? name
    : `${brand} ${name}`;
  const description =
    buildFullDescription(product) ||
    `High-quality ${title}. Professional replacement remote with reliable performance.`;

  let categoryId: string | undefined;
  if (channel === "temu") {
    // Per-product override wins; catalog-wide default comes from env.
    categoryId = product.marketplaceCategory?.temu || process.env.TEMU_DEFAULT_CATID;
  } else {
    categoryId = product.marketplaceCategory?.ebay;
    if (!categoryId || categoryId === "0") {
      categoryId = await guessCategory(product.name || product.sku || product.id);
      if (categoryId) {
        const db = await getDb();
        const filter = product._id ? { _id: product._id } : { id: product.id };
        await db
          .collection("products")
          .updateOne(filter, { $set: { "marketplaceCategory.ebay": categoryId } });
        product.marketplaceCategory = { ...product.marketplaceCategory, ebay: categoryId };
      }
    }
  }

  return {
    sku,
    title,
    description,
    brand: product.brand || "ALLREMOTES",
    condition: product.condition || "Brand New",
    price,
    currency: process.env.DEFAULT_CURRENCY || "AUD",
    quantity,
    images,
    category: categoryId,
    mpn: product.mpn,
    gtin: product.gtin,
    type: product.type,
    packageWeight: product.packageWeight,
    packageDimensions: product.packageDimensions,
  };
}

import { unstable_cache } from "next/cache";
import { getPublicProductById } from "@/lib/public-site";
import { enrichProductWithS3Images } from "@/lib/products-json";

// Shared by product/[id] layout (metadata + JSON-LD) and page — one cache entry
// per product, one findOne() per miss. Single-doc fetch (~9KB) is fast even on
// a slow DB link, unlike the old getPublicProducts() full-collection scan.
export const getProductDetail = unstable_cache(
  async (id: string) => {
    const product = await getPublicProductById(id);
    if (!product) return null;
    return enrichProductWithS3Images(product);
  },
  ["product-detail"],
  { revalidate: 60, tags: ["products", "product-detail"] },
);

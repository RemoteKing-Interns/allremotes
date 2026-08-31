import { unstable_cache } from "next/cache";
import { getPublicProducts } from "@/lib/public-site";
import { enrichProductWithS3Images } from "@/lib/products-json";
import { extractIdFromSlugParam } from "@/lib/server-products";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

export const runtime = "nodejs";

const getProductCached = unstable_cache(
  async (id: string) => {
    const products = await getPublicProducts();
    const product = products.find((p) => String(p.id) === id);
    if (!product) return null;
    return enrichProductWithS3Images(product);
  },
  ["product-detail-page"],
  { revalidate: 60, tags: ["product-page"] },
);

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = extractIdFromSlugParam(rawId);
  const product = await getProductCached(id);
  if (!product) notFound();

  return <ProductDetailClient initialProduct={product} />;
}

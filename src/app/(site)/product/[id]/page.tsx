import { getProductDetail } from "@/lib/product-detail";
import { extractIdFromSlugParam } from "@/lib/server-products";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

export const runtime = "nodejs";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = extractIdFromSlugParam(rawId);
  const product = await getProductDetail(id);
  if (!product) notFound();

  return <ProductDetailClient initialProduct={product} />;
}

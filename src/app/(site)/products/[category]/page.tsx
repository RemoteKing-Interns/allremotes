import React, { Suspense } from "react";
import ProductListClient from "../_components/ProductListClient";

export default async function ProductsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return (
    <Suspense fallback={null}>
      <ProductListClient routeCategory={category} />
    </Suspense>
  );
}

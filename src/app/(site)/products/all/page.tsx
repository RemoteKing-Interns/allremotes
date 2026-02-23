import React, { Suspense } from "react";
import ProductListClient from "../_components/ProductListClient";

export default function ProductsAllPage() {
  return (
    <Suspense fallback={null}>
      <ProductListClient routeCategory="all" />
    </Suspense>
  );
}

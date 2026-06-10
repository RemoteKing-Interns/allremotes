import { Suspense } from "react";
import ShopByBrandClient from "./ShopByBrandClient";

export default function ShopByBrandPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500">
          <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
          Loading brands...
        </div>
      </div>
    }>
      <ShopByBrandClient />
    </Suspense>
  );
}

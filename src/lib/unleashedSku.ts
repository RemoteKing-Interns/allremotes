export type UnleashedSkuProduct = {
  sku?: unknown;
  rk_sku?: unknown;
  unleashed_product_code?: unknown;
  name?: unknown;
  model?: unknown;
};

export function normalizeUnleashedSku(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

export function getOrderSkuForUnleashed(sku: unknown, externalId: unknown, channel: unknown): string {
  const code = String(sku || "").trim();
  return String(channel || "").toLowerCase() === "ebay" && code === String(externalId || "").trim() ? "" : code;
}

export function createUnleashedSkuMap<T extends UnleashedSkuProduct>(products: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const product of products) {
    for (const code of [product.sku, product.rk_sku, product.unleashed_product_code]) {
      const key = normalizeUnleashedSku(code);
      if (key) map.set(key, product);
    }
  }
  return map;
}

export function getUnleashedProductCode(product?: UnleashedSkuProduct | null): string {
  return String(product?.rk_sku || product?.unleashed_product_code || product?.sku || "").trim();
}

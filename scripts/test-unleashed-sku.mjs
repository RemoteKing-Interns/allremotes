import assert from "node:assert/strict";
import { createUnleashedSkuMap, getOrderSkuForUnleashed, getUnleashedProductCode, normalizeUnleashedSku } from "../src/lib/unleashedSku.ts";

const products = [
  { sku: "AR-REC03", rk_sku: "RK-REC03" },
  { sku: "AR-RCM48", rk_sku: "RK-VR55S" },
];
const bySku = createUnleashedSkuMap(products);

assert.equal(getUnleashedProductCode(bySku.get("AR-REC03")), "RK-REC03");
assert.equal(getUnleashedProductCode(bySku.get(normalizeUnleashedSku("rk-rec03"))), "RK-REC03");
assert.equal(getUnleashedProductCode(bySku.get("AR-RCM48")), "RK-VR55S");
assert.equal(getUnleashedProductCode({ sku: "RK-UNMAPPED" }), "RK-UNMAPPED");
assert.equal(getUnleashedProductCode({ sku: "   " }), "");
assert.equal(getOrderSkuForUnleashed("256625949276", "256625949276", "ebay"), "");
assert.equal(getOrderSkuForUnleashed("RK-CEN-1R", "256625949276", "ebay"), "RK-CEN-1R");
assert.equal(getOrderSkuForUnleashed("123", "123", "manual"), "123");

console.log("Unleashed SKU resolution checks passed.");

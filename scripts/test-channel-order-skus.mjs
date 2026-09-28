import assert from "node:assert/strict";
import { mergeChannelOrderSkus } from "../src/lib/channels/order-item-skus.ts";

const existing = [
  { externalId: "listing-1", color: "Black", sku: "AR-REMOTE1", rk_sku: "RK-REMOTE1" },
  { externalId: "listing-2", color: "Red", sku: "AR-REMOTE2" },
];
const synced = [
  { externalId: "listing-1", color: "black", sku: "listing-1", name: "Remote 1" },
  { externalId: "listing-2", color: "Red", sku: "listing-2", name: "Remote 2" },
  { externalId: "listing-3", sku: "listing-3", name: "Remote 3" },
];
const merged = mergeChannelOrderSkus(synced, existing);

assert.equal(merged[0].sku, "AR-REMOTE1");
assert.equal(merged[0].rk_sku, "RK-REMOTE1");
assert.equal(merged[1].sku, "AR-REMOTE2");
assert.equal(merged[2].sku, "listing-3");
const changed = mergeChannelOrderSkus([{ externalId: "listing-1", color: "black", sku: "AR-NEW" }], existing)[0];
assert.equal(changed.sku, "AR-NEW");
assert.equal(changed.rk_sku, undefined);

console.log("Channel order SKU persistence checks passed.");

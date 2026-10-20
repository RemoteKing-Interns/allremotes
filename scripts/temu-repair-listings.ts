#!/usr/bin/env tsx
/**
 * Repair stale TEMU channelListings: scan TEMU goods list, map
 * outSkuSn -> goodsId, fix externalId mismatches, then sync prices.
 *   npx tsx scripts/temu-repair-listings.ts [--dry]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const DRY = process.argv.includes("--dry");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { temuCall } = await import("../src/lib/channels/temu");
  const { getValidCredentials } = await import("../src/lib/channels/db");
  const creds = await getValidCredentials("temu");

  // pull all goods across search types, map outSkuSn -> goodsId
  const skuToGoods = new Map<string, number>();
  for (const gst of [1, 2, 3, 4, 5]) {
    for (let page = 1; page <= 20; page++) {
      const r: any = await temuCall("bg.local.goods.list.query", { pageNo: page, pageSize: 100, goodsSearchType: gst }, creds);
      const list = r?.result?.goodsList || [];
      for (const g of list) for (const sn of g.outSkuSnList || []) skuToGoods.set(String(sn), g.goodsId);
      if (list.length < 100) break;
      await sleep(400);
    }
  }
  console.log(`TEMU goods scan: ${skuToGoods.size} SKU mappings`);

  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db(process.env.MONGODB_DB || undefined);
  const listings = await db.collection("channelListings").find({ channel: "temu", status: { $ne: "delisted" } }).toArray();
  const products = await db.collection("products").find({}).project({ sku: 1, price: 1 }).toArray();
  const pmap = new Map(products.map((p: any) => [p.sku, p.price]));

  let fixed = 0, repriced = 0, gone = 0, fail = 0;
  for (const l of listings) {
    const baseSku = String(l.sku || "");
    const goodsId = skuToGoods.get(baseSku) || skuToGoods.get(baseSku.replace(/X\d+$/, ""));
    const stored = Number(l.externalId || 0);
    if (!goodsId) { gone++; continue; } // not on TEMU at all
    if (goodsId === stored) continue; // already correct

    if (DRY) { console.log(`DRY  ${baseSku}: externalId ${stored} → ${goodsId}`); continue; }
    await db.collection("channelListings").updateOne({ _id: l._id }, { $set: { externalId: String(goodsId), updatedAt: new Date().toISOString() } });
    fixed++;

    // reprice immediately while we have the goodsId
    const price = Number(pmap.get(baseSku) || 0);
    if (price > 0) {
      try {
        const d: any = await temuCall("bg.local.goods.detail.query", { goodsId }, creds);
        const skuId = d?.result?.skuList?.[0]?.skuId;
        if (skuId) {
          await temuCall("bg.local.goods.priceorder.change.sku.price", {
            goodsId,
            changeSkuPriceDTOList: [{ reason: "Sync to catalog price", skuChangePriceBaseDTOList: [{ skuId: Number(skuId), newSupplierPrice: { amount: price.toFixed(2), currency: "AUD" } }] }],
            rejectSkuPricing: true,
          }, creds);
          repriced++;
          console.log(`FIXED ${baseSku}: goodsId ${goodsId} + price $${price.toFixed(2)}`);
        }
      } catch (e: any) {
        fail++;
        console.log(`FAIL  ${baseSku}: ${String(e?.message || e).slice(0, 120)}`);
      }
      await sleep(400);
    }
  }
  console.log(`\nDONE fixed=${fixed} repriced=${repriced} gone=${gone} fail=${fail}${DRY ? " (dry)" : ""}`);
  await c.close();
  process.exit(0);
})();

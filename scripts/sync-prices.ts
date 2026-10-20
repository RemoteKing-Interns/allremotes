#!/usr/bin/env tsx
/**
 * Sync catalog prices to marketplace listings (eBay + TEMU).
 * eBay multipack SKUs (`<SKU>X<n>`) get price = catalog price * n.
 *   npx tsx scripts/sync-prices.ts --dry            # preview
 *   npx tsx scripts/sync-prices.ts                  # sync all listings
 *   npx tsx scripts/sync-prices.ts --sku AR-RC01    # one product
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const DRY = process.argv.includes("--dry");
const SKU_ARG = process.argv.indexOf("--sku");
const ONLY_SKU = SKU_ARG > -1 ? process.argv[SKU_ARG + 1] : undefined;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db(process.env.MONGODB_DB || undefined);

  const listings = await db.collection("channelListings").find({ status: { $ne: "delisted" } }).toArray();
  const baseSkus = [...new Set(listings.map((l: any) => String(l.sku || "").replace(/X\d+$/, "")))];
  const products = await db.collection("products").find({ sku: { $in: baseSkus } }).toArray();
  const pmap = new Map(products.map((p: any) => [p.sku, p]));

  const { eBayAdapter } = await import("../src/lib/channels/ebay");
  const { temuCall } = await import("../src/lib/channels/temu");
  const { getValidCredentials } = await import("../src/lib/channels/db");

  // TEMU's price API needs goodsId + skuId; listings store goodsId, so
  // resolve skuId once per goods via detail.query and cache it.
  const skuIdCache = new Map<string, string>();
  async function temuSkuId(goodsId: string, creds: any) {
    if (skuIdCache.has(goodsId)) return skuIdCache.get(goodsId);
    const d: any = await temuCall("bg.local.goods.detail.query", { goodsId: Number(goodsId) }, creds);
    const skuId = d?.result?.skuList?.[0]?.skuId;
    if (skuId) skuIdCache.set(goodsId, String(skuId));
    return skuId as string | undefined;
  }

  const creds: Record<string, any> = {};
  for (const ch of new Set(listings.map((l: any) => l.channel))) {
    try { creds[ch] = await getValidCredentials(ch as any); } catch { /* unconnected channel */ }
  }

  let ok = 0, fail = 0, skip = 0;
  for (const l of listings) {
    const listingSku = String(l.sku || "");
    const pack = listingSku.match(/^(.*)X(\d+)$/);
    const baseSku = pack ? pack[1] : listingSku;
    const p: any = pmap.get(baseSku);
    if (!p?.price) { skip++; continue; }
    if (ONLY_SKU && baseSku !== ONLY_SKU) continue;

    const n = pack ? Number(pack[2]) : 1;
    const price = Math.round(Number(p.price) * n * 100) / 100;
    const stock = Number(p.stock || 0);
    const qty = Math.floor(stock / n);
    if (!creds[l.channel]) { skip++; console.log(`SKIP ${listingSku} (${l.channel}) — no creds`); continue; }

    if (DRY) { console.log(`DRY  ${l.channel} ${listingSku} → $${price.toFixed(2)} qty ${qty}`); continue; }
    try {
      if (l.channel === "ebay") {
        await eBayAdapter.updateInventory(listingSku, price, qty, creds.ebay);
      } else if (l.channel === "temu") {
        const goodsId = String(l.externalId || "");
        const skuId = goodsId ? await temuSkuId(goodsId, creds.temu) : undefined;
        if (!skuId) { skip++; console.log(`SKIP ${listingSku} (temu) — no skuId for goods ${goodsId}`); continue; }
        await temuCall("bg.local.goods.priceorder.change.sku.price", {
          goodsId: Number(goodsId),
          changeSkuPriceDTOList: [{
            reason: "Sync to catalog price",
            skuChangePriceBaseDTOList: [{ skuId: Number(skuId), newSupplierPrice: { amount: price.toFixed(2), currency: "AUD" } }],
          }],
          rejectSkuPricing: true,
        }, creds.temu);
      } else { skip++; continue; }
      ok++;
      console.log(`OK   ${l.channel} ${listingSku} → $${price.toFixed(2)} qty ${qty}`);
    } catch (e: any) {
      fail++;
      console.log(`FAIL ${l.channel} ${listingSku}: ${String(e?.message || e).slice(0, 140)}`);
    }
    await sleep(400);
  }
  console.log(`\nDONE ok=${ok} fail=${fail} skipped=${skip}${DRY ? " (dry run)" : ""}`);
  await c.close();
  process.exit(0);
})();

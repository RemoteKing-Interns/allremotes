#!/usr/bin/env tsx
/**
 * Re-pack a TEMU listing: publish <SKU>X<n> at catalog price * n, then
 * delete the old pack goods. Usage:
 *   npx tsx scripts/temu-repack.ts T-021 5 608459273650496   # T-021X3 -> X5
 *   npx tsx scripts/temu-repack.ts T-021 5 --dry
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const DRY = process.argv.includes("--dry");
const SKU = process.argv[2];
const N = Number(process.argv[3]);
const OLD_GOODS = process.argv.find((a) => /^\d{10,}$/.test(a));
if (!SKU || !N) { console.error("usage: temu-repack.ts <sku> <n> [oldGoodsId] [--dry]"); process.exit(1); }

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db(process.env.MONGODB_DB || undefined);
  const p: any = await db.collection("products").findOne({ sku: SKU });
  if (!p) throw new Error(`${SKU} not found`);
  const price = Number(p.price), packPrice = Math.round(price * N * 100) / 100;
  const packSku = `${SKU}X${N}`;
  const stock = Number(p.stock || p.quantity || 0);
  console.log(`${SKU} $${price} → ${packSku} $${packPrice} qty ${Math.floor(stock / N)}${DRY ? " (dry)" : ""}`);
  if (DRY) { await c.close(); return; }

  const { temuAdapter, temuCall } = await import("../src/lib/channels/temu");
  const { buildListingPayload } = await import("../src/lib/channels/payload");
  const creds: any = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID, expiresAt: "" };

  // copy aspect properties from the old pack (or single) goods
  let aspects: Record<string, string[]> = {};
  const srcGoods = Number(OLD_GOODS || (await db.collection("channelListings").findOne({ channel: "temu", sku: SKU }))?.externalId);
  try {
    const detail = await temuCall("bg.local.goods.detail.query", { goodsId: srcGoods }, creds);
    for (const g of detail?.result?.goodsProperties || []) {
      if (g.refPid && g.vid) aspects[String(g.refPid)] = [...(aspects[String(g.refPid)] || []), String(g.vid)];
    }
  } catch (e: any) {
    console.log(`WARN aspect copy failed: ${String(e?.message || e).slice(0, 100)}`);
  }

  const payload = await buildListingPayload(p, "temu");
  payload.sku = packSku;
  payload.title = `${payload.title} — Bundle of ${N}`.slice(0, 500);
  payload.price = packPrice;
  payload.quantity = Math.max(0, Math.floor(stock / N));
  payload.aspects = aspects;

  const r = await temuAdapter.publishListing(payload, creds);
  await db.collection("channelListings").insertOne({
    productId: `${p.id}X${N}`, sku: packSku, channel: "temu",
    externalId: r.externalId, externalUrl: r.externalUrl,
    status: "listed", lastSyncedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  console.log(`OK   ${packSku} published → ${r.externalId}`);

  if (OLD_GOODS) {
    try {
      await temuCall("temu.local.goods.delete", { goodsId: Number(OLD_GOODS) }, creds);
      await db.collection("channelListings").updateMany(
        { channel: "temu", externalId: String(OLD_GOODS) },
        { $set: { status: "delisted", updatedAt: new Date().toISOString() } }
      );
      console.log(`DEL  old pack goods ${OLD_GOODS} deleted`);
    } catch (e: any) {
      console.log(`WARN old goods delete failed: ${String(e?.message || e).slice(0, 120)}`);
    }
  }
  await c.close();
  process.exit(0);
})();

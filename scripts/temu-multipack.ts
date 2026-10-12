#!/usr/bin/env tsx
/**
 * TEMU can't enforce a minimum cart value, so products under $15 are listed
 * as multi-packs: `<SKU>xN` goods priced >= $15 (N = ceil(15/price), min 2).
 * Order import explodes `xN` extCodes back into the base SKU x N units
 * (see fetchOrders in src/lib/channels/temu.ts), so catalog pricing and
 * Unleashed codes keep resolving.
 *
 * After publishing a pack, the original single listing is taken off-shelf
 * via bg.local.goods.sale.status.set so it can no longer sell alone.
 * A final pass also delists older packs whose price now falls under $15
 * (e.g. X3 packs created when the threshold was $10).
 *
 * Usage:
 *   npx tsx scripts/temu-multipack.ts --dry         # preview
 *   npx tsx scripts/temu-multipack.ts --sku AR-27A-5 # one product
 *   npx tsx scripts/temu-multipack.ts                # all sub-$15 TEMU listings
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const DRY = process.argv.includes("--dry");
const SKU_ARG = process.argv.indexOf("--sku");
const SKU = SKU_ARG > -1 ? process.argv[SKU_ARG + 1] : undefined;
const MIN_PRICE = 15;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");

  const listings = await db.collection("channelListings").find({ channel: "temu" }).toArray();
  const listedSkus = new Set(listings.map((l: any) => String(l.sku || "")));
  const listingBySku = new Map(listings.map((l: any) => [String(l.sku || ""), l]));

  const products = await db.collection("products").find(
    { sku: { $in: [...listedSkus] }, price: { $lt: MIN_PRICE, $gt: 0 } },
  ).toArray();
  const targets = SKU ? products.filter((p: any) => p.sku === SKU) : products;
  console.log(`sub-$${MIN_PRICE} TEMU-listed products: ${products.length}${SKU ? ` (filtering to ${SKU})` : ""}`);

  const { temuAdapter, temuCall, findGoodsIdByOutSkuSn } = await import("../src/lib/channels/temu");
  const { buildListingPayload } = await import("../src/lib/channels/payload");
  const creds: any = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID, expiresAt: "" };

  let ok = 0, fail = 0, skipped = 0;
  for (const p of targets) {
    const price = Number(p.price || 0);
    const n = Math.max(2, Math.ceil(MIN_PRICE / price));
    const packSku = `${p.sku}X${n}`;
    const packPrice = Math.round(price * n * 100) / 100;

    if (listedSkus.has(packSku)) {
      // Pack already exists — still make sure the single is delisted.
      const single = listingBySku.get(p.sku) as any;
      if (single?.status !== "delisted" && !DRY) {
        try {
          await temuCall("bg.local.goods.sale.status.set", {
            goodsId: Number(single.externalId), onsale: 0, operationType: 1,
          }, creds);
          await db.collection("channelListings").updateOne({ _id: single._id }, { $set: { status: "delisted" } });
          console.log(`DELIST ${p.sku} (pack already listed)`);
        } catch (e: any) {
          console.log(`WARN could not delist ${p.sku}: ${String(e?.message || e).slice(0, 120)}`);
        }
      } else {
        console.log(`SKIP ${p.sku} — ${packSku} listed, single already delisted`);
        skipped++;
      }
      continue;
    }
    const single = listingBySku.get(p.sku) as any;
    const stock = Number(p.quantity || p.stock || 0);
    if (stock < n) {
      // Can't fill even one pack. Leave the single listed — TEMU's $15 min is
      // cart-level, so it can still sell as an add-on; delisting would just
      // kill a possible sale.
      console.log(`SKIP ${p.sku} — stock ${stock} < pack size ${n}, single left listed`);
      skipped++;
      continue;
    }
    if (DRY) {
      console.log(`DRY  ${p.sku} $${price} -> ${packSku} $${packPrice} qty ${Math.floor(Number(p.quantity || p.stock || 0) / n)} | single goodsId ${single?.externalId}`);
      continue;
    }
    try {
      // Reuse the single's exact goodsProperties as aspects so the pack meets
      // the same category requirements its original listing passed with.
      // If the stored externalId is stale ("mall and goods not match"), recover
      // the real goodsId by outSkuSn and fall back to the default profile.
      let goodsId = Number(single.externalId);
      let aspects: Record<string, string[]> = {};
      try {
        const detail = await temuCall("bg.local.goods.detail.query", { goodsId }, creds);
        const props = (detail?.result?.goodsProperties || []) as Array<{ refPid?: number; vid?: number }>;
        for (const g of props) {
          if (g.refPid && g.vid) aspects[String(g.refPid)] = [...(aspects[String(g.refPid)] || []), String(g.vid)];
        }
      } catch (e: any) {
        const recovered = await findGoodsIdByOutSkuSn(p.sku, creds).catch(() => null);
        if (recovered) {
          goodsId = Number(recovered);
          await db.collection("channelListings").updateOne({ _id: single._id }, { $set: { externalId: recovered } });
          console.log(`     recovered goodsId ${recovered} for ${p.sku}`);
        } else {
          console.log(`     WARN aspect copy skipped for ${p.sku}: ${String(e?.message || e).slice(0, 100)}`);
        }
      }

      const payload = await buildListingPayload(p, "temu");
      payload.sku = packSku;
      payload.title = `${payload.title} — Bundle of ${n}`.slice(0, 500);
      payload.price = packPrice;
      payload.quantity = Math.max(0, Math.floor(Number(payload.quantity || 0) / n));
      payload.aspects = aspects;

      const r = await temuAdapter.publishListing(payload, creds);
      // saveChannelListing upserts on (productId, channel) — the pack needs a
      // suffixed productId or it would overwrite the single's listing record.
      await db.collection("channelListings").insertOne({
        productId: `${p.id}X${n}`, sku: packSku, channel: "temu",
        externalId: r.externalId, externalUrl: r.externalUrl,
        status: "listed", lastSyncedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`OK   ${p.sku} -> ${packSku} $${packPrice} x${payload.quantity} -> ${r.externalId}`);

      // Take the single off-shelf so it can't sell alone anymore.
      try {
        await temuCall("bg.local.goods.sale.status.set", {
          goodsId, onsale: 0, operationType: 1,
        }, creds);
        await db.collection("channelListings").updateOne({ _id: single._id }, { $set: { status: "delisted" } });
        console.log(`     ${p.sku} single delisted`);
      } catch (e: any) {
        console.log(`     WARN could not delist ${p.sku}: ${String(e?.message || e).slice(0, 120)}`);
      }
      ok++;
    } catch (e: any) {
      fail++;
      console.log(`FAIL ${p.sku}: ${String(e?.message || e).slice(0, 160)}`);
    }
    await sleep(1200);
  }
  // Cleanup pass: packs created under the old $10 threshold may now be under
  // $15 (e.g. a $4.75 product packed x3 = $14.25). Delist them on TEMU so only
  // >= $15 packs (created above as X4 etc.) remain sellable.
  const productById = new Map((await db.collection("products").find({}).toArray())
    .map((p: any) => [String(p.id ?? p._id), p]));
  for (const l of await db.collection("channelListings").find({ channel: "temu", status: { $ne: "delisted" } }).toArray()) {
    const m = /^(.*)X(\d+)$/.exec(String(l.sku || ""));
    if (!m) continue;
    const base = [...productById.values()].find((p: any) => p.sku === m[1]);
    const packPrice = base ? Math.round(Number(base.price) * Number(m[2]) * 100) / 100 : 0;
    if (!base || packPrice >= MIN_PRICE) continue;
    if (DRY) {
      console.log(`DRY  delist undersized pack ${l.sku} ($${packPrice})`);
      continue;
    }
    try {
      await temuCall("bg.local.goods.sale.status.set", {
        goodsId: Number(l.externalId), onsale: 0, operationType: 1,
      }, creds);
      await db.collection("channelListings").updateOne({ _id: l._id }, { $set: { status: "delisted" } });
      console.log(`DELIST undersized pack ${l.sku} ($${packPrice})`);
    } catch (e: any) {
      console.log(`WARN could not delist pack ${l.sku}: ${String(e?.message || e).slice(0, 120)}`);
    }
    await sleep(1200);
  }

  console.log(`\ndone. ok=${ok} fail=${fail} skipped=${skipped}`);
  await c.close();
})();

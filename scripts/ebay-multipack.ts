#!/usr/bin/env tsx
/**
 * eBay has no minimum-order-value setting, so sub-$10 products are listed as
 * multi-packs: `<SKU>X<n>` listings priced >= $10 (n = ceil(10/price), min 2).
 * Order import explodes `Xn` SKUs back into the base SKU x n units
 * (see fetchOrders in src/lib/channels/ebay.ts), so catalog pricing and
 * Unleashed codes keep resolving.
 *
 * After publishing a pack, the single's offer is withdrawn so it can't sell
 * alone. Singles stay listed when stock can't fill even one pack.
 *
 * Usage:
 *   npx tsx scripts/ebay-multipack.ts --dry           # preview
 *   npx tsx scripts/ebay-multipack.ts --sku AR-27A-5  # one product
 *   npx tsx scripts/ebay-multipack.ts                 # all sub-$10 eBay listings
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const DRY = process.argv.includes("--dry");
const SKU_ARG = process.argv.indexOf("--sku");
const SKU = SKU_ARG > -1 ? process.argv[SKU_ARG + 1] : undefined;
const MIN_PRICE = 10;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");

  const listings = await db.collection("channelListings").find({ channel: "ebay" }).toArray();
  const listedSkus = new Set(listings.map((l: any) => String(l.sku || "")));
  const listingBySku = new Map(listings.map((l: any) => [String(l.sku || ""), l]));

  const products = await db.collection("products").find(
    { sku: { $in: [...listedSkus] }, price: { $lt: MIN_PRICE, $gt: 0 } },
  ).toArray();
  const targets = SKU ? products.filter((p: any) => p.sku === SKU) : products;
  console.log(`sub-$${MIN_PRICE} ebay-listed products: ${products.length}${SKU ? ` (filtering to ${SKU})` : ""}`);

  const { eBayAdapter, ebayWithdrawOffer } = await import("../src/lib/channels/ebay");
  const { buildListingPayload } = await import("../src/lib/channels/payload");
  const { getValidCredentials } = await import("../src/lib/channels/db");
  const creds = await getValidCredentials("ebay");

  let ok = 0, fail = 0, skipped = 0;
  for (const p of targets) {
    const price = Number(p.price || 0);
    const n = Math.max(2, Math.ceil(MIN_PRICE / price));
    const packSku = `${p.sku}X${n}`;
    const packPrice = Math.round(price * n * 100) / 100;
    const single = listingBySku.get(p.sku) as any;

    if (listedSkus.has(packSku)) {
      if (single && single.status !== "delisted" && single.externalId) {
        if (DRY) {
          console.log(`DRY  withdraw ${p.sku} offer ${single.externalId} (pack listed)`);
        } else {
          try {
            await ebayWithdrawOffer(String(single.externalId), creds.accessToken);
            await db.collection("channelListings").updateOne({ _id: single._id }, { $set: { status: "delisted" } });
            console.log(`DELIST ${p.sku} (pack ${packSku} already listed)`);
          } catch (e: any) {
            console.log(`WARN could not withdraw ${p.sku}: ${String(e?.message || e).slice(0, 120)}`);
          }
        }
      } else {
        console.log(`SKIP ${p.sku} — ${packSku} listed, single already delisted`);
        skipped++;
      }
      continue;
    }

    const stock = Number(p.quantity || p.stock || 0);
    if (stock < n) {
      console.log(`SKIP ${p.sku} — stock ${stock} < pack size ${n}, single left listed`);
      skipped++;
      continue;
    }

    if (DRY) {
      console.log(`DRY  ${p.sku} $${price} -> ${packSku} $${packPrice} qty ${Math.floor(stock / n)} | single offer ${single?.externalId}`);
      continue;
    }

    try {
      const payload = await buildListingPayload(p, "ebay");
      payload.sku = packSku;
      payload.title = `${n}x ${payload.title}`.slice(0, 80);
      payload.price = packPrice;
      payload.quantity = Math.floor(stock / n);

      const r = await eBayAdapter.publishListing(payload, creds);
      await db.collection("channelListings").insertOne({
        productId: `${p.id}X${n}`, sku: packSku, channel: "ebay",
        externalId: r.externalId, externalUrl: r.externalUrl,
        status: "listed", lastSyncedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`OK   ${p.sku} -> ${packSku} $${packPrice} x${payload.quantity} -> offer ${r.externalId}`);

      if (single?.externalId && single.status !== "delisted") {
        try {
          await ebayWithdrawOffer(String(single.externalId), creds.accessToken);
          await db.collection("channelListings").updateOne({ _id: single._id }, { $set: { status: "delisted" } });
          console.log(`     ${p.sku} single withdrawn (offer ${single.externalId})`);
        } catch (e: any) {
          console.log(`     WARN could not withdraw ${p.sku}: ${String(e?.message || e).slice(0, 120)}`);
        }
      }
      ok++;
    } catch (e: any) {
      fail++;
      console.log(`FAIL ${p.sku}: ${String(e?.message || e).slice(0, 160)}`);
    }
    await sleep(1200);
  }

  console.log(`--- done: ${ok} packed, ${skipped} skipped, ${fail} failed`);
  await c.close();
  process.exit(0);
})();

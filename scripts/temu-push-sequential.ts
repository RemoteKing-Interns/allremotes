#!/usr/bin/env tsx
/**
 * Push/activate N garage remotes on TEMU one at a time — only moves to the
 * next SKU once the current good reports published + on-shelf (2/202).
 *
 *   npx tsx scripts/temu-push-sequential.ts            # default list below
 *   npx tsx scripts/temu-push-sequential.ts AR-X AR-Y  # explicit SKUs
 *
 * Unlisted SKUs are published via temuAdapter; existing off-shelf goods are
 * re-activated via bg.local.goods.sale.status.set. Polls publish.status.get
 * every 15s, per-item timeout 20min (TEMU review can stall).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import type { ListingPayload } from "../src/lib/channels/core";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 3 never-listed + 7 in-stock garage remotes currently off-shelf
const DEFAULT_SKUS = [
  "AR-ZTKP", "AR-ZTR", "AR-DTECR-KIT",
  "AR-RCMP7", "AR-RBT02A", "AR-R150", "AR-ZT07B",
  "AR-RCG10B", "AR-RFAC06", "AR-RCMP11",
];

const CATID_REMOTE = process.env.TEMU_DEFAULT_CATID || "14416";
const POLL_MS = 15000;
const TIMEOUT_MS = 20 * 60 * 1000;

(async () => {
  const SKUS = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SKUS;
  const { temuCall, temuAdapter, findGoodsIdByOutSkuSn } = await import("../src/lib/channels/temu");
  const { buildListingPayload } = await import("../src/lib/channels/payload");
  const { saveChannelListing } = await import("../src/lib/channels/db");
  const creds: any = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID, expiresAt: "" };

  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");
  const listings = await db.collection("channelListings").find({ channel: "temu" }).toArray();
  const listedSku = new Map(listings.filter((l: any) => l.status !== "delisted").map((l: any) => [String(l.sku), l]));

  const pubStatus = async (goodsId: number | string) => {
    try {
      const r: any = await temuCall("bg.local.goods.publish.status.get", { goodsIdList: [Number(goodsId)] }, creds);
      const row = r?.result?.goodsPublishStatusList?.[0];
      return { status: row?.status ?? null, subStatus: row?.subStatus ?? null, found: !!row };
    } catch {
      return { status: null, subStatus: null, found: true }; // rate-limit etc — retry next poll
    }
  };

  // Drive a good toward on-shelf; returns true once 2/202.
  // States: 2/202 live · 2/201 off-shelf -> onsale:1 · 3/301+3/null draft -> submit
  //         1/101, 3/302 in review -> wait
  const waitActive = async (goodsId: number | string, name: string) => {
    const deadline = Date.now() + TIMEOUT_MS;
    let submitted = false, notFound = 0;
    for (;;) {
      const { status, subStatus, found } = await pubStatus(goodsId);
      if (status === 2 && subStatus === 202) return true;
      if (!found && ++notFound >= 3) { console.log(`   goodsId ${goodsId} has no publish row — stale listing, skipping`); return false; }
      if (found) notFound = 0;
      if (Date.now() > deadline) { console.log(`   still ${status}/${subStatus} after 20min — moving on`); return false; }
      try {
        if (status === 2 && subStatus === 201) {
          await temuCall("bg.local.goods.sale.status.set", { goodsId: Number(goodsId), onsale: 1, operationType: 1 }, creds);
          console.log(`   on-shelf requested`);
        } else if (status === 3 && subStatus !== 302 && !submitted) {
          await temuCall("bg.local.goods.partial.update", { goodsId: Number(goodsId), goodsBasic: { goodsName: name, saveMode: 1 } }, creds);
          submitted = true;
          console.log(`   submitted for review (saveMode:1)`);
        }
      } catch (e: any) {
        console.log(`   transition err: ${String(e?.message || e).slice(0, 120)}`);
      }
      process.stdout.write(`   status ${status}/${subStatus}${found ? "" : " (no publish row)"}, waiting…\r`);
      await sleep(POLL_MS);
    }
  };

  for (const sku of SKUS) {
    const p: any = await db.collection("products").findOne({ sku });
    if (!p) { console.log(`SKIP ${sku}: no product`); continue; }
    const existing = listedSku.get(sku);

    let goodsId: any = existing?.externalId;
    if (!existing) {
      console.log(`\nPUBLISH ${sku} ($${p.price})`);
      try {
        await db.collection("products").updateOne({ _id: p._id }, { $set: { "marketplaceCategory.temu": CATID_REMOTE } });
        p.marketplaceCategory = { ...p.marketplaceCategory, temu: CATID_REMOTE };
        const payload: ListingPayload = await buildListingPayload(p, "temu");
        let r: any, lastErr: any;
        for (let attempt = 0; attempt < 3; attempt++) {
          try { r = await temuAdapter.publishListing(payload, creds); break; }
          catch (e: any) { lastErr = e; await sleep(5000); }
        }
        if (!r) throw lastErr;
        goodsId = r.externalId;
        await saveChannelListing({
          productId: p.id, sku: payload.sku, channel: "temu",
          externalId: r.externalId, externalUrl: r.externalUrl,
          status: "listed", lastSyncedAt: new Date().toISOString(),
        });
        console.log(`   goodsId ${goodsId}`);
      } catch (e: any) {
        console.log(`   FAIL publish: ${String(e?.message || e).slice(0, 160)}`);
        continue;
      }
    } else {
      // Prefer live lookup — channelListings.externalId may be stale
      goodsId = (await findGoodsIdByOutSkuSn(sku, creds)) || goodsId;
      if (!goodsId) { console.log(`SKIP ${sku}: listed but goodsId not found`); continue; }
      console.log(`\nACTIVATE ${sku} -> goodsId ${goodsId}`);
    }

    const active = await waitActive(goodsId, p.name || sku);
    if (active) {
      console.log(`   ACTIVE ${sku}`);
      await db.collection("channelListings").updateOne(
        { channel: "temu", sku },
        { $set: { status: "listed", updatedAt: new Date().toISOString() } }
      );
    }
    await sleep(1200);
  }

  console.log("\nDONE");
  await c.close();
  process.exit(0);
})();

#!/usr/bin/env tsx
/**
 * Mark channelListings rows as 'stale' when their goodsId has no publish
 * status row on TEMU (good deleted/re-pushed elsewhere). Dry-run default.
 *   npx tsx scripts/temu-clean-stale.ts          # report
 *   npx tsx scripts/temu-clean-stale.ts --apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const APPLY = process.argv.includes("--apply");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { temuCall } = await import("../src/lib/channels/temu");
  const creds: any = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID, expiresAt: "" };
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");

  const listings = await db.collection("channelListings").find({ channel: "temu", status: { $nin: ["delisted", "stale"] } }).toArray();
  console.log(`${listings.length} live temu listing records`);

  // live goodsIds straight from TEMU — authoritative
  const live = new Set<string>();
  for (const gst of [0, 1, 2, 3, 4, 5]) {
    for (let page = 1; page <= 30; page++) {
      try {
        const r: any = await temuCall("bg.local.goods.list.query", { pageNo: page, pageSize: 100, goodsSearchType: gst }, creds);
        const list = r?.result?.goodsList || [];
        for (const g of list) live.add(String(g.goodsId));
        if (list.length < 100) break;
      } catch { /* rate limit — retry page */ page--; await sleep(1500); }
      await sleep(300);
    }
  }
  console.log(`${live.size} goods currently on TEMU`);

  const stale = listings.filter((l: any) => l.externalId && !live.has(String(l.externalId)));
  console.log(`stale listings: ${stale.length}`);
  for (const l of stale.slice(0, 15)) console.log(`  ${l.sku} -> ${l.externalId}`);
  if (stale.length > 15) console.log(`  …and ${stale.length - 15} more`);

  if (APPLY && stale.length) {
    const r = await db.collection("channelListings").updateMany(
      { _id: { $in: stale.map((l: any) => l._id) } },
      { $set: { status: "stale", updatedAt: new Date().toISOString() } }
    );
    console.log(`marked stale: ${r.modifiedCount}`);
  } else if (!APPLY) console.log("(dry run — add --apply)");
  await c.close();
  process.exit(0);
})();

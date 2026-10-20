#!/usr/bin/env tsx
/**
 * Take every TEMU goods off-shelf (inactive) via bg.local.goods.sale.status.set.
 * Reversible — re-run with --onshelf to put them back.
 *   npx tsx scripts/temu-allshelf-off.ts            # dry run
 *   npx tsx scripts/temu-allshelf-off.ts --apply
 *   npx tsx scripts/temu-allshelf-off.ts --apply --onshelf
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const APPLY = process.argv.includes("--apply");
const ONSHELF = process.argv.includes("--onshelf");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { temuCall } = await import("../src/lib/channels/temu");
  const { getValidCredentials } = await import("../src/lib/channels/db");
  const creds = await getValidCredentials("temu");

  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db(process.env.MONGODB_DB || undefined);

  const goods = new Set<number>();
  for (const gst of [0, 1, 2, 3, 4, 5]) {
    for (let page = 1; page <= 30; page++) {
      const r: any = await temuCall("bg.local.goods.list.query", { pageNo: page, pageSize: 100, goodsSearchType: gst }, creds);
      const list = r?.result?.goodsList || [];
      for (const g of list) goods.add(g.goodsId);
      if (list.length < 100) break;
      await sleep(250);
    }
  }
  console.log(`${goods.size} TEMU goods — ${ONSHELF ? "ON-shelf" : "OFF-shelf"}${APPLY ? "" : " (dry run, add --apply)"}\n`);

  let ok = 0, fail = 0;
  for (const goodsId of goods) {
    if (!APPLY) { console.log(`DRY  ${goodsId}`); continue; }
    try {
      const r: any = await temuCall("bg.local.goods.sale.status.set", {
        goodsId, onsale: ONSHELF ? 1 : 0, operationType: 1,
      }, creds);
      if (r?.success !== false) {
        ok++;
        console.log(`${ONSHELF ? "ON " : "OFF"} ${goodsId}`);
      } else {
        fail++;
        console.log(`FAIL ${goodsId}: ${r?.errorMsg}`);
      }
    } catch (e: any) {
      fail++;
      console.log(`FAIL ${goodsId}: ${String(e?.message || e).slice(0, 120)}`);
    }
    await sleep(400);
  }

  if (APPLY && !ONSHELF) {
    await db.collection("channelListings").updateMany(
      { channel: "temu", status: { $ne: "delisted" } },
      { $set: { status: "offshelf", updatedAt: new Date().toISOString() } }
    );
  } else if (APPLY && ONSHELF) {
    await db.collection("channelListings").updateMany(
      { channel: "temu", status: "offshelf" },
      { $set: { status: "listed", updatedAt: new Date().toISOString() } }
    );
  }
  console.log(`\nDONE ok=${ok} fail=${fail}`);
  await c.close();
  process.exit(0);
})();

#!/usr/bin/env tsx
/**
 * Delete all battery-category listings from TEMU.
 * Matches TEMU goods by outSkuSn (incl. X<n> multipack SKUs) to products
 * with category "batteries", calls temu.local.goods.delete, and marks
 * channelListings delisted.
 *   npx tsx scripts/temu-delete-batteries.ts          # dry run
 *   npx tsx scripts/temu-delete-batteries.ts --delete # actually delete
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const DRY = !process.argv.includes("--delete");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { temuCall } = await import("../src/lib/channels/temu");
  const { getValidCredentials } = await import("../src/lib/channels/db");
  const creds = await getValidCredentials("temu");

  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db(process.env.MONGODB_DB || undefined);
  const batSkus = new Set(
    (await db.collection("products").find({ category: "batteries" }).project({ sku: 1 }).toArray())
      .map((p: any) => p.sku)
  );
  console.log(`${batSkus.size} battery SKUs\n${DRY ? "DRY RUN — add --delete to apply\n" : "DELETING\n"}`);

  let found = 0, deleted = 0, fail = 0;
  const seen = new Set<number>();
  for (const gst of [0, 1, 2, 3, 4, 5]) {
    for (let page = 1; page <= 30; page++) {
      const r: any = await temuCall("bg.local.goods.list.query", { pageNo: page, pageSize: 100, goodsSearchType: gst }, creds);
      const list = r?.result?.goodsList || [];
      for (const g of list) {
        if (seen.has(g.goodsId)) continue;
        const skus: string[] = g.outSkuSnList || [];
        const isBattery = skus.some((s) => batSkus.has(s) || batSkus.has(String(s).replace(/X\d+$/, "")));
        if (!isBattery) continue;
        seen.add(g.goodsId);
        found++;
        if (DRY) { console.log(`DRY  ${skus.join(",")} — "${String(g.goodsName || "").slice(0, 55)}" goods ${g.goodsId}`); continue; }
        try {
          const d: any = await temuCall("temu.local.goods.delete", { goodsId: g.goodsId }, creds);
          if (d?.success !== false) {
            deleted++;
            console.log(`DEL  ${skus.join(",")} goods ${g.goodsId}`);
            await db.collection("channelListings").updateMany(
              { channel: "temu", externalId: String(g.goodsId) },
              { $set: { status: "delisted", updatedAt: new Date().toISOString() } }
            );
          } else {
            fail++;
            console.log(`FAIL ${skus.join(",")}: ${d?.errorMsg}`);
          }
        } catch (e: any) {
          fail++;
          console.log(`FAIL ${skus.join(",")}: ${String(e?.message || e).slice(0, 120)}`);
        }
        await sleep(500);
      }
      if (list.length < 100) break;
      await sleep(300);
    }
  }
  console.log(`\nDONE found=${found} deleted=${deleted} fail=${fail}${DRY ? " (dry run)" : ""}`);
  await c.close();
  process.exit(0);
})();

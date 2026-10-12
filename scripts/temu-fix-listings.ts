#!/usr/bin/env tsx
/**
 * TEMU listing remediation.
 *
 * Status decode (bg.local.goods.publish.status.get):
 *   status=1 sub=101  -> under review (waiting on TEMU, nothing to do)
 *   status=2 sub=201  -> published, off-shelf   -> sale.status.set onsale=1
 *   status=2 sub=202  -> published, on-shelf    -> live
 *   status=2 sub=203  -> published, unsellable (qty=0) -> leave, correct stock
 *   status=3 sub=301  -> saved but never submitted -> partial.update saveMode:1
 *   status=3 sub=302  -> submitted, in review -> wait
 *   status=3 sub=null -> draft (goodsSearchType 5) -> resubmit saveMode:1
 *
 * Goods whose channelListings.status === "delisted" (multipack singles) are
 * left off-shelf / un-resubmitted on purpose.
 *
 *   npx tsx scripts/temu-fix-listings.ts --dry   # report only
 *   npx tsx scripts/temu-fix-listings.ts         # apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const DRY = process.argv.includes("--dry");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { temuCall } = await import("../src/lib/channels/temu");
  const creds: any = {
    accessToken: process.env.TEMU_ACCESS_TOKEN!,
    sellerId: process.env.TEMU_MALL_ID,
    expiresAt: "",
  };
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");
  const listings = await db.collection("channelListings").find({ channel: "temu" }).toArray();
  const products = await db.collection("products").find({}, { projection: { sku: 1, id: 1 } }).toArray();
  // true SKU comes from the product — channelListings.sku can itself be stale/corrupt
  const prodSku = new Map(products.map((p: any) => [String(p.id ?? p._id), String(p.sku)]));
  const trueSku = (l: any) => {
    const raw = String(l.productId || "");
    // pack records use "<productId>XN" — their own sku is the pack code
    if (/X\d+$/.test(raw)) return String(l.sku || "");
    return prodSku.get(raw) || String(l.sku || "");
  };
  const byGoods = new Map(listings.map((l: any) => [String(l.externalId), { ...l, trueSku: trueSku(l) }]));

  const collect = async (gst: number) => {
    const out: any[] = [];
    for (let page = 1; page <= 8; page++) {
      const r = await temuCall("bg.local.goods.list.query", { pageNo: page, pageSize: 100, goodsSearchType: gst }, creds);
      const list = r.result?.goodsList || [];
      out.push(...list);
      if (list.length < 100) break;
    }
    return out;
  };

  const all: any[] = [];
  for (const t of [1, 4, 5]) for (const g of await collect(t)) all.push({ ...g, bucket: t });
  console.log(`total goods: ${all.length}`);

  // classify via publish.status.get
  const statusById = new Map<string, { status: number; subStatus: number | null }>();
  for (let i = 0; i < all.length; i += 20) {
    const batch = all.slice(i, i + 20);
    const r = await temuCall("bg.local.goods.publish.status.get", { goodsIdList: batch.map((g) => g.goodsId) }, creds);
    for (const row of r.result?.goodsPublishStatusList || []) {
      statusById.set(String(row.goodsId), { status: row.status, subStatus: row.subStatus ?? null });
    }
  }

  let resubmitted = 0, delisted = 0, activated = 0, skuFixed = 0;
  const errors: string[] = [];

  for (const g of all) {
    const id = String(g.goodsId);
    const st = statusById.get(id);
    const rec = byGoods.get(id) as any;
    const isDelistedSingle = rec?.status === "delisted";
    const name = String(g.goodsName || "").slice(0, 45);
    const label = `${id} ${g.outSkuSnList?.[0] || "?"} ${name}`;

    if (!st) { errors.push(`${label}: no publish status`); continue; }

    // --- pending submission (3/301) or draft (3/null): resubmit ---
    if (st.status === 3 && st.subStatus !== 302) {
      if (isDelistedSingle) { console.log(`SKIP resubmit ${label} (delisted single)`); continue; }
      if (DRY) { console.log(`RESUBMIT ${label}`); resubmitted++; continue; }
      try {
        const update: any = {
          goodsId: g.goodsId,
          goodsBasic: { goodsName: g.goodsName, saveMode: 1 },
        };
        // Fix corrupted outSkuSn while we're here (e.g. "AR-c" -> "AR-WTB-6")
        const wantSku = rec?.trueSku && String(rec.trueSku);
        const gotSku = g.outSkuSnList?.[0];
        if (wantSku && gotSku && wantSku !== gotSku) {
          const detail = await temuCall("bg.local.goods.detail.query", { goodsId: g.goodsId }, creds);
          const sku = detail.result?.skuList?.[0];
          const img = sku?.images?.[0] || g.thumbUrl;
          update.skuList = [{
            skuId: sku.skuId, outSkuSn: wantSku,
            weight: "50", weightUnit: "g", length: "10", width: "10", height: "5",
            volumeUnit: "cm", images: img ? [img] : [],
          }];
        }
        await temuCall("bg.local.goods.partial.update", update, creds);
        console.log(`RESUBMITTED ${label}`);
        resubmitted++;
      } catch (e: any) {
        errors.push(`${label}: resubmit ${String(e?.message || e).slice(0, 140)}`);
      }
      await sleep(1100);
      continue;
    }

    // --- published on-shelf but should be delisted (multipack singles) ---
    if (st.status === 2 && st.subStatus === 202 && isDelistedSingle) {
      if (DRY) { console.log(`DELIST ${label}`); delisted++; continue; }
      try {
        const r = await temuCall("bg.local.goods.sale.status.set", { goodsId: g.goodsId, onsale: 0, operationType: 1 }, creds);
        if ((r.result as any)?.success === false) throw new Error("success:false");
        console.log(`DELISTED ${label}`);
        delisted++;
      } catch (e: any) {
        errors.push(`${label}: delist ${String(e?.message || e).slice(0, 140)}`);
      }
      await sleep(1100);
      continue;
    }

    // --- published off-shelf (201): activate, unless deliberately delisted ---
    if (st.status === 2 && st.subStatus === 201 && !isDelistedSingle) {
      if (DRY) { console.log(`ACTIVATE ${label}`); activated++; continue; }
      try {
        const r = await temuCall("bg.local.goods.sale.status.set", { goodsId: g.goodsId, onsale: 1, operationType: 1 }, creds);
        if ((r.result as any)?.success === false) throw new Error("success:false");
        console.log(`ACTIVATED ${label}`);
        activated++;
      } catch (e: any) {
        errors.push(`${label}: activate ${String(e?.message || e).slice(0, 140)}`);
      }
      await sleep(1100);
    }
  }

  // --- fix WTB-6 style corrupted outSkuSn on goods not being resubmitted ---
  for (const g of all) {
    const rec = byGoods.get(String(g.goodsId)) as any;
    const want = rec?.trueSku && String(rec.trueSku);
    const got = g.outSkuSnList?.[0];
    if (!want || !got || want === got || rec.status === "delisted") continue;
    const st = statusById.get(String(g.goodsId));
    if (st?.status === 3 && st.subStatus !== 302) continue; // handled in resubmit
    if (DRY) { console.log(`FIXSKU ${g.goodsId} ${got} -> ${want}`); skuFixed++; continue; }
    try {
      const detail = await temuCall("bg.local.goods.detail.query", { goodsId: g.goodsId }, creds);
      const sku = detail.result?.skuList?.[0];
      await temuCall("bg.local.goods.partial.update", {
        goodsId: g.goodsId,
        skuList: [{
          skuId: sku.skuId, outSkuSn: want,
          weight: "50", weightUnit: "g", length: "10", width: "10", height: "5",
          volumeUnit: "cm", images: sku.images?.length ? sku.images : undefined,
        }],
      }, creds);
      console.log(`FIXED SKU ${g.goodsId} ${got} -> ${want}`);
      skuFixed++;
    } catch (e: any) {
      errors.push(`${g.goodsId}: fixSku ${String(e?.message || e).slice(0, 140)}`);
    }
    await sleep(1100);
  }

  console.log(`\n=== ${DRY ? "DRY " : ""}SUMMARY ===`);
  console.log(`resubmitted: ${resubmitted} | delisted: ${delisted} | activated: ${activated} | skuFixed: ${skuFixed}`);
  if (errors.length) { console.log(`errors (${errors.length}):`); for (const e of errors) console.log("  " + e); }
  await c.close();
  process.exit(0);
})();

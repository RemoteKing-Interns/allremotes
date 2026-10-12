#!/usr/bin/env tsx
/**
 * Push the product catalog to Meta (Facebook/Instagram) via the Catalog
 * Batch API — creates/updates all active products in one run.
 *
 * Required env (.env.local):
 *   META_CATALOG_ID    — Commerce Manager → your catalog → ID in URL or Settings
 *   META_ACCESS_TOKEN  — System User token with `catalog_management` permission
 *                        (Business Settings → Users → System Users; assign the
 *                        catalog to that user with "Manage catalog" access)
 *
 * Usage:
 *   npx tsx scripts/meta-push.ts --dry    # preview the batch payload
 *   npx tsx scripts/meta-push.ts          # push all products
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const DRY = process.argv.includes("--dry");
const BATCH_SIZE = 500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");
  const mongoProducts = await db.collection("products").find({
    $or: [
      { status: "active" },
      { status: { $exists: false } },
      { status: null },
      { status: "" },
    ],
  }).toArray();

  const { enrichProductsWithS3Images } = await import("../src/lib/products-json");
  const { buildFeedFields } = await import("../src/lib/feed-fields");
  const { getMetaCatalogCreds, metaItemsBatch, metaCheckBatch, metaGetProductSets, metaCreateProductSet } =
    await import("../src/lib/channels/meta");

  const products = enrichProductsWithS3Images(mongoProducts);
  console.log(`${products.length} active products`);

  // retailer_id = product.id — same key the XML feed uses as <g:id>, so a
  // catalog mixing feed + API sources stays consistent.
  const requests: any[] = [];
  const productTypes = new Set<string>();
  for (const p of products) {
    const f = await buildFeedFields(p);
    if (!f) continue;
    productTypes.add(f.productType);
    // items_batch uses catalog FEED field names: id (the retailer key),
    // title, image[] of {url}, product_type — not the legacy
    // retailer_id/name/image_link names.
    requests.push({
      method: "UPDATE",
      data: {
        id: f.id,
        title: f.title.slice(0, 150),
        description: f.description.slice(0, 5000),
        availability: f.availability,
        condition: "new",
        price: f.price,
        link: f.link,
        image: [
          { url: f.imageLink },
          ...f.additionalImages.map((url) => ({ url })),
        ],
        brand: f.brand,
        product_type: f.productType,
        mpn: f.sku,
        quantity_to_sell_on_facebook: Math.max(0, Number(p.quantity || p.stock || 0)),
      },
    });
  }
  console.log(`${requests.length} pushable items`);
  if (DRY) {
    console.log(JSON.stringify(requests[0], null, 2));
    await c.close();
    process.exit(0);
  }

  const creds = getMetaCatalogCreds();

  // Product sets = the catalog's "categories" in the shop — one per site
  // category, filtered on the product_type field we send with each item.
  try {
    const existing = new Set((await metaGetProductSets(creds)).map((s: any) => String(s.name)));
    for (const pt of productTypes) {
      if (existing.has(pt)) continue;
      const res = await metaCreateProductSet(pt, pt, creds);
      console.log(`product set "${pt}": ${res.id || JSON.stringify(res).slice(0, 120)}`);
    }
  } catch (e: any) {
    console.log(`product sets: ${String(e?.message || e).slice(0, 200)}`);
  }

  const handles: string[] = [];
  let errors = 0;
  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const chunk = requests.slice(i, i + BATCH_SIZE);
    try {
      const res = await metaItemsBatch(chunk, creds);
      handles.push(...(res.handles || []));
      for (const v of res.validation_status || []) {
        for (const e of v.errors || []) {
          errors++;
          console.log(`ERR ${v.retailer_id}: ${e.message}`);
        }
        for (const w of v.warnings || []) console.log(`WARN ${v.retailer_id}: ${w.message}`);
      }
      console.log(`batch ${i / BATCH_SIZE + 1}: ${chunk.length} items -> handles ${JSON.stringify(res.handles)}`);
    } catch (e: any) {
      errors++;
      console.log(`batch ${i / BATCH_SIZE + 1} FAILED: ${String(e?.message || e).slice(0, 300)}`);
    }
    await sleep(1000);
  }

  for (const h of handles) {
    try {
      const status = await metaCheckBatch(h, creds);
      const d = status.data?.[0] || {};
      console.log(`handle ${h}: ${d.status} — errors=${d.errors_total_count ?? 0}`);
    } catch (e: any) {
      console.log(`status check ${h}: ${String(e?.message || e).slice(0, 200)}`);
    }
  }
  console.log(`done. batches=${Math.ceil(requests.length / BATCH_SIZE)} itemErrors=${errors}`);
  await c.close();
  process.exit(0);
})();

// Repair order items whose rk_sku was copied from the shifted product data:
// for every catalog product, set items[*].rk_sku = product.rk_sku where item.sku matches.
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { getDb } = await import("../src/lib/mongo");
  const db = await getDb();
  const products = await db.collection("products").find(
    { sku: { $exists: true, $ne: "" }, rk_sku: { $exists: true, $ne: "" } },
    { projection: { sku: 1, rk_sku: 1, name: 1 } }
  ).toArray();
  const bySku = new Map(products.map((p: any) => [String(p.sku), p]));

  const orders = await db.collection("orders").find(
    { "items.sku": { $exists: true } },
    { projection: { id: 1, items: 1 } }
  ).toArray();

  let fixedOrders = 0;
  let fixedItems = 0;
  const details: string[] = [];
  for (const o of orders) {
    let dirty = false;
    for (const it of o.items || []) {
      const p = bySku.get(String(it.sku || ""));
      if (p && it.rk_sku && it.rk_sku !== p.rk_sku) {
        it.rk_sku = p.rk_sku;
        dirty = true;
        fixedItems++;
        details.push(`${o.id} | ${it.sku} -> ${p.rk_sku} | ${it.name}`);
      }
    }
    if (dirty) {
      await db.collection("orders").updateOne({ _id: o._id }, { $set: { items: o.items } });
      fixedOrders++;
    }
  }
  console.log(`fixed ${fixedItems} items across ${fixedOrders} orders`);
  for (const d of details) console.log(" ", d);
  process.exit(0);
}
main();

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
async function main() {
  const { getDb } = await import("../src/lib/mongo");
  const db = await getDb();
  const listings = await db.collection("channelListings").find({ channel: "temu" }).toArray();
  console.log("temu listings:", listings.length);
  const skus = listings.map((l: any) => String(l.sku || ""));
  const products = await db.collection("products").find(
    { sku: { $in: skus } },
    { projection: { name: 1, sku: 1, price: 1, inStock: 1 } }
  ).toArray();
  const cheap = products.filter((p: any) => Number(p.price) < 10).sort((a: any, b: any) => a.price - b.price);
  console.log("\nTEMU-listed products under AU$10:", cheap.length);
  for (const p of cheap) console.log(`  AU$${Number(p.price).toFixed(2)}  ${p.sku}  ${p.name}${p.inStock === false ? "  [OOS]" : ""}`);
  // Also check ALL catalog products under $10 for context
  const allCheap = await db.collection("products").find({ price: { $lt: 10, $gt: 0 } }, { projection: { name: 1, sku: 1, price: 1 } }).sort({ price: 1 }).toArray();
  console.log("\nALL catalog products under AU$10:", allCheap.length);
  for (const p of allCheap) console.log(`  AU$${Number(p.price).toFixed(2)}  ${p.sku}  ${p.name}`);
  process.exit(0);
}
main();

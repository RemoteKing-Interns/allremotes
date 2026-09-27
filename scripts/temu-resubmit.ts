import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
(async () => {
  const sku = process.argv[2];
  const goodsId = process.argv[3];
  if (!sku || !goodsId) { console.error("Usage: npx tsx scripts/temu-resubmit.ts <sku> <goodsId>"); process.exit(1); }

  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const p = await c.db("allremotes").collection("products").findOne({ sku });
  await c.close();
  if (!p) { console.error("Product not found:", sku); process.exit(1); }

  const { temuAdapter } = await import("../src/lib/channels/temu");
  const creds = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID };
  const r = await temuAdapter.updateListing(goodsId, {
    sku: p.sku,
    title: p.name || p.title || p.sku,
    description: p.description || "",
    price: p.price || 0,
    currency: "AUD",
    quantity: p.stock || 10,
    images: p.images || (p.image ? [p.image] : []),
  }, creds);
  console.log("resubmit result:", JSON.stringify(r));
  process.exit(0);
})();

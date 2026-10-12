import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");
  const prods = new Map<string, any>();
  for (const p of await db.collection("products").find({}).toArray()) prods.set(String(p.id ?? p._id), p);
  const rows: any[] = [];
  for (const l of await db.collection("channelListings").find({ channel: "temu" }).toArray()) {
    const p = prods.get(String(l.productId));
    const sku = p?.sku || l.sku;
    const price = p?.price?.sell ?? p?.price ?? l.price;
    rows.push({ sku, price: typeof price === "number" ? price : price?.amount, stock: p?.stock ?? p?.qty ?? l.stock, externalId: l.externalId, status: l.status });
  }
  rows.sort((a, b) => (a.price ?? 999) - (b.price ?? 999));
  for (const r of rows.filter((r) => (r.price ?? 999) < 15)) {
    const n = Math.ceil(15 / r.price);
    console.log(`${r.sku} $${r.price} stock=${r.stock} -> X${n} = $${(r.price * n).toFixed(2)} [${r.status}] ${r.externalId}`);
  }
  console.log("--- total under $15:", rows.filter((r) => (r.price ?? 999) < 15).length);
  await c.close();
  process.exit(0);
})();

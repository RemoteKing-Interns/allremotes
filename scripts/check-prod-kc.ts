import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const col = c.db("allremotes").collection("products");
  const kc = await col.find({ sku: /^AR-KC-/ }, { projection: { sku: 1, status: 1 } }).toArray();
  const nonDraft = kc.filter(p => p.status !== "draft");
  console.log("total AR-KC:", kc.length, "| non-draft:", nonDraft.length);
  for (const p of nonDraft) console.log(p.sku, "|", p.status);
  await c.close(); process.exit(0);
})();

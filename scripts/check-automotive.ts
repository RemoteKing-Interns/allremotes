import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import { matchesProductToCategory } from "../src/lib/category";

async function main() {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const col = c.db("allremotes").collection("products");

  // 1. Draft/status fields present?
  const flagged = await col
    .find({ $or: [{ draft: { $exists: true } }, { status: { $exists: true } }, { published: { $exists: true } }, { visible: { $exists: true } }] })
    .project({ sku: 1, draft: 1, status: 1, published: 1, visible: 1 })
    .limit(5)
    .toArray();
  console.log("draft-ish docs:", JSON.stringify(flagged));

  const statusAgg = await col
    .aggregate([{ $group: { _id: { status: "$status", draft: "$draft", published: "$published" }, n: { $sum: 1 } } }])
    .toArray();
  console.log("status counts:", JSON.stringify(statusAgg));

  // 2. Which products match automotive?
  const all = await col.find({}).toArray();
  const matched = all.filter((p: any) => matchesProductToCategory(p, "automotive"));
  console.log(`\nautomotive matches: ${matched.length}`);
  matched.forEach((p: any) => console.log("  -", p.sku, "|", p.name, "| cat:", p.category, "| draft:", p.draft, p.status, p.published));
  await c.close();
}
main().catch((e) => { console.error(e); process.exit(1); });

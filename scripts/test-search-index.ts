import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import { buildProductSearchIndex, searchIndex } from "../src/lib/search";
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const products = await c.db("allremotes").collection("products").find({}).toArray();
  await c.close();
  const t0 = Date.now();
  const idx = buildProductSearchIndex(products);
  console.log(`indexed ${products.length} products, ${idx.index.size} terms in ${Date.now() - t0}ms`);
  for (const q of ["merlin remote", "merln", "AR-27A-5", "cr2032", "kia key cover", "hyndai", "27a battery"]) {
    const t = Date.now();
    const r = searchIndex(idx, q);
    console.log(`\n"${q}" -> ${r.length} hits in ${Date.now() - t}ms`);
    for (const x of r.slice(0, 4)) console.log(`   ${x.score.toFixed(0).padStart(4)} ${x.product.sku} ${String(x.product.name).slice(0, 55)}`);
  }
  process.exit(0);
})();

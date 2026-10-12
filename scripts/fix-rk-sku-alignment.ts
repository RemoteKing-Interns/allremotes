// Fix shifted rk_sku values using rk_url handle as ground truth.
// Dry-run by default; pass --apply to write.
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

async function main() {
  const { getDb } = await import("../src/lib/mongo");
  const db = await getDb();
  const products = await db.collection("products").find(
    { rk_url: { $exists: true, $ne: "" } },
    { projection: { name: 1, sku: 1, rk_sku: 1, rk_url: 1 } }
  ).toArray();

  // Expected rk_sku derived from the rk_url handle:
  //  AR-X   + handle rk-x-lower      → RK-X
  //  CMT-X/T-X/MM-X + handle x-lower → same as sku
  const expected = (sku: string, url: string): string | null => {
    const handle = (String(url || "").split("/products/")[1] || "").split("?")[0].toLowerCase();
    if (!handle) return null;
    if (sku.startsWith("AR-")) {
      const rest = sku.slice(3).toLowerCase();
      if (handle === `rk-${rest}` || handle.startsWith(`rk-${rest}-`)) return `RK-${sku.slice(3)}`;
      return null;
    }
    if (/^(CMT|T|MM)-/i.test(sku) && handle === sku.toLowerCase()) return sku;
    return null;
  };

  const changes: { id: any; name: string; sku: string; from: string; to: string }[] = [];
  const planned = new Map<string, string[]>(); // code -> product names that will hold it
  for (const p of products) {
    const sku = String(p.sku || "");
    const want = expected(sku, p.rk_url);
    if (!want) continue;
    planned.set(want, [...(planned.get(want) || []), p.name]);
    if (String(p.rk_sku || "") !== want) {
      changes.push({ id: p._id, name: p.name, sku, from: String(p.rk_sku || ""), to: want });
    }
  }

  const collisions = [...planned.entries()].filter(([, names]) => names.length > 1);
  console.log(`products with determinable rk code: ${planned.size}`);
  console.log(`changes needed: ${changes.length}`);
  for (const c of changes) console.log(`  ${c.sku} | ${c.from || "(empty)"} -> ${c.to} | ${c.name}`);
  if (collisions.length) {
    console.log("\n!! collisions — two products derive the same code:");
    for (const [code, names] of collisions) console.log(`  ${code}: ${names.join(" | ")}`);
  }

  if (APPLY) {
    const bulk = changes.map((c) => ({
      updateOne: { filter: { _id: c.id }, update: { $set: { rk_sku: c.to } } },
    }));
    if (bulk.length) {
      const r = await db.collection("products").bulkWrite(bulk as any);
      console.log(`\napplied: ${r.modifiedCount} products updated`);
    }
  } else {
    console.log("\ndry-run — rerun with --apply to write");
  }
  process.exit(0);
}
main();

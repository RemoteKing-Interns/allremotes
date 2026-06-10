/**
 * One-time migration: set category/cat1 on all MongoDB products where they are blank.
 * Uses tags, name, and description to infer the correct category.
 * 
 * Run: node scripts/fix-product-categories.js
 */
require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "allremotes";

function inferCategory(product) {
  const searchText = [
    product.tags || "",
    product.name || "",
    product.description || "",
    product.seo_title || "",
    product.category || "",
    product.cat1 || "",
  ].join(" ").toLowerCase();

  if (
    searchText.includes("garage") ||
    searchText.includes("gate") ||
    searchText.includes("roller door") ||
    searchText.includes("sectional") ||
    searchText.includes("panel lift") ||
    searchText.includes("tilt door") ||
    searchText.includes("transmitter") ||
    searchText.includes("keypad") ||
    searchText.includes("receiver")
  ) return "garage";

  if (
    searchText.includes("car") ||
    searchText.includes("auto") ||
    searchText.includes("vehicle") ||
    searchText.includes("transponder") ||
    searchText.includes("key fob")
  ) return "car";

  if (
    searchText.includes("home") ||
    searchText.includes("house") ||
    searchText.includes("ceiling fan") ||
    searchText.includes("air con") ||
    searchText.includes("tv remote")
  ) return "home";

  if (searchText.includes("lock")) return "locksmith";

  // Default for remotes shop - most products are garage
  return "garage";
}

async function main() {
  if (!MONGO_URI) {
    console.error("MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db(DB_NAME);
  const col = db.collection("products");

  const products = await col.find({}).toArray();
  console.log(`Total products: ${products.length}`);

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    const hasCategory = (p.category || "").trim() !== "" || (p.cat1 || "").trim() !== "";
    if (hasCategory) {
      skipped++;
      continue;
    }

    const category = inferCategory(p);
    await col.updateOne(
      { _id: p._id },
      { $set: { category, cat1: category } }
    );
    updated++;
  }

  console.log(`Updated: ${updated} products`);
  console.log(`Skipped (already had category): ${skipped}`);
  await client.close();
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });

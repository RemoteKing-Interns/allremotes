/**
 * Apply batch corrections to MongoDB products and update the resumable checkpoint.
 * Run: node scripts/update-product-fields.js --file=scripts/corrections-batch-1.json [--apply]
 * Without --apply it dry-runs.
 */
require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "allremotes";

const CHECKPOINT_FILE = path.join(__dirname, "product-content-checkpoint.json");
const VERIFIED_FILE = path.join(__dirname, "web-verified-skus.json");

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const apply = process.argv.includes("--apply");

  if (!fileArg) {
    console.error("Usage: node scripts/update-product-fields.js --file=scripts/corrections-batch-X.json [--apply]");
    process.exit(1);
  }

  const filePath = path.resolve(fileArg.split("=")[1]);
  const corrections = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const skus = Object.keys(corrections);

  const checkpoint = loadJson(CHECKPOINT_FILE, { lastUpdated: null, total: 0, skus: {} });
  const verified = loadJson(VERIFIED_FILE, []);
  const verifiedSet = new Set(verified);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection("products");

  for (const sku of skus) {
    const payload = corrections[sku];
    const existing = checkpoint.skus[sku] || {};

    if (apply) {
      const result = await col.updateOne({ sku }, { $set: payload });
      console.log(`${sku}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    } else {
      console.log(`[dry-run] ${sku}: would set ${Object.keys(payload).join(", ")}`);
    }

    verifiedSet.add(sku);
    checkpoint.skus[sku] = {
      ...existing,
      ...payload,
      webVerified: true,
      corrected: true,
      lastUpdated: new Date().toISOString(),
    };
  }

  if (apply) {
    saveJson(VERIFIED_FILE, Array.from(verifiedSet).sort());
    checkpoint.lastUpdated = new Date().toISOString();
    saveJson(CHECKPOINT_FILE, checkpoint);
  }

  await client.close();
  if (!apply) {
    console.log("Dry run complete. Add --apply to persist.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

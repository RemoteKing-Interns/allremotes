/**
 * Audit product content and maintain a resumable checkpoint + markdown tracker.
 * Run: node scripts/verify-product-content.js [--reset]
 * --reset will rebuild the checkpoint from the database.
 */
require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "allremotes";

const CHECKPOINT_FILE = path.join(__dirname, "product-content-checkpoint.json");
const TRACKER_FILE = path.join(__dirname, "product-content-tracker.md");
const VERIFIED_FILE = path.join(__dirname, "web-verified-skus.json");

const REQUIRED_FIELDS = ["description", "features", "specification", "compatibility", "instructions"];
const REWRITE_MARKERS = [
  "what's included",
  "features",
  "specification",
  "compatible",
  "programming instructions",
  "important information",
  "why choose all remotes",
];

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

function hasContent(value) {
  if (!value) return false;
  const text = String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 0;
}

function looksRewritten(product) {
  const combined = ["description", "features", "specification", "compatibility", "instructions"]
    .map((f) => String(product[f] || ""))
    .join("\n")
    .toLowerCase();
  return REWRITE_MARKERS.every((m) => combined.includes(m.toLowerCase()));
}

function nextAction(entry) {
  if (!entry.complete) return "fill_missing_fields";
  if (!entry.webVerified) return "web_research";
  if (!entry.corrected) return "apply_corrections";
  if (!entry.rewritten) return "rewrite_template";
  return "done";
}

async function main() {
  if (!MONGO_URI) {
    console.error("MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  const reset = process.argv.includes("--reset");
  const verified = new Set(loadJson(VERIFIED_FILE, []));
  const checkpoint = loadJson(CHECKPOINT_FILE, { lastUpdated: null, total: 0, skus: {} });

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection("products");
  const products = await col.find({}).toArray();

  for (const p of products) {
    const sku = p.sku || p.SKU;
    if (!sku) continue;
    const existing = checkpoint.skus[sku] || {};
    const entry = { ...existing };

    REQUIRED_FIELDS.forEach((f) => {
      entry[f] = hasContent(p[f]);
    });

    entry.complete = REQUIRED_FIELDS.every((f) => entry[f]);
    entry.webVerified = entry.webVerified || verified.has(sku) || false;
    entry.rewritten = looksRewritten(p);
    entry.corrected = (entry.corrected ?? false) || (entry.webVerified && entry.rewritten);
    entry.lastSeen = new Date().toISOString();

    if (reset || !entry.title) {
      entry.title = p.name || p.title || "";
      entry.brand = p.brand || "";
      entry.model = p.model || "";
    }

    checkpoint.skus[sku] = entry;
  }

  checkpoint.total = products.length;
  checkpoint.lastUpdated = new Date().toISOString();
  saveJson(CHECKPOINT_FILE, checkpoint);

  // Generate markdown tracker
  const rows = Object.entries(checkpoint.skus).map(([sku, e]) => {
    const fieldCells = REQUIRED_FIELDS.map((f) => (e[f] ? "✅" : "❌")).join(" | ");
    const action = nextAction(e);
    return `| ${sku} | ${e.title || ""} | ${e.brand || ""} | ${e.model || ""} | ${fieldCells} | ${e.webVerified ? "✅" : "❌"} | ${action} |`;
  });

  const completeCount = Object.values(checkpoint.skus).filter((e) => e.complete).length;
  const verifiedCount = Object.values(checkpoint.skus).filter((e) => e.webVerified).length;
  const doneCount = Object.values(checkpoint.skus).filter((e) => nextAction(e) === "done").length;

  const header = REQUIRED_FIELDS.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(" | ");
  const markdown = `# Product Content Verification Tracker\n\nGenerated: ${checkpoint.lastUpdated}\n\nTotal products: ${checkpoint.total}\nComplete: ${completeCount}\nWeb verified: ${verifiedCount}\nDone: ${doneCount}\n\n| SKU | Title | Brand | Model | ${header} | Web Verified | Next Action |\n|-----|-------|-------|-------|${"-------------|".repeat(REQUIRED_FIELDS.length)}----------------|--------------|-------------|\n${rows.join("\n")}\n`;

  fs.writeFileSync(TRACKER_FILE, markdown);
  console.log(`Tracker written to ${TRACKER_FILE}`);
  console.log(`Checkpoint written to ${CHECKPOINT_FILE}`);
  console.log(`Total: ${checkpoint.total}, Complete: ${completeCount}, Web Verified: ${verifiedCount}, Done: ${doneCount}`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

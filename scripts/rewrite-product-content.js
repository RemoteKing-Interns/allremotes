/**
 * Rewrite product content to the ideal template.
 * Uses the resumable checkpoint to process only products that need rewriting.
 * Run: node scripts/rewrite-product-content.js [--apply] [--sku=SKU] [--limit=N]
 */
require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "allremotes";

const CHECKPOINT_FILE = path.join(__dirname, "product-content-checkpoint.json");
const LOG_FILE = path.join(__dirname, "content-rewrite-log.json");

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

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function looksRewritten(product) {
  const combined = REQUIRED_FIELDS.map((f) => String(product[f] || "").toLowerCase()).join("\n");
  return REWRITE_MARKERS.every((m) => combined.includes(m.toLowerCase()));
}

function parseNumberButtons(product) {
  if (product.buttons) return product.buttons;
  const m = (product.name || "").match(/(\d)\s*[Bb]utton/);
  return m ? parseInt(m[1], 10) : "";
}

function parseFrequency(product) {
  if (product.frequency_mhz) return product.frequency_mhz;
  const m = (product.name || "").match(/(\d{2,4})\s*[Mm][Hh][Zz]/);
  return m ? `${m[1]}MHz` : "";
}

function parseCoding(name) {
  if (/rolling|code[-\s]?hopping|billion code/.test(name)) return "Rolling Code / Code-Hopping";
  if (/fixed|dip\s?switch/.test(name)) return "Fixed Code";
  return "Rolling Code";
}

function buildDescription(product) {
  const title = product.name || product.title || "Garage Door Remote";
  const brand = product.brand || "";
  const model = product.model || "";
  const freq = parseFrequency(product);
  const display = [brand, model, title].filter(Boolean).join(" ");
  return `<h1>${title}</h1>
<p>A reliable ${brand ? brand + " " : ""}garage door opener remote designed as a replacement for ${display} systems. ${title} offers convenient, secure operation and is ideal for customers needing a compatible replacement remote. This ${brand ? brand + " " : ""}remote is a quality-tested option for Australian homes and businesses.</p>
<p><strong>📦 What's Included</strong></p>
<ul>
  <li>1 × Genuine/Compatible Remote</li>
  <li>Battery Included</li>
  <li>Key Ring (if included)</li>
  <li>Programming Instructions (if applicable)</li>
</ul>`;
}

function buildFeatures(product) {
  const brand = product.brand || "";
  const title = product.name || product.title || "this remote";
  const freq = parseFrequency(product);
  const buttons = parseNumberButtons(product);
  return `<ul>
  <li>${buttons ? buttons + " Button " : ""}Transmitter for ${brand || "garage door and gate"} systems</li>
  <li>${parseCoding(title)} Technology for enhanced security</li>
  <li>Transmitter Frequency: ${freq || "433MHz"}</li>
  <li>Compact, durable design</li>
  <li>Battery included</li>
  <li>Australian stock</li>
  <li>12-month manufacturer warranty</li>
</ul>`;
}

function buildSpecification(product) {
  const rows = [
    ["Brand", product.brand || "—"],
    ["Model", product.model || product.name || "—"],
    ["Frequency", parseFrequency(product) || "—"],
    ["Coding Type", parseCoding(product.name || "")],
    ["Number of Buttons", parseNumberButtons(product) || "—"],
    ["Battery", product.battery || "—"],
    ["Battery Included", product.batteryIncluded || "Yes"],
    ["Warranty", product.warranty || "12 Months"],
  ];
  const body = rows.map(([k, v]) => `    <tr><td class="py-2 px-4">${k}</td><td class="py-2 px-4">${v}</td></tr>`).join("\n");
  return `<table class="w-full divide-y divide-border">
  <thead>
    <tr>
      <th class="py-2 px-4 text-left font-semibold">Specification</th>
      <th class="py-2 px-4 text-left font-semibold">Details</th>
    </tr>
  </thead>
  <tbody>
${body}
  </tbody>
</table>`;
}

function buildCompatibility(product) {
  const existing = stripHtml(product.compatibility || "");
  const brand = product.brand || "";
  if (existing && existing.length > 10) {
    return `<p>Compatible with the following ${brand || "garage door/gate"} systems:</p>
${product.compatibility}`;
  }
  return `<p>Compatible with ${brand || "garage door and gate automation"} systems supporting this remote protocol. Please check your opener model before purchasing.</p>`;
}

function buildInstructions(product) {
  const existing = product.instructions || "";
  const brand = product.brand || "";
  const core = existing.length > 20
    ? existing
    : `<ol>
  <li>Ensure your ${brand || "garage door opener"} receiver is powered on and in learning mode.</li>
  <li>Press and release the learn button on the opener panel until the indicator activates.</li>
  <li>Press and hold the button on the remote you wish to program for approximately 3 seconds.</li>
  <li>Release when the opener light flashes or you hear a beep/click.</li>
  <li>Test the remote operation.</li>
</ol>`;
  return `<h3>📖 Programming Instructions</h3>
${core}
<h3>⚠️ Important Information</h3>
<ul>
  <li>Please check your ${brand || "opener"} model before ordering.</li>
  <li>The appearance of your existing remote does not always determine compatibility.</li>
  <li>Incorrect model or frequency selection may result in the remote not working.</li>
  <li>If you're unsure which remote you need, contact our team before purchasing.</li>
</ul>
<h3>Why choose All Remotes?</h3>
<ul>
  <li>🇦🇺 Australian owned & operated</li>
  <li>🚚 Fast Australia-wide shipping</li>
  <li>🔋 Battery included</li>
  <li>⭐ Quality tested products</li>
  <li>📞 Friendly local support</li>
</ul>`;
}

function buildContent(product) {
  return {
    description: buildDescription(product),
    features: buildFeatures(product),
    specification: buildSpecification(product),
    compatibility: buildCompatibility(product),
    instructions: buildInstructions(product),
  };
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

  const apply = process.argv.includes("--apply");
  const skuArg = process.argv.find((a) => a.startsWith("--sku="));
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const sku = skuArg ? skuArg.split("=")[1] : null;
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

  const checkpoint = loadJson(CHECKPOINT_FILE, { lastUpdated: null, total: 0, skus: {} });
  let log = loadJson(LOG_FILE, { runs: [] });
  if (!log.runs) {
    log = { runs: Array.isArray(log) ? log : [] };
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection("products");

  let targetSkus = [];
  if (sku) {
    targetSkus = [sku];
  } else {
    targetSkus = Object.entries(checkpoint.skus)
      .filter(([_, e]) => nextAction(e) === "rewrite_template")
      .map(([s]) => s)
      .slice(0, limit);
  }

  if (targetSkus.length === 0) {
    console.log("No products need rewriting.");
    await client.close();
    return;
  }

  const runLog = { startedAt: new Date().toISOString(), apply, skus: [], changes: [] };
  let updated = 0;

  for (const s of targetSkus) {
    const product = await col.findOne({ sku: s });
    if (!product) {
      console.log(`${s}: not found`);
      continue;
    }

    const newContent = buildContent(product);
    const needsUpdate = !looksRewritten(product);

    if (needsUpdate) {
      if (apply) {
        await col.updateOne({ _id: product._id }, { $set: newContent });
      }
      updated++;
      runLog.skus.push(s);
      runLog.changes.push({ sku: s, updated: true });
      console.log(`${apply ? "Updated" : "[dry-run]"} ${s}`);
    } else {
      console.log(`${s}: already in template`);
    }

    const entry = checkpoint.skus[s] || {};
    entry.rewritten = true;
    entry.complete = true;
    entry.lastUpdated = new Date().toISOString();
    REQUIRED_FIELDS.forEach((f) => (entry[f] = true));
    checkpoint.skus[s] = entry;
  }

  if (apply) {
    runLog.finishedAt = new Date().toISOString();
    log.runs.unshift(runLog);
    saveJson(LOG_FILE, log);
    checkpoint.lastUpdated = new Date().toISOString();
    saveJson(CHECKPOINT_FILE, checkpoint);
  }

  await client.close();
  console.log(`${apply ? "Updated" : "Would update"} ${updated} products`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

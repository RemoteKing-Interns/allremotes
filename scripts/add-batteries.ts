/**
 * Import Batteries from RemoteKing (Shopify) into the products collection.
 * Same flow as add-keycovers.ts:
 *   - sku:      RK-XXX  ->  AR-XXX
 *   - rk_sku:   original RK sku (drives Unleashed stock sync)
 *   - rk_url:   source product page
 *   - image:    Shopify CDN image mirrored to S3
 *   - content:  description/features/specification/compatibility/instructions
 *   - category: "batteries" (new dynamic category -> /products/batteries)
 *   - status:   draft — publish via admin after review
 *
 * Usage:
 *   npx tsx scripts/add-batteries.ts --sku RK-PS2032-5   # one product
 *   npx tsx scripts/add-batteries.ts --dry              # list all, no writes
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const RK_COLLECTION =
  "https://www.remoteking.com.au/collections/batteries/products.json?limit=250";
const RK_PRODUCT_URL = (handle: string) =>
  `https://www.remoteking.com.au/products/${handle}`;

// ---------- Unleashed (stock by rk_sku) ----------
const UNLEASHED_BASE = "https://api.unleashedsoftware.com";
const sign = (key: string, qs: string) =>
  crypto.createHmac("sha256", key).update(qs).digest("base64");

async function getStock(productCode: string): Promise<number> {
  try {
    const qs = `productCode=${encodeURIComponent(productCode)}`;
    const res = await fetch(`${UNLEASHED_BASE}/StockOnHand?${qs}`, {
      headers: {
        Accept: "application/json",
        "api-auth-id": process.env.UNLEASHED_API_ID!,
        "api-auth-signature": sign(process.env.UNLEASHED_API_KEY!, qs),
      },
    });
    const d = await res.json();
    return (d?.Items || []).reduce(
      (a: number, i: any) => a + (i.AvailableQty ?? i.QtyOnHand ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

// ---------- S3 ----------
function s3Config() {
  return {
    region: process.env.S3_REGION || process.env.AWS_REGION || "",
    bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey:
      process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  };
}

async function mirrorImage(imageUrl: string, keyName: string): Promise<string | null> {
  const cfg = s3Config();
  const res = await fetch(imageUrl);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = (res.headers.get("content-type") || "image/jpeg").includes("png")
    ? "png"
    : "jpg";
  const key = `images/${keyName}.${ext}`;
  const client = new S3Client({
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buf,
      ContentType: ext === "png" ? "image/png" : "image/jpeg",
      CacheControl: "public, max-age=31536000",
    })
  );
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`;
}

// ---------- HTML builders (house format) ----------
const ul = (items: string[]) =>
  `<ul style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:disc">` +
  items.map((i) => `<li style="margin-bottom:0.35rem">${i}</li>`).join("") +
  `</ul>`;
const td = (v: string) =>
  `<td style="padding:0.75rem;text-align:left;border:1px solid #e5e7eb">${v}</td>`;
const th = (v: string) =>
  `<th style="padding:0.75rem;text-align:left;border:1px solid #e5e7eb;background-color:#f3f4f6;font-weight:700">${v}</th>`;
const specTable = (rows: [string, string][]) =>
  `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:1rem">` +
  `<tr>${th("Specification")}${th("Details")}</tr>` +
  rows.map(([k, v]) => `<tr>${td(k)}${td(v)}</tr>`).join("") +
  `</table>`;

const WHY_ALLREMOTES = [
  "Australian owned and operated with fast Australia-wide shipping",
  "Genuine brand-name batteries with fresh stock",
  "Friendly local support from a team that knows keys and remotes",
  "Trade and wholesale pricing available for locksmiths and workshops",
];

// ---------- Model / pack parsing ----------
function parseTitle(title: string) {
  // "Maxell Battery SR726SW Pack of 1" / "Battery 27A Card Pack of 5" / "CR2430 Batteries Pack of 5 (Panasonic)"
  const brand = (title.match(/\(([^)]+)\)\s*$/)?.[1] || "").trim();
  const pack = title.match(/pack of (\d+)/i)?.[1] || "1";
  const model = (
    title.match(/\b(CR ?\d{4}|\d{4}|SR ?\d{2,4}(SW|W)?|LR ?\d{2,4}|A ?\d{2,3}|\b23A\b|\b27A\b|\b4LR44\b|\b9 ?V(?:olt)?\b|AAA|AA)\b/i)?.[0] || ""
  ).replace(/\s+/g, "").toUpperCase();
  return { pack, model, brandSuffix: brand };
}

const isCoin = (model: string) => /^(CR|SR|LR|\d{4}|23A|27A|4LR44)/.test(model);
const voltageOf = (model: string) => {
  if (/^CR|^20\d{2}|^24\d{2}|^12\d{2}|^16\d{2}/.test(model)) return "3V Lithium";
  if (/^23A|^27A/.test(model)) return "12V Alkaline";
  if (/^4LR44|^9V/.test(model)) return model.startsWith("9") ? "9V Alkaline" : "6V Alkaline";
  if (/^SR|^LR|^A\d/.test(model)) return "1.5V";
  if (/^AA/.test(model)) return "1.5V Alkaline";
  return "";
};

function buildContent(title: string, vendor: string, model: string, pack: string, sku: string) {
  const brand = vendor || "Premium";
  const useCase = isCoin(model)
    ? "car key fobs, garage door remotes, watches, calculators and small electronics"
    : "garage door remotes, alarms, sensors and everyday electronics";
  const voltage = voltageOf(model);

  const description =
    `<h1 class="text-2xl font-bold text-neutral-900" style="margin-bottom:0.75rem">${title}</h1><br/>` +
    `<p style="margin-bottom:0.75rem">Genuine ${brand} ${model || "battery"} ${isCoin(model) ? "coin/button cell" : "battery"} — pack of ${pack}. Reliable, long-lasting power for ${useCase}. Fresh stock with a long shelf life.</p><br/>` +
    `<h2>What's Included</h2>` +
    ul([`${pack} × ${brand} ${model || ""} battery (retail pack)`]) +
    `<br/>` +
    (isCoin(model)
      ? `<h2>Important Safety Information</h2>` +
        ul([
          "<strong>WARNING:</strong> Button/coin batteries are hazardous if swallowed and can cause severe or fatal injuries within 2 hours. Keep new and used batteries out of reach of children at all times.",
          "If you suspect a battery has been swallowed or placed inside any part of the body, seek immediate medical attention.",
        ]) +
        `<br/>`
      : "") +
    `<h2>Why Choose All Remotes?</h2>` +
    ul(WHY_ALLREMOTES);

  const features = ul([
    `Genuine ${brand} ${model || "battery"}${voltage ? ` — ${voltage}` : ""}`,
    `Pack of ${pack} — retail packed`,
    "Long shelf life with leak-resistant construction",
    `Ideal for ${useCase}`,
  ]);

  const specification = specTable([
    ["Product Type", isCoin(model) ? "Coin / Button Cell Battery" : "Battery"],
    ...(model ? [["Battery Model", model] as [string, string]] : []),
    ...(voltage ? [["Voltage", voltage] as [string, string]] : []),
    ["Brand", brand],
    ["Pack Size", `${pack}`],
    ["SKU", sku],
  ]);

  const compatibility =
    `<p style="margin-bottom:0.75rem">Suits any device that takes a ${model || "matching"} battery — check your existing battery or device manual for the correct model.</p><br/>` +
    ul([
      "Common in " + useCase,
      "Match the code printed on your old battery before ordering",
    ]);

  const instructions =
    `<h4 class="text-base font-semibold text-neutral-900" style="margin-top:1rem;margin-bottom:0.5rem">Installation</h4><br/>` +
    ul([
      "Note the polarity (+ / −) of the old battery before removing it.",
      "Insert the new battery the same way up — flat side is usually positive (+).",
      "Dispose of the old battery responsibly at a battery recycling point.",
    ]);

  return { description, features, specification, compatibility, instructions };
}

// ---------- Main ----------
const DRY = process.argv.includes("--dry");
const skuIdx = process.argv.indexOf("--sku");
const onlyRkSku = skuIdx > -1 ? process.argv[skuIdx + 1] : null;

async function main() {
  const res = await fetch(RK_COLLECTION);
  const data = await res.json();
  const products: any[] = (data.products || []).filter(
    (p: any) =>
      (p.images || []).length > 0 &&
      p.variants?.[0]?.sku?.startsWith("RK-")
  );
  console.log(`RK batteries with images: ${products.length}`);

  const mongo = new MongoClient(process.env.MONGODB_URI!);
  await mongo.connect();
  const col = (process.env.MONGODB_DB ? mongo.db(process.env.MONGODB_DB) : mongo.db()).collection("products");

  for (const p of products) {
    const rkSku = String(p.variants[0].sku).trim();
    if (onlyRkSku && rkSku !== onlyRkSku) continue;

    const sku = rkSku.replace(/^RK-/, "AR-");
    console.log(`\n=== ${rkSku} -> ${sku} ===`);

    const existing = await col.findOne({ $or: [{ sku }, { rk_sku: rkSku }] });
    if (existing) {
      console.log("  already exists, skipping.");
      continue;
    }

    const { pack, model } = parseTitle(p.title);
    const name = p.title.trim();
    const price = Number(p.variants[0].price) || 0;
    const comparePrice = Math.round(price * 0.9 * 100) / 100;
    const stock = await getStock(rkSku);
    const rkUrl = RK_PRODUCT_URL(p.handle);

    const s3Urls: string[] = [];
    if (!DRY) {
      for (let i = 0; i < p.images.length; i++) {
        const u = await mirrorImage(p.images[i].src, `${sku}-${i + 1}`);
        if (u) s3Urls.push(u);
      }
    }
    const images = s3Urls.length ? s3Urls : p.images.map((i: any) => i.src);

    const c = buildContent(name, p.vendor || "", model, pack, sku);
    const now = new Date().toISOString();
    const doc: Record<string, any> = {
      id: crypto.randomUUID(),
      sku,
      skuKey: sku.toLowerCase(),
      name,
      brand: p.vendor || "",
      category: "batteries",
      cat1: "batteries",
      status: "draft",
      price,
      comparePrice,
      inStock: stock >= 1 || Boolean(p.variants[0].available),
      stock,
      image: images[0] || "",
      images,
      imgIndex: 0,
      ...c,
      rk_sku: rkSku,
      rk_url: rkUrl,
      condition: "Brand New",
      returns:
        "Returns accepted within 30 days. Must be in original, resaleable condition. Buyer pays return shipping.",
      seller: "AllRemotes (100% positive)",
      seo_title: `${name} | All Remotes`,
      tags: ["battery", "batteries", model.toLowerCase(), String(p.vendor || "").toLowerCase()].filter(Boolean),
      inventoryRefreshedAt: now,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      lastUpdatedBy: "devin",
    };

    if (DRY) {
      console.log(`  [dry] ${name} | $${price} | stock ${stock} | model ${model} pack ${pack} | imgs ${p.images.length}`);
      continue;
    }
    await col.insertOne(doc);
    console.log(`  inserted: ${name} | $${price} | stock ${stock} | imgs ${images.length}`);
  }

  await mongo.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

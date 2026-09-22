/**
 * Import Key Covers from RemoteKing (Shopify) into the products collection.
 *
 * For each RK product with an image:
 *   - sku:      RK-KC-XXX  ->  AR-KC-XXX
 *   - rk_sku:   original RK sku (drives Unleashed stock sync via /api/inventory/stock)
 *   - rk_url:   source product page
 *   - image:    Shopify CDN image mirrored to S3 (next/image only allows S3 hosts)
 *   - content:  description/features/specification/compatibility/instructions
 *               in the existing house HTML format
 *   - status:   draft — publish via admin after review
 *
 * Usage:
 *   npx tsx scripts/add-keycovers.ts --sku RK-KC-MZD-A3   # one product
 *   npx tsx scripts/add-keycovers.ts --dry              # list all, no writes
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const RK_COLLECTION =
  "https://www.remoteking.com.au/collections/key-covers/products.json?limit=250";
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
const ol = (items: string[]) =>
  `<ol style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:decimal">` +
  items.map((i) => `<li style="margin-bottom:0.35rem">${i}</li>`).join("") +
  `</ol>`;
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
  "Quality-tested products backed by a 12-month warranty",
  "Friendly local support from a team that knows keys and remotes",
  "Trade and wholesale pricing available for locksmiths and workshops",
];

const COVER_IMPORTANT = (vehicle: string) => [
  "<strong>Important:</strong> This is a protective key cover only — the key, blade, transponder and electronics are not included.",
  `This cover is moulded to suit the ${vehicle} key style shown in the images — please compare your key's shape and button layout before ordering.`,
  "If you are unsure, send the All Remotes team a photo of your key and we will confirm fitment.",
];

// ---------- Title rephrase ----------
// "Key cover to suit Mazda A3 Gun Colour Zinc Alloy + BMW Colour Silicone"
//  -> "Mazda A3 Key Cover — Gunmetal Zinc Alloy with Silicone Stripes"
function rephrase(title: string): { name: string; vehicle: string } {
  const m = title.match(/^Key cover to suit\s+(.+?)\s+Gun Colour Zinc Alloy/i);
  const vehicle = (m ? m[1] : title.replace(/^Key cover to suit\s+/i, "")).trim();
  return {
    vehicle,
    name: `${vehicle} Key Cover — Gunmetal Zinc Alloy with Silicone Stripes`,
  };
}

function buildContent(vehicle: string, sku: string) {
  const description =
    `<h1 class="text-2xl font-bold text-neutral-900" style="margin-bottom:0.75rem">${vehicle} Key Cover — Gunmetal Zinc Alloy with Silicone Stripes</h1><br/>` +
    `<p style="margin-bottom:0.75rem">Protect and personalise your ${vehicle} key with this premium key cover. A gunmetal-finish zinc alloy frame paired with soft-touch silicone side stripes gives the key a distinctive look while shielding it from scratches, scuffs and everyday wear. Precision-moulded for a secure fit, it keeps every button and function fully accessible without adding bulk.</p><br/>` +
    `<h2>What's Included</h2>` +
    ul([`1 × Gunmetal zinc alloy + silicone key cover to suit the ${vehicle} key style pictured (key not included)`]) +
    `<br/>` +
    `<h2>Important Information</h2>` +
    ul(COVER_IMPORTANT(vehicle)) +
    `<br/>` +
    `<h2>Why Choose All Remotes?</h2>` +
    ul(WHY_ALLREMOTES);

  const features = ul([
    "Gunmetal-finish zinc alloy frame for strength and durability",
    "Soft-touch silicone side stripes for grip and style",
    "Helps protect the key from scratches, marks and daily wear",
    "Precision-moulded design for a secure, snug fit",
    "Full access to all buttons and key functions",
    "Slim, lightweight construction — no added bulk",
    "Easy installation, no tools required",
  ]);

  const specification = specTable([
    ["Product Type", "Key Cover"],
    ["Material", "Zinc alloy frame + silicone accents"],
    ["Finish", "Gunmetal with striped silicone detail"],
    ["Suits", `${vehicle} key style — compare with product images`],
    ["What's Included", "1 × key cover (key not included)"],
    ["SKU", sku],
    ["Warranty", "12 Months"],
  ]);

  const compatibility =
    `<p style="margin-bottom:0.75rem">This cover is designed to suit the ${vehicle} key style shown in the product images.</p><br/>` +
    ul([
      `${vehicle} keys matching the shape and button layout pictured`,
      "Cover fit is determined by key shape, not vehicle year — always compare your key to the photos",
      "Key, blade, transponder and electronics are not included",
    ]);

  const instructions =
    `<h4 class="text-base font-semibold text-neutral-900" style="margin-top:1rem;margin-bottom:0.5rem">Installation</h4><br/>` +
    ol([
      "Make sure your key is clean and dry.",
      "Place the key into the silicone-lined cover, aligning the buttons with the openings.",
      "Press the cover halves together until they seat firmly around the key.",
    ]) +
    `<br/>` +
    `<h4 class="text-base font-semibold text-neutral-900" style="margin-top:1rem;margin-bottom:0.5rem">Removal</h4><br/>` +
    ol([
      "Gently flex the silicone edge and lift the cover away from the key.",
      "No tools are required — do not force the cover, as this can mark the key.",
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
      p.variants?.[0]?.sku?.startsWith("RK-KC-")
  );
  console.log(`RK key covers with images: ${products.length}`);

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

    const { name, vehicle } = rephrase(p.title);
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

    const c = buildContent(vehicle, sku);
    const now = new Date().toISOString();
    const doc: Record<string, any> = {
      id: crypto.randomUUID(),
      sku,
      skuKey: sku.toLowerCase(),
      name,
      brand: p.vendor || "",
      category: "automotive",
      cat1: "automotive",
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
      seo_title: `${vehicle} Key Cover — Zinc Alloy + Silicone | All Remotes`,
      tags: ["key cover", "automotive", String(p.vendor || "").toLowerCase(), "accessories"].filter(Boolean),
      inventoryRefreshedAt: now,
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      lastUpdatedBy: "devin",
    };

    if (DRY) {
      console.log(`  [dry] ${name} | $${price} | stock ${stock} | imgs ${p.images.length} | ${rkUrl}`);
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

#!/usr/bin/env tsx
/**
 * Import Chipolo key-finders from Remote King (Shopify) into the catalog.
 * RK is rate-limited for us — all fetches go through PROXY_URL.
 *
 * Pricing rule: market - <=$1, floored at $48 (POP) / $90 (CARD).
 * Market anchors: POP cheapest AU ~$46-47 (below floor) -> $48;
 *                 CARD AU market ~$65 but cost floor $90 -> $90.
 *
 *   npx tsx scripts/import-keyfinders.ts --dry    # preview only
 *   npx tsx scripts/import-keyfinders.ts          # import + mirror images
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const DRY = process.argv.includes("--dry");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PRODUCTS = [
  { handle: "chipolo-pop-bluetooth-tracker-battery-black", sku: "AR-CPOP-BLK", color: "Black", price: 48 },
  { handle: "chipolo-pop-bluetooth-tracker-battery-blue", sku: "AR-CPOP-BLU", color: "Blue", price: 48 },
  { handle: "chipolo-pop-bluetooth-tracker-battery-red", sku: "AR-CPOP-R", color: "Red", price: 48 },
  { handle: "chipolo-pop-bluetooth-tracker-battery-yellow", sku: "AR-CPOP-Y", color: "Yellow", price: 48 },
  { handle: "chipolo-pop-bluetooth-tracker-battery-white", sku: "AR-CPOP-W", color: "White", price: 48 },
  { handle: "chipolo-pop-bluetooth-tracker-battery-green", sku: "AR-CPOP-G", color: "Green", price: 48 },
  { handle: "chipolo-card-bluetooth-tracker-rechargeable", sku: "AR-CCARD", color: "White", price: 90 },
];

const bucket = process.env.S3_BUCKET_NAME || "allremotes";
const region = process.env.S3_REGION || process.env.AWS_REGION || "ap-southeast-2";
const s3 = new S3Client({
  region,
  requestChecksumCalculation: "WHEN_REQUIRED" as any,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ul = (items: string[]) =>
  `<ul style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:disc">` +
  items.map((i) => `<li style="margin-bottom:0.35rem">${i}</li>`).join("") + `</ul>`;

(async () => {
  const { ProxyAgent, fetch: ufetch } = await import("undici");
  const proxy = new ProxyAgent(process.env.PROXY_URL!);
  const get = (url: string) => ufetch(url, { dispatcher: proxy as any });

  const c = new MongoClient(process.env.MONGODB_URI!);
  await c.connect();
  const db = c.db("allremotes");

  for (const def of PRODUCTS) {
    const res = await get(`https://www.remoteking.com.au/products/${def.handle}.js`);
    const rk: any = await res.json();
    const rkSku = rk.variants?.[0]?.sku || "";
    console.log(`\n${def.sku} <- ${rk.title} (RK ${rkSku} $${rk.price / 100 ?? rk.variants?.[0]?.price})`);

    if (DRY) { console.log(`   DRY price $${def.price}, imgs ${(rk.images || []).length}`); continue; }

    // mirror up to 5 images
    const images: string[] = [];
    const srcImgs: string[] = (rk.images || []).slice(0, 5);
    for (let i = 0; i < srcImgs.length; i++) {
      const imgRes = await get(srcImgs[i].startsWith("//") ? `https:${srcImgs[i]}` : srcImgs[i]);
      if (!imgRes.ok) { console.log(`   img ${i + 1} fetch ${imgRes.status}`); continue; }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ext = (imgRes.headers.get("content-type") || "").includes("png") ? "png" : "jpg";
      const key = `images/${def.sku}-${i + 1}.${ext}`;
      await s3.send(new PutObjectCommand({
        Bucket: bucket, Key: key, Body: buf,
        ContentType: ext === "png" ? "image/png" : "image/jpeg",
        CacheControl: "public, max-age=31536000",
      }));
      images.push(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
      await sleep(300);
    }
    console.log(`   mirrored ${images.length} images`);

    const isCard = def.sku === "AR-CCARD";
    const desc = `
<h1 class="text-2xl font-bold text-neutral-900" style="margin-bottom:0.75rem">${rk.title}</h1><br/>
<p style="margin-bottom:0.75rem">${isCard
  ? "A slim rechargeable tracker card that slips into your wallet seamlessly. Water and dust resistant, up to 120m Bluetooth range to ring, or locate anywhere via Apple's Find My network / Google's Find Hub — no range limit. Just 2.5mm thin and Qi-wireless rechargeable with up to 6 months per charge. Manufactured in Europe."
  : "A vibrant tracker to keep track of your keys, bag, luggage and more. Water and dust resistant, up to 90m Bluetooth range to ring, or locate anywhere via Apple's Find My network / Google's Find Hub — no range limit. Battery lasts up to 1 year and is replaceable (CR2032). Manufactured in Europe."}</p><br/>
<h2>Works With Both Platforms</h2>
${ul([
  "Apple Find My network (iPhone / iPad / Apple Watch)",
  "Google Find Hub network (Android 9+ with Google Play Services)",
  "Free Chipolo companion app — Call Your Phone, selfie shutter, custom ringtone",
])}<br/>
<h2>Why Chipolo Over The Others</h2>
${ul([
  "Works with both Apple Find My AND Google Find Hub — not locked to one ecosystem",
  "Loud ring (up to 120dB on POP) with adjustable ringtone",
  "No extra accessory needed — built-in keyring hole (POP) / wallet-thin (CARD)",
  "Manufactured in Europe for premium quality",
])}<br/>
<h2>Why Choose All Remotes?</h2>
${ul([
  "Australian owned and operated with fast Australia-wide shipping",
  "Genuine products backed by 12-month warranty",
  "Friendly local support",
])}`;

    const doc: any = {
      id: crypto.randomUUID(),
      sku: def.sku,
      skuKey: def.sku.toLowerCase(),
      name: isCard
        ? "Chipolo CARD Bluetooth Tracker — Rechargeable Wallet Finder"
        : `Chipolo POP Bluetooth Tracker — ${def.color}`,
      brand: "Chipolo",
      category: "home",
      cat1: "home",
      cat2: "key-finders",
      status: "active",
      price: def.price,
      comparePrice: rk.variants?.[0]?.price ? Number(rk.variants[0].price) / 100 : null,
      inStock: true,
      stock: 0,
      image: images[0] || "",
      images,
      imgIndex: 0,
      description: desc,
      features: ul(isCard
        ? ["85.2 × 53.6 × 2.5mm — as thin as two credit cards", "Qi wireless rechargeable — up to 6 months per charge", "IP67 water & dust resistant", "Bluetooth range up to 120m", "Loud ring up to ~110dB", "Apple Find My & Google Find Hub compatible"]
        : ["38.8 × 6.6mm — lightweight keyring tag", "Replaceable CR2032 battery — up to 1 year", "IP55 water & dust resistant", "Bluetooth range up to 90m", "Loud ring up to 120dB", "Apple Find My & Google Find Hub compatible"]),
      compatibility: isCard
        ? "iPhone/iPad (Apple Find My app) or Android 9+ phone/tablet (Google Find Hub). Qi wireless charger required for recharging (not included)."
        : "iPhone/iPad (Apple Find My app) or Android 9+ phone/tablet (Google Find Hub).",
      condition: "Brand New",
      returns: "Covered by 12-month warranty. Contact us to lodge a warranty claim.",
      seller: "AllRemotes (100% positive)",
      seo_title: rk.title,
      tags: "key-finder,bluetooth-tracker,chipolo,find-my,find-hub" + (isCard ? ",wallet-tracker,rechargeable" : `,${def.color.toLowerCase()}`),
      rk_sku: rkSku,
      rk_url: `https://www.remoteking.com.au/products/${def.handle}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: "import-keyfinders",
    };

    await db.collection("products").updateOne({ sku: def.sku }, { $set: doc }, { upsert: true });
    console.log(`   INSERTED $${def.price} (${images.length} imgs)`);
    await sleep(500);
  }

  console.log("\nDONE");
  await c.close();
  process.exit(0);
})();

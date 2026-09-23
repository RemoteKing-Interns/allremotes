/**
 * Import Key Covers from RemoteKing with AI-style poster images.
 *
 * For each RK product with an image:
 *   1. Mirror the source image to S3 (images/{sku}-1.jpg)
 *   2. Compose a branded poster (same canvas logic as ProductImageGen)
 *      and upload to S3 (images/{sku}-ai-{ts}.png)
 *   3. Insert the product as ACTIVE with the poster as the main image
 *
 * Usage:
 *   npx tsx scripts/gen-keycover-posters.ts --sku RK-KC-MZD-A3   # one
 *   npx tsx scripts/gen-keycover-posters.ts --dry               # list only
 *   npx tsx scripts/gen-keycover-posters.ts                     # all
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { readdirSync } from "fs";
import { join } from "path";

// ---------- Fonts ----------
// @napi-rs/canvas needs explicit font registration on some platforms.
// Try Windows system fonts; skip silently if not found.
try {
  const fontsDir = "C:\\Windows\\Fonts";
  for (const f of ["arial.ttf", "arialbd.ttf", "ariblk.ttf"]) {
    try { GlobalFonts.registerFromPath(join(fontsDir, f), "Arial"); } catch {}
  }
} catch {}

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
      (a: number, i: any) => a + (i.AvailableQty ?? i.QtyOnHand ?? 0), 0
    );
  } catch { return 0; }
}

// ---------- S3 ----------
function s3Config() {
  return {
    region: process.env.S3_REGION || process.env.AWS_REGION || "",
    bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  };
}
const s3 = () => new S3Client({
  region: s3Config().region,
  credentials: {
    accessKeyId: s3Config().accessKeyId,
    secretAccessKey: s3Config().secretAccessKey,
  },
});

async function s3Put(key: string, buf: Buffer, contentType: string): Promise<string> {
  const cfg = s3Config();
  await s3().send(new PutObjectCommand({
    Bucket: cfg.bucket, Key: key, Body: buf, ContentType: contentType,
    CacheControl: "public, max-age=31536000",
  }));
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`;
}

async function mirrorImage(url: string, keyName: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = (res.headers.get("content-type") || "image/jpeg").includes("png") ? "png" : "jpg";
  return s3Put(`images/${keyName}.${ext}`, buf, ext === "png" ? "image/png" : "image/jpeg");
}

// ---------- HTML content (house format) ----------
const ul = (items: string[]) =>
  `<ul style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:disc">` +
  items.map((i) => `<li style="margin-bottom:0.35rem">${i}</li>`).join("") + `</ul>`;
const ol = (items: string[]) =>
  `<ol style="margin-bottom:0.75rem;padding-left:1.25rem;list-style-type:decimal">` +
  items.map((i) => `<li style="margin-bottom:0.35rem">${i}</li>`).join("") + `</ol>`;
const td = (v: string) => `<td style="padding:0.75rem;text-align:left;border:1px solid #e5e7eb">${v}</td>`;
const th = (v: string) => `<th style="padding:0.75rem;text-align:left;border:1px solid #e5e7eb;background-color:#f3f4f6;font-weight:700">${v}</th>`;
const specTable = (rows: [string, string][]) =>
  `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:1rem">` +
  `<tr>${th("Specification")}${th("Details")}</tr>` +
  rows.map(([k, v]) => `<tr>${td(k)}${td(v)}</tr>`).join("") + `</table>`;

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

function rephrase(title: string): { name: string; vehicle: string } {
  const m = title.match(/^Key cover to suit\s+(.+?)\s+Gun Colour Zinc Alloy/i);
  const vehicle = (m ? m[1] : title.replace(/^Key cover to suit\s+/i, "")).trim();
  return { vehicle, name: `${vehicle} Key Cover — Gunmetal Zinc Alloy with Silicone Stripes` };
}

function buildContent(vehicle: string, sku: string) {
  const description =
    `<h1 class="text-2xl font-bold text-neutral-900" style="margin-bottom:0.75rem">${vehicle} Key Cover — Gunmetal Zinc Alloy with Silicone Stripes</h1><br/>` +
    `<p style="margin-bottom:0.75rem">Protect and personalise your ${vehicle} key with this premium key cover. A gunmetal-finish zinc alloy frame paired with soft-touch silicone side stripes gives the key a distinctive look while shielding it from scratches, scuffs and everyday wear. Precision-moulded for a secure fit, it keeps every button and function fully accessible without adding bulk.</p><br/>` +
    `<h2>What's Included</h2>` + ul([`1 × Gunmetal zinc alloy + silicone key cover to suit the ${vehicle} key style pictured (key not included)`]) + `<br/>` +
    `<h2>Important Information</h2>` + ul(COVER_IMPORTANT(vehicle)) + `<br/>` +
    `<h2>Why Choose All Remotes?</h2>` + ul(WHY_ALLREMOTES);

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
    ol(["Make sure your key is clean and dry.", "Place the key into the silicone-lined cover, aligning the buttons with the openings.", "Press the cover halves together until they seat firmly around the key."]) +
    `<br/><h4 class="text-base font-semibold text-neutral-900" style="margin-top:1rem;margin-bottom:0.5rem">Removal</h4><br/>` +
    ol(["Gently flex the silicone edge and lift the cover away from the key.", "No tools are required — do not force the cover, as this can mark the key."]);

  return { description, features, specification, compatibility, instructions };
}

// ---------- Canvas poster (ported from ProductImageGen.tsx) ----------
const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim() : "";

const buildFeatureBullets = (featuresHtml: string): string[] => {
  const matches = [...featuresHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripHtml(m[1])).filter(Boolean);
  const fallback = [
    "Gunmetal zinc alloy frame for durability",
    "Soft-touch silicone stripes for grip and style",
    "Protects against scratches, marks and daily wear",
    "Precision-moulded for a secure, snug fit",
    "Full access to all buttons and key functions",
    "Australian owned & operated with fast shipping",
  ];
  const combined = matches.length ? matches.slice(0, 6) : fallback;
  while (combined.length < 6) combined.push(fallback[combined.length % fallback.length]);
  return combined.slice(0, 6);
};

const buildSpecHighlights = (specHtml: string): [string, string][] => {
  const rows = [...specHtml.matchAll(/<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi)]
    .map((m) => [stripHtml(m[1]), stripHtml(m[2])] as [string, string])
    .filter(([l, v]) => l && v && v !== "—");
  const priority = ["Material", "Finish", "Suits", "Warranty", "Product Type", "Brand"];
  const picked: [string, string][] = [];
  for (const key of priority) {
    const row = rows.find(([l]) => l.toLowerCase() === key.toLowerCase());
    if (row && !picked.includes(row)) picked.push(row);
    if (picked.length === 4) break;
  }
  for (const row of rows) {
    if (picked.length === 4) break;
    if (!picked.includes(row)) picked.push(row);
  }
  while (picked.length < 4) picked.push(["Warranty", "12 Months"]);
  return picked.slice(0, 4);
};

function drawWrappedText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number = Infinity) {
  const chars = text.split("");
  let line = "", cy = y, linesDrawn = 0;
  const flush = (final: boolean = false) => {
    if (!line.trim()) return;
    if (final && linesDrawn + 1 > maxLines) return;
    let out = line.trim();
    if (!final && linesDrawn + 1 >= maxLines) {
      let suffix = "…";
      while (out.length > 0 && ctx.measureText(out + suffix).width > maxWidth) out = out.slice(0, -1);
      out += suffix;
    }
    ctx.fillText(out, x, cy);
    linesDrawn++; cy += lineHeight; line = "";
  };
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      if (linesDrawn + 1 >= maxLines) {
        let out = line.trim(); const suffix = "…";
        while (out.length > 0 && ctx.measureText(out + suffix).width > maxWidth) out = out.slice(0, -1);
        ctx.fillText(out + suffix, x, cy); return;
      }
      ctx.fillText(line.trim(), x, cy); linesDrawn++; cy += lineHeight; line = chars[i];
    } else { line = test; }
  }
  if (line.trim()) flush(true);
}

function drawCheckIcon(ctx: any, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = Math.max(1.5, r * 0.18);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy); ctx.lineTo(cx - r * 0.1, cy + r * 0.4); ctx.lineTo(cx + r * 0.5, cy - r * 0.35);
  ctx.stroke(); ctx.restore();
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function removeBackground(canvas: any, threshold = 45) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const sample = (x: number, y: number) => [
    data[(y * w + x) * 4], data[(y * w + x) * 4 + 1], data[(y * w + x) * 4 + 2], data[(y * w + x) * 4 + 3],
  ];
  const corners = [sample(0, 0), sample(w - 1, 0), sample(0, h - 1), sample(w - 1, h - 1)];
  const bg = [
    Math.round(corners.reduce((a, c) => a + c[0], 0) / 4),
    Math.round(corners.reduce((a, c) => a + c[1], 0) / 4),
    Math.round(corners.reduce((a, c) => a + c[2], 0) / 4),
    Math.round(corners.reduce((a, c) => a + c[3], 0) / 4),
  ];
  const matches = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    const d = Math.sqrt(Math.pow(data[i] - bg[0], 2) + Math.pow(data[i + 1] - bg[1], 2) + Math.pow(data[i + 2] - bg[2], 2) + Math.pow(data[i + 3] - bg[3], 2));
    return d < threshold;
  };
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  const visited = new Uint8Array(w * h);
  const add = (x: number, y: number) => {
    const idx = y * w + x;
    if (!visited[idx] && matches(x, y)) { visited[idx] = 1; queue[tail++] = idx; }
  };
  for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { add(0, y); add(w - 1, y); }
  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w, y = Math.floor(idx / w);
    data[idx * 4 + 3] = 0;
    if (x > 0) add(x - 1, y); if (x < w - 1) add(x + 1, y);
    if (y > 0) add(x, y - 1); if (y < h - 1) add(x, y + 1);
  }
  ctx.putImageData(img, 0, 0);
}

function getBoundingBox(ctx: any, w: number, h: number) {
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 10) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  return { x: minX, y: minY, w: Math.max(1, maxX - minX + 1), h: Math.max(1, maxY - minY + 1) };
}

async function composePoster(imageBuffer: Buffer, product: { name: string; brand: string; sku: string; features: string; specification: string }): Promise<Buffer> {
  const productImg = await loadImage(imageBuffer);
  const W = 1200, H = 1600;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#eef2f7"); bgGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = "#1d4ed8";
  for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 8; gx++) {
    ctx.beginPath(); ctx.arc(W - 40 - gx * 26, 40 + gy * 26, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  const pad = Math.round(W * 0.06);
  const bannerH = Math.round(H * 0.2);
  const bannerGrad = ctx.createLinearGradient(0, 0, W, bannerH);
  bannerGrad.addColorStop(0, "#0b1e3d"); bannerGrad.addColorStop(1, "#132a52");
  ctx.fillStyle = bannerGrad; ctx.fillRect(0, 0, W, bannerH);

  const brand = (product.brand || "").trim();
  let title = product.name || "Key Cover";
  if (brand && title.toLowerCase().startsWith(brand.toLowerCase())) title = title.slice(brand.length).trim();

  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  const bannerTextW = W - pad * 2;
  let cursorY = Math.round(bannerH * 0.32);
  if (brand) {
    ctx.fillStyle = "#60a5fa";
    ctx.font = `800 ${Math.round(W * 0.045)}px Arial, sans-serif`;
    drawWrappedText(ctx, brand.toUpperCase(), pad, cursorY, bannerTextW, Math.round(W * 0.05), 1);
    cursorY += Math.round(W * 0.05);
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(W * 0.036)}px Arial, sans-serif`;
  drawWrappedText(ctx, title, pad, cursorY, bannerTextW, Math.round(W * 0.046), 2);

  ctx.fillStyle = "#9fb4d8";
  ctx.font = `600 ${Math.round(W * 0.017)}px Arial, sans-serif`;
  drawWrappedText(ctx, "GENUINE REPLACEMENT  •  FAST AUSTRALIA-WIDE SHIPPING", pad, bannerH - Math.round(H * 0.02), bannerTextW, Math.round(W * 0.022), 1);

  const productTop = bannerH + Math.round(H * 0.02);
  const productAreaH = Math.round(H * 0.32);
  const maxSrc = 1400;
  const srcScale = Math.min(1, maxSrc / Math.max(productImg.width, productImg.height));
  const srcW = Math.round(productImg.width * srcScale);
  const srcH = Math.round(productImg.height * srcScale);
  const srcCanvas = createCanvas(srcW, srcH);
  const srcCtx = srcCanvas.getContext("2d");
  srcCtx.drawImage(productImg, 0, 0, srcW, srcH);
  removeBackground(srcCanvas, 40);

  const bbox = getBoundingBox(srcCtx, srcW, srcH);
  const cropCanvas = createCanvas(bbox.w, bbox.h);
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(srcCanvas, -bbox.x, -bbox.y);

  const targetW = W - pad * 2.4;
  const scale = Math.min(targetW / bbox.w, productAreaH / bbox.h, 1.15);
  const drawW = bbox.w * scale, drawH = bbox.h * scale;
  const drawX = (W - drawW) / 2;
  const drawY = productTop + (productAreaH - drawH) / 2;

  ctx.save();
  ctx.translate(drawX + drawW / 2, drawY + drawH + Math.max(6, drawH * 0.02));
  ctx.scale(1, 0.16);
  const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, drawW / 2);
  shadowGrad.addColorStop(0, "rgba(15, 30, 60, 0.30)");
  shadowGrad.addColorStop(1, "rgba(15, 30, 60, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath(); ctx.arc(0, 0, drawW / 2.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.drawImage(cropCanvas, drawX, drawY, drawW, drawH);

  const bulletsY = productTop + productAreaH + Math.round(H * 0.03);
  const bullets = buildFeatureBullets(product.features);
  const colGap = Math.round(W * 0.06);
  const colW = (W - pad * 2 - colGap) / 2;
  const rowH = Math.round(H * 0.075);
  const drawBulletCol = (items: string[], x: number) => {
    items.forEach((text, i) => {
      const y = bulletsY + i * rowH;
      drawCheckIcon(ctx, x + 14, y + 8, 14, "#1d4ed8");
      ctx.fillStyle = "#0f172a";
      ctx.font = `500 ${Math.round(W * 0.0165)}px Arial, sans-serif`;
      ctx.textAlign = "left";
      drawWrappedText(ctx, text, x + 38, y + 2, colW - 38, Math.round(W * 0.021), 2);
    });
  };
  drawBulletCol(bullets.slice(0, 3), pad);
  drawBulletCol(bullets.slice(3, 6), pad + colW + colGap);

  const specRows = buildSpecHighlights(product.specification);
  const stripH = Math.round(H * 0.14);
  const stripY = H - stripH - Math.round(H * 0.06);
  ctx.fillStyle = "#f1f5f9"; ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
  roundRect(ctx, pad, stripY, W - pad * 2, stripH, 16);
  ctx.fill(); ctx.stroke();

  const boxW = (W - pad * 2) / specRows.length;
  specRows.forEach(([label, value], i) => {
    const x = pad + i * boxW;
    if (i > 0) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath(); ctx.moveTo(x, stripY + stripH * 0.2); ctx.lineTo(x, stripY + stripH * 0.8); ctx.stroke();
    }
    const boxTextW = boxW - 24;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#64748b";
    ctx.font = `700 ${Math.round(W * 0.014)}px Arial, sans-serif`;
    drawWrappedText(ctx, label.toUpperCase(), x + boxW / 2, stripY + stripH * 0.38, boxTextW, Math.round(W * 0.016), 1);
    ctx.fillStyle = "#0f172a";
    ctx.font = `700 ${Math.round(W * 0.019)}px Arial, sans-serif`;
    drawWrappedText(ctx, value, x + boxW / 2, stripY + stripH * 0.68, boxTextW, Math.round(W * 0.021), 1);
  });

  const barH = Math.round(H * 0.045);
  ctx.fillStyle = "#0b1e3d"; ctx.fillRect(0, H - barH, W, barH);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${Math.round(W * 0.017)}px Arial, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  drawWrappedText(ctx, `SKU: ${product.sku}   •   12 Month Warranty   •   allremotes.com.au`, W / 2, H - barH / 2 + 6, W - pad * 2, Math.round(W * 0.02), 1);

  return canvas.toBuffer("image/png");
}

// ---------- Main ----------
const DRY = process.argv.includes("--dry");
const skuIdx = process.argv.indexOf("--sku");
const onlyRkSku = skuIdx > -1 ? process.argv[skuIdx + 1] : null;

async function main() {
  const res = await fetch(RK_COLLECTION);
  const data = await res.json();
  const products: any[] = (data.products || []).filter(
    (p: any) => (p.images || []).length > 0 && p.variants?.[0]?.sku?.startsWith("RK-KC-")
  );
  console.log(`RK key covers with images: ${products.length}`);

  const mongo = new MongoClient(process.env.MONGODB_URI!);
  await mongo.connect();
  const col = (process.env.MONGODB_DB ? mongo.db(process.env.MONGODB_DB) : mongo.db()).collection("products");

  let done = 0, skipped = 0, failed = 0;
  for (const p of products) {
    const rkSku = String(p.variants[0].sku).trim();
    if (onlyRkSku && rkSku !== onlyRkSku) continue;
    const sku = rkSku.replace(/^RK-/, "AR-");
    console.log(`\n[${done + skipped + failed + 1}] ${rkSku} -> ${sku}`);

    const existing = await col.findOne({ $or: [{ sku }, { rk_sku: rkSku }] });
    if (existing) {
      console.log("  already exists, skipping.");
      skipped++;
      continue;
    }

    const { name, vehicle } = rephrase(p.title);
    const price = Number(p.variants[0].price) || 0;
    const comparePrice = Math.round(price * 0.9 * 100) / 100;
    const stock = await getStock(rkSku);
    const rkUrl = RK_PRODUCT_URL(p.handle);
    const c = buildContent(vehicle, sku);

    if (DRY) {
      console.log(`  [dry] ${name} | $${price} | stock ${stock}`);
      done++;
      continue;
    }

    try {
      // 1. Mirror original image
      const srcUrl = p.images[0].src;
      const srcRes = await fetch(srcUrl);
      const srcBuf = Buffer.from(await srcRes.arrayBuffer());
      const ext = (srcRes.headers.get("content-type") || "image/jpeg").includes("png") ? "png" : "jpg";
      const originalUrl = await s3Put(`images/${sku}-1.${ext}`, srcBuf, ext === "png" ? "image/png" : "image/jpeg");

      // 2. Compose poster
      const posterBuf = await composePoster(srcBuf, {
        name, brand: p.vendor || "", sku, features: c.features, specification: c.specification,
      });
      const posterUrl = await s3Put(`images/${sku}-ai-${Date.now()}.png`, posterBuf, "image/png");

      // 3. Insert as active
      const now = new Date().toISOString();
      await col.insertOne({
        id: crypto.randomUUID(), sku, skuKey: sku.toLowerCase(),
        name, brand: p.vendor || "", category: "automotive", cat1: "automotive", cat2: "key-covers",
        status: "active", price, comparePrice,
        inStock: stock >= 1 || Boolean(p.variants[0].available), stock,
        image: posterUrl, images: [posterUrl, originalUrl], imgIndex: 0,
        ...c, rk_sku: rkSku, rk_url: rkUrl,
        condition: "Brand New",
        returns: "Returns accepted within 30 days. Must be in original, resaleable condition. Buyer pays return shipping.",
        seller: "AllRemotes (100% positive)",
        seo_title: `${vehicle} Key Cover — Zinc Alloy + Silicone | All Remotes`,
        tags: ["key cover", "automotive", String(p.vendor || "").toLowerCase(), "accessories"].filter(Boolean),
        inventoryRefreshedAt: now, createdAt: now, updatedAt: now, lastUpdated: now, lastUpdatedBy: "devin",
      });
      console.log(`  ✓ active | poster + original uploaded`);
      done++;
    } catch (e: any) {
      console.error(`  ✗ failed: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== done: ${done}, skipped: ${skipped}, failed: ${failed} ===`);
  await mongo.close();
}

main().catch((e) => { console.error(e); process.exit(1); });

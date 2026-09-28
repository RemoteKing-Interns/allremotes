/**
 * Generate branded poster images for the imported battery products and
 * promote the poster to the product's main image.
 *
 * Reads products from MongoDB (cat1: "batteries"), downloads the existing
 * S3 image, composes the same poster layout as gen-keycover-posters.ts,
 * uploads it, then sets image/images[0] to the poster.
 *
 * Re-runnable: products whose main image is already a poster are skipped.
 *
 * Usage:
 *   npx tsx scripts/gen-battery-posters.ts --sku AR-PS2032-5   # one
 *   npx tsx scripts/gen-battery-posters.ts --dry              # list only
 *   npx tsx scripts/gen-battery-posters.ts                    # all
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { join } from "path";

// ---------- Fonts ----------
try {
  const fontsDir = "C:\\Windows\\Fonts";
  for (const f of ["arial.ttf", "arialbd.ttf", "ariblk.ttf"]) {
    try { GlobalFonts.registerFromPath(join(fontsDir, f), "Arial"); } catch {}
  }
} catch {}

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

// ---------- Poster text extraction ----------
const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim() : "";

const buildFeatureBullets = (featuresHtml: string): string[] => {
  const matches = [...featuresHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripHtml(m[1])).filter(Boolean);
  const fallback = [
    "Genuine brand-name battery",
    "Long shelf life, leak-resistant build",
    "Ideal for remotes and key fobs",
    "Retail packed",
    "Fresh stock",
    "Fast Australia-wide shipping",
  ];
  const combined = matches.length ? matches.slice(0, 6) : fallback;
  while (combined.length < 6) combined.push(fallback[combined.length % fallback.length]);
  return combined.slice(0, 6);
};

const buildSpecHighlights = (specHtml: string): [string, string][] => {
  const rows = [...specHtml.matchAll(/<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi)]
    .map((m) => [stripHtml(m[1]), stripHtml(m[2])] as [string, string])
    .filter(([l, v]) => l && v && v !== "—");
  const priority = ["Battery Model", "Voltage", "Pack Size", "Brand", "Product Type"];
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
  let title = product.name || "Battery";
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
  drawWrappedText(ctx, "GENUINE BATTERIES  •  FRESH STOCK  •  FAST AUSTRALIA-WIDE SHIPPING", pad, bannerH - Math.round(H * 0.02), bannerTextW, Math.round(W * 0.022), 1);

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
const onlySku = skuIdx > -1 ? process.argv[skuIdx + 1] : null;

async function main() {
  const mongo = new MongoClient(process.env.MONGODB_URI!);
  await mongo.connect();
  const col = (process.env.MONGODB_DB ? mongo.db(process.env.MONGODB_DB) : mongo.db()).collection("products");

  const filter: Record<string, any> = { cat1: "batteries" };
  if (onlySku) filter.sku = onlySku;
  const products = await col.find(filter).toArray();
  console.log(`battery products: ${products.length}`);

  let done = 0, skipped = 0, failed = 0;
  for (const p of products) {
    console.log(`\n[${done + skipped + failed + 1}] ${p.sku} ${p.name}`);
    if (!p.image) { console.log("  no image, skipping"); skipped++; continue; }
    if (String(p.image).includes("-ai-")) { console.log("  already has poster, skipping"); skipped++; continue; }

    if (DRY) {
      console.log(`  [dry] would compose poster from ${p.image}`);
      done++;
      continue;
    }

    try {
      const res = await fetch(p.image);
      if (!res.ok) throw new Error(`image fetch ${res.status}`);
      const srcBuf = Buffer.from(await res.arrayBuffer());

      const posterBuf = await composePoster(srcBuf, {
        name: p.name || "", brand: p.brand || "", sku: p.sku,
        features: p.features || "", specification: p.specification || "",
      });
      const posterUrl = await s3Put(`images/${p.sku}-ai-${Date.now()}.png`, posterBuf, "image/png");

      const images = [posterUrl, ...(p.images || [])];
      const now = new Date().toISOString();
      await col.updateOne(
        { _id: p._id },
        { $set: { image: posterUrl, images, updatedAt: now, lastUpdated: now, lastUpdatedBy: "devin" } }
      );
      console.log(`  ✓ poster set as main image`);
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

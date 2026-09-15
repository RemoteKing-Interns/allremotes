#!/usr/bin/env tsx
/**
 * Query a TEMU product detail to see what fields were actually saved.
 * Usage: npx tsx scripts/temu-product-detail.ts <goodsId>
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { ProxyAgent, fetch as undiciFetch } from "undici";

const APP_KEY = process.env.TEMU_APP_KEY!;
const APP_SECRET = process.env.TEMU_APP_SECRET!;
const ACCESS_TOKEN = process.env.TEMU_ACCESS_TOKEN!;
const SITE = (process.env.TEMU_SITE || "global").toLowerCase();
const PROXY_URL = process.env.PROXY_URL || "";
const GOODS_ID = process.argv[2];

if (!GOODS_ID) {
  console.error("Usage: npx tsx scripts/temu-product-detail.ts <goodsId>");
  process.exit(1);
}

const ENDPOINTS: Record<string, string> = {
  us: "https://openapi-b-us.temu.com/openapi/router",
  eu: "https://openapi-b-eu.temu.com/openapi/router",
  global: "https://openapi-b-global.temu.com/openapi/router",
};

function sign(params: Record<string, unknown>, secret: string): string {
  const entries = Object.entries(params).map(([k, v]) => {
    const val = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
    return [k, val] as [string, string];
  });
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const joined = entries.map(([k, v]) => `${k}${v}`).join("");
  return crypto.createHash("md5").update(`${secret}${joined}${secret}`).digest("hex").toUpperCase();
}

const dispatcher = PROXY_URL ? new ProxyAgent({ uri: PROXY_URL }) : undefined;

async function call(type: string, businessParams: Record<string, unknown>) {
  const params: Record<string, unknown> = {
    type,
    app_key: APP_KEY,
    access_token: ACCESS_TOKEN,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    data_type: "JSON",
    ...businessParams,
  };
  const body = { ...params, sign: sign(params, APP_SECRET) };
  const res = await undiciFetch(ENDPOINTS[SITE], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    ...(dispatcher ? { dispatcher } : {}),
  } as any);
  const text = await res.text();
  return { status: res.status, text };
}

async function main() {
  console.log(`=== TEMU Product Detail: goodsId=${GOODS_ID} ===\n`);

  // Try bg.local.goods.detail.query
  console.log("--- bg.local.goods.detail.query ---");
  const r = await call("bg.local.goods.detail.query", { goodsId: Number(GOODS_ID) });
  console.log("HTTP:", r.status);
  try {
    const data = JSON.parse(r.text);
    if (data.success) {
      console.log("SUCCESS. Result keys:", Object.keys(data.result || {}));
      console.log(JSON.stringify(data.result, null, 2));
    } else {
      console.log("FAILED:", data.errorCode, data.errorMsg);
    }
  } catch {
    console.log(r.text.slice(0, 2000));
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });

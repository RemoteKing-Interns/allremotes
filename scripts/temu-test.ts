#!/usr/bin/env tsx
/**
 * Quick TEMU API test — calls bg.local.goods.cats.get (parentCatId=0)
 * to verify auth + signing + proxy all work end-to-end.
 *
 * Run: npx tsx scripts/temu-test.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import crypto from "crypto";
import { ProxyAgent, fetch as undiciFetch } from "undici";

const APP_KEY = process.env.TEMU_APP_KEY!;
const APP_SECRET = process.env.TEMU_APP_SECRET!;
const ACCESS_TOKEN = process.env.TEMU_ACCESS_TOKEN!;
const SITE = (process.env.TEMU_SITE || "global").toLowerCase();
const PROXY_URL = process.env.PROXY_URL!;

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

async function main() {
  console.log("=== TEMU API Test ===");
  console.log("Site:", SITE);
  console.log("Endpoint:", ENDPOINTS[SITE]);
  console.log("Proxy:", PROXY_URL ? PROXY_URL.replace(/:.*@/, ":***@") : "none");
  console.log("App Key:", APP_KEY?.slice(0, 6) + "...");
  console.log("Access Token:", ACCESS_TOKEN?.slice(0, 6) + "...");
  console.log();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, unknown> = {
    type: "bg.local.goods.cats.get",
    app_key: APP_KEY,
    access_token: ACCESS_TOKEN,
    timestamp,
    data_type: "JSON",
    parentCatId: 0,
  };
  const signValue = sign(params, APP_SECRET);
  const body = { ...params, sign: signValue };

  console.log("Request type: bg.local.goods.cats.get");
  console.log("Request body:", JSON.stringify(body, null, 2).replace(ACCESS_TOKEN, "***"));
  console.log();

  const dispatcher = PROXY_URL ? new ProxyAgent({ uri: PROXY_URL }) : undefined;
  try {
    const res = await undiciFetch(ENDPOINTS[SITE], {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      ...(dispatcher ? { dispatcher } : {}),
    } as any);
    const text = await res.text();
    console.log("HTTP Status:", res.status);
    console.log("Response:", text);
    const data = JSON.parse(text);
    if (data.success) {
      const cats = (data.result as any)?.goodsCatsList || [];
      console.log(`\n✅ SUCCESS — got ${cats.length} top-level categories`);
      cats.slice(0, 5).forEach((c: any) => {
        console.log(`  catId=${c.catId}  catName=${c.catName}  leaf=${c.leaf}  catType=${c.catType}`);
      });
    } else {
      console.log(`\n❌ FAILED — errorCode=${data.errorCode} errorMsg=${data.errorMsg}`);
    }
  } catch (e: any) {
    console.error("❌ Fetch error:", e.message);
    if (e.cause) console.error("Cause:", e.cause.message || e.cause);
  }
}

main();

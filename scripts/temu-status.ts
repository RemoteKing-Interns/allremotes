#!/usr/bin/env tsx
/**
 * List TEMU goods with their status + SKU prices.
 * Usage: npx tsx scripts/temu-status.ts [pageSize]
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
const PAGE_SIZE = Number(process.argv[2] || 10);

const EP: Record<string, string> = {
  us: "https://openapi-b-us.temu.com/openapi/router",
  eu: "https://openapi-b-eu.temu.com/openapi/router",
  global: "https://openapi-b-global.temu.com/openapi/router",
};

function sign(params: Record<string, unknown>, secret: string): string {
  const entries = Object.entries(params).map(([k, v]) =>
    [k, typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)] as [string, string]
  );
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return crypto.createHash("md5")
    .update(secret + entries.map(([k, v]) => k + v).join("") + secret)
    .digest("hex").toUpperCase();
}

const dispatcher = PROXY_URL ? new ProxyAgent({ uri: PROXY_URL }) : undefined;

async function call(type: string, businessParams: Record<string, unknown>) {
  const params: Record<string, unknown> = {
    type, app_key: APP_KEY, access_token: ACCESS_TOKEN,
    timestamp: Math.floor(Date.now() / 1000).toString(), data_type: "JSON",
    ...businessParams,
  };
  const res = await undiciFetch(EP[SITE], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...params, sign: sign(params, APP_SECRET) }),
    ...(dispatcher ? { dispatcher } : {}),
  } as any);
  return res.json();
}

async function main() {
  let pageNo = 1, seen = 0;
  while (seen < PAGE_SIZE) {
    const d: any = await call("bg.local.goods.list.query", { pageNo, pageSize: 50 });
    if (!d?.success) { console.error("API error:", JSON.stringify(d)); break; }
    const list = d?.result?.goodsList || [];
    if (list.length === 0) break;
    for (const g of list) {
      if (seen++ >= PAGE_SIZE) break;
      console.log(JSON.stringify(g));
    }
    if (list.length < 50) break;
    pageNo++;
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
